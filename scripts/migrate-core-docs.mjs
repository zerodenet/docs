import {
  existsSync,
  mkdirSync,
  readFileSync,
  rmSync,
  statSync,
  writeFileSync,
} from 'node:fs'
import { dirname, extname, join, posix, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const destinationDocsRoot = join(repositoryRoot, 'docs')
const sourceDocsRoot = resolve(process.argv[2] ?? '')

if (!process.argv[2] || !existsSync(sourceDocsRoot)) {
  console.error('用法：node scripts/migrate-core-docs.mjs <core-docs-directory>')
  process.exit(1)
}

const selectedSourceDocs = new Map([
  ['control-plane-api/breaking-changes.md', 'projects/core/control-plane/breaking-changes.md'],
  ['control-plane-api/configuration.md', 'projects/core/control-plane/configuration.md'],
  ['control-plane-api/connector.md', 'projects/core/control-plane/connector.md'],
  ['control-plane-api/contract.md', 'projects/core/control-plane/contract.md'],
  ['control-plane-api/events.md', 'projects/core/control-plane/events.md'],
  ['control-plane-api/http-api.md', 'projects/core/control-plane/http-api.md'],
  ['control-plane-api/ipc-protocol.md', 'projects/core/control-plane/ipc-protocol.md'],
  ['project/zero-rule-ir-v1.md', 'projects/core/reference/zero-rule-ir-v1.md'],
  ['project/zrs-0.1.md', 'projects/core/reference/zrs-0.1.md'],
  ['project/zrs-0.1-golden.md', 'projects/core/reference/zrs-0.1-golden.md'],
])

const linkTargetOverrides = new Map([
  ['guides/connector-integration.md', 'projects/core/guides/connector-integration.md'],
  ['guides/config-failure-examples.md', 'projects/core/guides/config-failure-examples.md'],
  ['guides/gui-integration.md', 'projects/core/guides/gui-integration.md'],
  ['guides/quickstart.md', 'projects/core/guides/quickstart.md'],
  ['control-plane-api/cli.md', 'projects/core/control-plane/cli.md'],
  ['control-plane-api/index.md', 'projects/core/control-plane/index.md'],
  ['protocols/configuration.md', 'projects/core/protocols/configuration.md'],
  ['protocols/index.md', 'projects/core/protocols/index.md'],
  ['project/api.md', 'projects/core/control-plane/events.md'],
  ['project/connector-architecture.md', 'projects/core/control-plane/connector.md'],
  ['project/config.md', 'projects/core/configuration/index.md'],
  ['project/modes-and-groups.md', 'projects/core/configuration/modes-and-groups.md'],
  ['project/features.md', 'projects/core/configuration/features.md'],
  ['project/protocol-capabilities.md', 'projects/core/reference/protocol-capabilities.md'],
])

const staleDestinationPaths = [
  'projects/core/architecture',
  'projects/core/contributing',
  'projects/core/protocols/http',
  'projects/core/protocols/hysteria2',
  'projects/core/protocols/mieru',
  'projects/core/protocols/mixed',
  'projects/core/protocols/shadowsocks',
  'projects/core/protocols/socks5',
  'projects/core/protocols/trojan',
  'projects/core/protocols/vless',
  'projects/core/protocols/vmess',
  'projects/core/protocols/incomplete.md',
  'projects/core/control-plane/hooks.md',
  'projects/core/control-plane/push-connector.md',
  'projects/core/guides/panel-integration.md',
  'projects/core/guides/connector-operations.md',
  'projects/core/guides/connector-production-report-template.md',
  'public/projects/core/control-plane/zero-panel-v1.openapi.json',
  'public/projects/core/guides/connector-production-approval.template.json',
  'public/projects/core/guides/connector-production-upgrade-report.template.json',
]

const copiedFiles = []

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
  return linkTargetOverrides.get(sourceRelativePath)
    ?? selectedSourceDocs.get(sourceRelativePath)
    ?? null
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

for (const destinationRelativePath of staleDestinationPaths) {
  rmSync(join(destinationDocsRoot, ...destinationRelativePath.split('/')), {
    force: true,
    recursive: true,
  })
}

for (const [sourceRelativePath, destinationRelativePath] of selectedSourceDocs) {
  copyMarkdown(sourceRelativePath, destinationRelativePath)
}

console.log(`Core 文档迁移完成：${copiedFiles.length} 个公开文档与静态资源。`)
