import { existsSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs'
import { dirname, extname, join, posix, relative, resolve, sep } from 'node:path'
import { fileURLToPath } from 'node:url'

const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const destinationDocsRoot = join(repositoryRoot, 'docs')
const sourceDocsRoot = resolve(process.argv[2] ?? '')

if (!process.argv[2] || !existsSync(sourceDocsRoot)) {
  console.error('用法：node scripts/migrate-core-docs.mjs <core-docs-directory>')
  process.exit(1)
}

const selectedProjectDocs = new Map([
  ['project/config.md', 'projects/core/configuration/index.md'],
  ['project/modes-and-groups.md', 'projects/core/configuration/modes-and-groups.md'],
  ['project/features.md', 'projects/core/configuration/features.md'],
  ['project/architecture.md', 'projects/core/architecture/index.md'],
  ['project/lifecycle.md', 'projects/core/architecture/lifecycle.md'],
  ['project/protocol-capabilities.md', 'projects/core/reference/protocol-capabilities.md'],
  ['project/zero-rule-ir-v1.md', 'projects/core/reference/zero-rule-ir-v1.md'],
  ['project/zrs-0.1.md', 'projects/core/reference/zrs-0.1.md'],
  ['project/zrs-0.1-golden.md', 'projects/core/reference/zrs-0.1-golden.md'],
  ['project/connector-production-report-template.md', 'projects/core/guides/connector-production-report-template.md'],
])

const selectedStaticDocs = new Map([
  [
    'control-plane-api/zero-panel-v1.openapi.json',
    'projects/core/control-plane/zero-panel-v1.openapi.json',
  ],
  [
    'project/connector-production-approval.template.json',
    'projects/core/guides/connector-production-approval.template.json',
  ],
  [
    'project/connector-production-upgrade-report.template.json',
    'projects/core/guides/connector-production-upgrade-report.template.json',
  ],
])

const copiedFiles = []

function toPosix(path) {
  return path.split(sep).join('/')
}

function sourcePathExists(path) {
  return existsSync(join(sourceDocsRoot, ...path.split('/')))
}

function normalizeSourceTarget(sourceRelativePath, rawTarget) {
  const [pathname, hash = ''] = rawTarget.split('#', 2)
  let normalized = posix.normalize(posix.join(posix.dirname(sourceRelativePath), pathname))

  if (pathname.endsWith('/') || (sourcePathExists(normalized) && statSync(join(sourceDocsRoot, ...normalized.split('/'))).isDirectory())) {
    normalized = posix.join(normalized, 'index.md')
  } else if (!extname(normalized) && sourcePathExists(`${normalized}.md`)) {
    normalized = `${normalized}.md`
  }

  return { hash, sourceTarget: normalized }
}

function mapSourceDocument(sourceRelativePath) {
  const selectedStaticDoc = selectedStaticDocs.get(sourceRelativePath)
  if (selectedStaticDoc) return selectedStaticDoc

  if (sourceRelativePath.startsWith('guides/')) {
    return `projects/core/${sourceRelativePath}`
  }
  if (sourceRelativePath.startsWith('protocols/')) {
    return `projects/core/${sourceRelativePath}`
  }
  if (sourceRelativePath.startsWith('control-plane-api/')) {
    return `projects/core/control-plane/${sourceRelativePath.slice('control-plane-api/'.length)}`
  }
  return selectedProjectDocs.get(sourceRelativePath) ?? null
}

function destinationRoute(destinationRelativePath) {
  if (destinationRelativePath.endsWith('/index.md')) {
    return `/${destinationRelativePath.slice(0, -'index.md'.length)}`
  }
  return `/${destinationRelativePath.replace(/\.md$/, '')}`
}

function githubSourceUrl(sourceTarget, hash) {
  const repositoryPath = sourceTarget.startsWith('../')
    ? sourceTarget.replace(/^\.\.\//, '')
    : `docs/${sourceTarget}`
  return `https://github.com/zerodenet/core/blob/develop/${repositoryPath}${hash ? `#${hash}` : ''}`
}

function rewriteLink(sourceRelativePath, rawTarget) {
  if (
    rawTarget.startsWith('http://') ||
    rawTarget.startsWith('https://') ||
    rawTarget.startsWith('mailto:') ||
    rawTarget.startsWith('#') ||
    rawTarget.startsWith('data:')
  ) {
    return rawTarget
      .replace('https://github.com/zerodenet/zero.git', 'https://github.com/zerodenet/core.git')
      .replace('https://github.com/zerodenet/zero', 'https://github.com/zerodenet/core')
  }

  const { hash, sourceTarget } = normalizeSourceTarget(sourceRelativePath, rawTarget)
  const mappedTarget = mapSourceDocument(sourceTarget)

  if (!mappedTarget) return githubSourceUrl(sourceTarget, hash)
  return `${destinationRoute(mappedTarget)}${hash ? `#${hash}` : ''}`
}

function transformMarkdown(sourceRelativePath, source) {
  let transformed = source
    .replaceAll('https://github.com/zerodenet/zero.git', 'https://github.com/zerodenet/core.git')
    .replaceAll('https://github.com/zerodenet/zero', 'https://github.com/zerodenet/core')
    .replaceAll('docs/protocols/', 'docs/projects/core/protocols/')
    .replaceAll('docs/project/zrs-0.1-golden.md', 'docs/projects/core/reference/zrs-0.1-golden.md')
    .replaceAll('#policyprobecompleted', '#policy-probe-completed')
    .replace(/\bcd zero\b/g, 'cd core')
    .replaceAll('`adapter: "reference"`', 'Zero 原生 HTTP peer')
    .replaceAll('Zero 原生 HTTP peer 是 Zero 自己的线协议', 'Zero 原生 HTTP peer 实现 Zero 自己的线协议')
    .replaceAll('验收配置必须使用 Zero 原生 HTTP peer 并同时启用', '验收配置必须同时启用')

  if (sourceRelativePath === 'guides/panel-integration.md') {
    transformed = transformed.replace(/^[ \t]*"adapter": "reference",\r?\n/m, '')
  }

  if (sourceRelativePath === 'project/config.md') {
    transformed = transformed.replace(
      /```json(\r?\n)(?=\{ "method": "tun\.start")/,
      '```jsonl$1',
    )
  }
  if (sourceRelativePath === 'control-plane-api/cli.md') {
    transformed = transformed.replace(
      /```json(\r?\n)(?=\{"event_type":"flow\.snapshot")/,
      '```text$1',
    )
  }
  if (sourceRelativePath === 'control-plane-api/index.md') {
    transformed = transformed.replace(
      /```json(\r?\n)(?=\{\r?\n  "inbounds": \[\.\.\.\])/,
      '```text$1',
    )
  }

  transformed = transformed.replace(
    /\]\(([^)\s]+)(\s+["'][^"']*["'])?\)/g,
    (_match, target, title = '') => `](${rewriteLink(sourceRelativePath, target)}${title})`,
  )

  if (sourceRelativePath === 'control-plane-api/index.md') {
    transformed = transformed.replace(
      /::: info 历史设计[\s\S]*?:::\r?\n\r?\n/,
      '',
    )
  }

  return transformed
}

function copyMarkdown(sourceRelativePath, destinationRelativePath) {
  const sourceFile = join(sourceDocsRoot, ...sourceRelativePath.split('/'))
  const destinationFile = join(destinationDocsRoot, ...destinationRelativePath.split('/'))
  const source = readFileSync(sourceFile, 'utf8')

  mkdirSync(dirname(destinationFile), { recursive: true })
  writeFileSync(destinationFile, transformMarkdown(sourceRelativePath, source), 'utf8')
  copiedFiles.push(destinationRelativePath)
}

function copyStaticDocument(sourceRelativePath, destinationRoutePath) {
  const sourceFile = join(sourceDocsRoot, ...sourceRelativePath.split('/'))
  const destinationFile = join(destinationDocsRoot, 'public', ...destinationRoutePath.split('/'))
  const source = readFileSync(sourceFile, 'utf8')

  mkdirSync(dirname(destinationFile), { recursive: true })
  writeFileSync(
    destinationFile,
    source
      .replaceAll('https://github.com/zerodenet/zero.git', 'https://github.com/zerodenet/core.git')
      .replaceAll('https://github.com/zerodenet/zero', 'https://github.com/zerodenet/core'),
    'utf8',
  )
  copiedFiles.push(`public/${destinationRoutePath}`)
}

function copyDirectory(sourceDirectory, destinationDirectory) {
  const sourceAbsolute = join(sourceDocsRoot, sourceDirectory)
  for (const entry of walkMarkdown(sourceAbsolute)) {
    const sourceRelativePath = toPosix(relative(sourceDocsRoot, entry))
    const nestedPath = toPosix(relative(sourceAbsolute, entry))
    copyMarkdown(sourceRelativePath, posix.join(destinationDirectory, nestedPath))
  }
}

function walkMarkdown(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const absolutePath = join(directory, entry.name)
    if (entry.isDirectory()) return walkMarkdown(absolutePath)
    return entry.isFile() && entry.name.endsWith('.md') ? [absolutePath] : []
  })
}

copyDirectory('guides', 'projects/core/guides')
copyDirectory('protocols', 'projects/core/protocols')
copyDirectory('control-plane-api', 'projects/core/control-plane')

for (const [sourceRelativePath, destinationRelativePath] of selectedProjectDocs) {
  copyMarkdown(sourceRelativePath, destinationRelativePath)
}

for (const [sourceRelativePath, destinationRoutePath] of selectedStaticDocs) {
  copyStaticDocument(sourceRelativePath, destinationRoutePath)
}

console.log(`Core 文档迁移完成：${copiedFiles.length} 个公开文档与静态资源。`)
