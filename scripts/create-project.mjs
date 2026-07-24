import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { parseArgs } from 'node:util'
import { fileURLToPath } from 'node:url'

const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const docsRoot = join(repositoryRoot, 'docs')
const projectsFile = join(docsRoot, '.vitepress', 'projects.json')

const allowedKinds = new Set(['application', 'kernel', 'service', 'sdk', 'tool', 'specification'])
const allowedStatuses = new Set(['incubating', 'preview', 'active', 'deprecated', 'archived'])

function fail(message) {
  console.error(`创建项目失败：${message}`)
  process.exit(1)
}

function requireSingleLine(value, option) {
  const normalized = value?.trim()
  if (!normalized) fail(`缺少 --${option}`)
  if (/\r|\n/.test(normalized)) fail(`--${option} 必须为单行文本`)
  return normalized
}

const { values } = parseArgs({
  options: {
    id: { type: 'string' },
    name: { type: 'string' },
    description: { type: 'string' },
    repository: { type: 'string' },
    kind: { type: 'string', default: 'tool' },
    status: { type: 'string', default: 'incubating' },
    audiences: { type: 'string', default: 'contributor' },
    'dry-run': { type: 'boolean', default: false },
  },
  strict: true,
})

const id = requireSingleLine(values.id, 'id')
const name = requireSingleLine(values.name, 'name')
const description = requireSingleLine(values.description, 'description')
const repository = requireSingleLine(values.repository, 'repository')
const kind = requireSingleLine(values.kind, 'kind')
const status = requireSingleLine(values.status, 'status')
const audiences = requireSingleLine(values.audiences, 'audiences')
  .split(/[,\s]+/)
  .map((audience) => audience.trim())
  .filter(Boolean)

if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(id)) {
  fail('--id 只能使用小写字母、数字和单个连字符分段')
}
if (!allowedKinds.has(kind)) {
  fail(`--kind 必须为 ${[...allowedKinds].join('、')} 之一`)
}
if (!allowedStatuses.has(status)) {
  fail(`--status 必须为 ${[...allowedStatuses].join('、')} 之一`)
}
if (
  audiences.length === 0 ||
  audiences.some((audience) => !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(audience)) ||
  new Set(audiences).size !== audiences.length
) {
  fail('--audiences 必须包含至少一个小写标识且不能重复')
}

let repositoryUrl
try {
  repositoryUrl = new URL(repository)
} catch {
  fail('--repository 必须是完整 URL')
}
if (repositoryUrl.protocol !== 'https:') {
  fail('--repository 必须使用 HTTPS')
}

const projects = JSON.parse(readFileSync(projectsFile, 'utf8'))
if (!Array.isArray(projects)) fail('项目注册表必须是数组')
if (projects.some((project) => project.id === id)) fail(`项目 ${id} 已在注册表中`)

const projectDirectory = join(docsRoot, 'projects', id)
if (existsSync(projectDirectory)) fail(`目标目录 docs/projects/${id} 已存在`)

const project = {
  id,
  name,
  description,
  kind,
  status,
  repository,
  docsRoot: `/projects/${id}/`,
  audiences,
}

if (values['dry-run']) {
  console.log('项目参数验证通过，未写入文件：')
  console.log(JSON.stringify(project, null, 2))
  process.exit(0)
}

const indexPage = `# ${name}\n\n<ProjectMeta project-id="${id}" />\n\n${description}\n\n## 开始使用\n\n- 阅读[用户指南](./guides/)。\n- 查看项目的[代码仓库](${repository})。\n- 了解如何[参与 ${name}](./contributing/)。\n\n## 文档边界\n\n这里维护 ${name} 面向用户、运维者和集成方的公开文档。接口契约、版本规则和贡献说明属于本项目，不进入其他项目的阅读序列。内部设计、临时调查和问题记录保留在项目代码仓库。\n`
const guidesIndex = `# ${name} 用户指南\n\n从这里开始编写安装、首次使用、日常操作、已知限制和故障排查文档。\n\n返回 [${name}](../)。\n`
const contributingIndex = `# 参与 ${name}\n\n本页说明如何反馈问题、贡献代码和修改 ${name} 的公开文档。项目行为、版本和契约决策以[项目仓库](${repository})为准。\n\n返回 [${name}](../)。\n`

mkdirSync(join(projectDirectory, 'guides'), { recursive: true })
mkdirSync(join(projectDirectory, 'contributing'), { recursive: true })
writeFileSync(join(projectDirectory, 'index.md'), indexPage, 'utf8')
writeFileSync(join(projectDirectory, 'guides', 'index.md'), guidesIndex, 'utf8')
writeFileSync(join(projectDirectory, 'contributing', 'index.md'), contributingIndex, 'utf8')
writeFileSync(projectsFile, `${JSON.stringify([...projects, project], null, 2)}\n`, 'utf8')

console.log(`已创建项目 ${name}：`)
console.log(`- 注册表：docs/.vitepress/projects.json`)
console.log(`- 入口：docs/projects/${id}/index.md`)
console.log(`- 指南：docs/projects/${id}/guides/index.md`)
console.log(`- 贡献：docs/projects/${id}/contributing/index.md`)
console.log('- 下一步：在 docs/.vitepress/navigation.ts 中增加显式导航，然后运行 pnpm check:build。')
