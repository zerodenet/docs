import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs'
import { dirname, join, normalize, relative, resolve, sep } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createMarkdownRenderer } from 'vitepress'

const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const docsRoot = join(repositoryRoot, 'docs')
const distRoot = join(docsRoot, '.vitepress', 'dist')
const projectsFile = join(docsRoot, '.vitepress', 'projects.json')
const navigationFile = join(docsRoot, '.vitepress', 'navigation.ts')
const checkDist = process.argv.includes('--dist')
const errors = []
let registeredProjects = []
const explicitNavigationEntries = new Set()

const toPosix = (path) => path.split(sep).join('/')

function projectIdForFile(file) {
  const projectRoot = join(docsRoot, 'projects')
  const projectPath = relative(projectRoot, file)
  if (projectPath.startsWith('..') || projectPath === '') return null
  return projectPath.split(sep)[0] || null
}

function walk(directory, predicate) {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const absolutePath = join(directory, entry.name)
    if (entry.isDirectory()) return walk(absolutePath, predicate)
    return predicate(absolutePath) ? [absolutePath] : []
  })
}

function report(file, message) {
  errors.push(`${toPosix(relative(repositoryRoot, file))}: ${message}`)
}

function decodeHtmlAttribute(value) {
  return value
    .replaceAll('&quot;', '"')
    .replaceAll('&#39;', "'")
    .replaceAll('&lt;', '<')
    .replaceAll('&gt;', '>')
    .replaceAll('&amp;', '&')
}

function decodeHash(value) {
  try {
    return decodeURIComponent(value)
  } catch {
    return value
  }
}

function resolveLocalTarget(sourceFile, rawTarget) {
  const target = decodeURI(rawTarget.split('#')[0].split('?')[0])
  if (!target) return null

  const base = target.startsWith('/') ? docsRoot : dirname(sourceFile)
  const candidate = normalize(resolve(base, target.replace(/^\//, '')))
  const relativeCandidate = relative(docsRoot, candidate)

  if (relativeCandidate.startsWith('..') || relativeCandidate === '') {
    return relativeCandidate === '' ? join(docsRoot, 'index.md') : null
  }

  const candidates = [candidate]
  if (!candidate.endsWith('.md')) {
    candidates.push(`${candidate}.md`, join(candidate, 'index.md'))
    candidates.push(join(docsRoot, 'public', relativeCandidate))
  }

  return candidates.find((path) => existsSync(path) && statSync(path).isFile()) ?? null
}

if (!existsSync(projectsFile)) {
  errors.push('docs/.vitepress/projects.json: 项目注册表不存在')
} else {
  const projects = JSON.parse(readFileSync(projectsFile, 'utf8'))
  registeredProjects = projects
  const projectIds = new Set()
  const allowedKinds = new Set(['application', 'kernel', 'service', 'sdk', 'tool', 'specification'])
  const allowedStatuses = new Set(['incubating', 'preview', 'active', 'deprecated', 'archived'])

  for (const project of projects) {
    const label = project.id || '<missing-id>'
    if (!project.id || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(project.id)) {
      errors.push(`docs/.vitepress/projects.json: 项目 ${label} 的 id 格式无效`)
    }
    if (projectIds.has(project.id)) {
      errors.push(`docs/.vitepress/projects.json: 项目 id ${project.id} 重复`)
    }
    projectIds.add(project.id)
    if (!project.name || !project.description || !project.repository || !project.docsRoot) {
      errors.push(`docs/.vitepress/projects.json: 项目 ${label} 缺少必要字段`)
    }
    try {
      const repository = new URL(project.repository)
      if (repository.protocol !== 'https:') throw new Error('not https')
    } catch {
      errors.push(`docs/.vitepress/projects.json: 项目 ${label} 的 repository 必须是 HTTPS URL`)
    }
    if (project.download) {
      try {
        const download = new URL(project.download)
        if (download.protocol !== 'https:') throw new Error('not https')
      } catch {
        errors.push(`docs/.vitepress/projects.json: 项目 ${label} 的 download 必须是 HTTPS URL`)
      }
    }
    if (project.quickStart && !resolveLocalTarget(join(docsRoot, 'index.md'), project.quickStart)) {
      errors.push(`docs/.vitepress/projects.json: 项目 ${label} 的 quickStart 页面不存在`)
    }
    if (
      project.platforms !== undefined &&
      (!Array.isArray(project.platforms) ||
        project.platforms.length === 0 ||
        project.platforms.some((platform) => typeof platform !== 'string' || !platform.trim()) ||
        new Set(project.platforms).size !== project.platforms.length)
    ) {
      errors.push(`docs/.vitepress/projects.json: 项目 ${label} 的 platforms 必须是非空、唯一的平台列表`)
    }
    if (!allowedKinds.has(project.kind)) {
      errors.push(`docs/.vitepress/projects.json: 项目 ${label} 的 kind 无效`)
    }
    if (!allowedStatuses.has(project.status)) {
      errors.push(`docs/.vitepress/projects.json: 项目 ${label} 的 status 无效`)
    }
    if (project.docsRoot !== `/projects/${project.id}/`) {
      errors.push(`docs/.vitepress/projects.json: 项目 ${label} 的 docsRoot 必须为 /projects/${project.id}/`)
    }
    if (
      !Array.isArray(project.audiences) ||
      project.audiences.length === 0 ||
      project.audiences.some((audience) => typeof audience !== 'string' || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(audience)) ||
      new Set(project.audiences).size !== project.audiences.length
    ) {
      errors.push(`docs/.vitepress/projects.json: 项目 ${label} 的 audiences 必须是非空、唯一的标识列表`)
    }
    const entry = join(docsRoot, 'projects', project.id, 'index.md')
    if (!existsSync(entry)) {
      errors.push(`docs/.vitepress/projects.json: 项目 ${label} 缺少入口 ${toPosix(relative(repositoryRoot, entry))}`)
    }
  }

  const projectsDirectory = join(docsRoot, 'projects')
  for (const entry of readdirSync(projectsDirectory, { withFileTypes: true })) {
    if (entry.isDirectory() && !projectIds.has(entry.name)) {
      errors.push(`docs/projects/${entry.name}: 目录未在项目注册表中声明`)
    }
  }
}

const markdownFiles = walk(docsRoot, (path) => path.endsWith('.md'))
const linkedStaticFiles = new Set()
const markdownLinkPattern = /!?(?:\[[^\]]*\])\(([^)\s]+)(?:\s+["'][^"']*["'])?\)/g
const linkGraph = new Map(markdownFiles.map((file) => [file, new Set()]))
const anchorsByFile = new Map()
const markdownRenderer = await createMarkdownRenderer(docsRoot)

for (const file of markdownFiles) {
  const source = readFileSync(file, 'utf8')
  try {
    const rendered = await markdownRenderer.render(source, { path: file })
    anchorsByFile.set(
      file,
      new Set([...rendered.matchAll(/\sid="([^"]+)"/g)].map((match) => decodeHtmlAttribute(match[1]))),
    )
  } catch (error) {
    report(file, `Markdown 渲染失败：${error instanceof Error ? error.message : String(error)}`)
    anchorsByFile.set(file, new Set())
  }
}

for (const file of markdownFiles) {
  const source = readFileSync(file, 'utf8')

  if (source.includes('\uFFFD') || /Ã.|Â.|â€|锟斤拷/.test(source)) {
    report(file, '检测到可能的编码损坏')
  }
  if (!/^#\s+\S+/m.test(source) && !/^---[\s\S]*?\ntitle:\s*\S+[\s\S]*?\n---/m.test(source)) {
    report(file, '缺少一级标题或 frontmatter title')
  }
  if (/\/README\.md$/i.test(toPosix(file))) {
    report(file, '文档目录只允许使用 index.md 作为入口')
  }

  for (const match of source.matchAll(/^```json[ \t]*\r?\n([\s\S]*?)^```[ \t]*$/gm)) {
    try {
      JSON.parse(match[1])
    } catch (error) {
      const line = source.slice(0, match.index).split(/\r?\n/).length
      report(file, `第 ${line} 行 JSON 示例无效：${error instanceof Error ? error.message : String(error)}`)
    }
  }

  for (const match of source.matchAll(markdownLinkPattern)) {
    const target = match[1]
    if (
      target.startsWith('http://') ||
      target.startsWith('https://') ||
      target.startsWith('mailto:') ||
      target.startsWith('data:')
    ) {
      continue
    }
    const hashIndex = target.indexOf('#')
    const rawHash = hashIndex >= 0 ? target.slice(hashIndex + 1) : ''
    const resolvedTarget = target.startsWith('#') ? file : resolveLocalTarget(file, target)
    if (!resolvedTarget) {
      report(file, `本地链接不存在：${target}`)
    } else if (resolvedTarget.endsWith('.md')) {
      const sourceProject = projectIdForFile(file)
      const targetProject = projectIdForFile(resolvedTarget)
      if (sourceProject && targetProject && sourceProject !== targetProject) {
        report(file, `项目文档不能链接到其他项目：${target}`)
      }
      linkGraph.get(file).add(resolvedTarget)
      const hash = decodeHash(rawHash)
      if (hash && !anchorsByFile.get(resolvedTarget)?.has(hash)) {
        report(file, `页面锚点不存在：${target}`)
      }
    } else if (resolvedTarget.startsWith(join(docsRoot, 'public'))) {
      linkedStaticFiles.add(resolvedTarget)
    }
  }
}

if (!existsSync(navigationFile)) {
  errors.push('docs/.vitepress/navigation.ts: 显式导航配置不存在')
} else {
  const navigationSource = readFileSync(navigationFile, 'utf8')
  const navigationEntries = new Set([join(docsRoot, 'index.md')])

  for (const project of registeredProjects) {
    if (!navigationSource.includes(`'${project.docsRoot}'`) && !navigationSource.includes(`"${project.docsRoot}"`)) {
      errors.push(`docs/.vitepress/navigation.ts: 项目 ${project.id} 没有显式导航入口`)
    }
  }

  for (const match of navigationSource.matchAll(/['"](\/[^'"]+)['"]/g)) {
    const target = resolveLocalTarget(join(docsRoot, 'index.md'), match[1])
    if (target?.endsWith('.md')) {
      navigationEntries.add(target)
      explicitNavigationEntries.add(target)
    }
  }

  for (const project of registeredProjects) {
    const projectDirectory = join(docsRoot, 'projects', project.id)
    for (const file of markdownFiles) {
      if (file.startsWith(`${projectDirectory}${sep}`) && !explicitNavigationEntries.has(file)) {
        report(file, '项目页面未进入显式侧栏，会导致上一页/下一页失去项目上下文')
      }
    }
  }

  const reachable = new Set()
  const pending = [...navigationEntries]
  while (pending.length > 0) {
    const file = pending.pop()
    if (!file || reachable.has(file)) continue
    reachable.add(file)
    for (const target of linkGraph.get(file) ?? []) {
      if (!reachable.has(target)) pending.push(target)
    }
  }

  for (const file of markdownFiles) {
    if (!reachable.has(file)) report(file, '页面未被显式导航或其他可达页面引用')
  }
}

if (checkDist) {
  if (!existsSync(join(distRoot, 'index.html'))) {
    errors.push('docs/.vitepress/dist/index.html: 构建产物不存在')
  }
  for (const file of markdownFiles) {
    const markdownPath = toPosix(relative(docsRoot, file))
    const route = markdownPath === 'index.md'
      ? 'index.html'
      : markdownPath.endsWith('/index.md')
        ? markdownPath.replace(/index\.md$/, 'index.html')
        : markdownPath.replace(/\.md$/, '.html')
    if (!existsSync(join(distRoot, ...route.split('/')))) {
      report(file, `缺少对应构建产物：${route}`)
    }
  }
  for (const file of linkedStaticFiles) {
    const route = relative(join(docsRoot, 'public'), file)
    if (!existsSync(join(distRoot, route))) {
      report(file, `缺少对应静态构建产物：${toPosix(route)}`)
    }
  }
}

if (errors.length > 0) {
  console.error(`文档检查失败（${errors.length} 项）：`)
  for (const error of errors) console.error(`- ${error}`)
  process.exit(1)
}

console.log(`文档检查通过：${markdownFiles.length} 个 Markdown 文件，项目注册、编码、标题、链接、锚点、JSON 示例、项目侧栏、导航和页面可达性正常${checkDist ? '，构建产物完整' : ''}。`)
