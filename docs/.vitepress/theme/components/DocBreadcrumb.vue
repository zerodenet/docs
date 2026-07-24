<script setup lang="ts">
import { computed } from 'vue'
import { useData, useRoute } from 'vitepress'
import { projects } from '../../projects'

interface BreadcrumbItem {
  label: string
  link?: string
}

const route = useRoute()
const { page } = useData()

const segmentLabels: Record<string, string> = {
  guides: '指南',
  configuration: '配置与运行',
  protocols: '协议',
  'control-plane': '控制面',
  architecture: '架构',
  reference: '参考',
  contributing: '参与项目',
  vmess: 'VMess',
  vless: 'VLESS',
  socks5: 'SOCKS5',
  http: 'HTTP CONNECT',
  mixed: 'Mixed',
  hysteria2: 'Hysteria2',
  shadowsocks: 'Shadowsocks',
  trojan: 'Trojan',
  mieru: 'Mieru',
}

function currentTitle(fallback: string) {
  return page.value.title || segmentLabels[fallback] || fallback
}

const items = computed<BreadcrumbItem[]>(() => {
  const normalizedPath = route.path.replace(/\.html$/, '').replace(/\/+$/, '')
  if (!normalizedPath) return []

  const segments = normalizedPath.split('/').filter(Boolean)
  const root = segments[0]

  if (root === 'projects') {
    if (segments.length === 1) return [{ label: '项目' }]

    const projectId = segments[1]
    const project = projects.find(({ id }) => id === projectId)
    if (!project) return [{ label: '项目', link: '/projects/' }, { label: currentTitle(projectId) }]

    const breadcrumbs: BreadcrumbItem[] = [
      { label: '项目', link: '/projects/' },
    ]

    if (segments.length === 2) {
      breadcrumbs.push({ label: project.name })
      return breadcrumbs
    }

    breadcrumbs.push({ label: project.name, link: project.docsRoot })

    let accumulatedPath = project.docsRoot.replace(/\/$/, '')
    for (const segment of segments.slice(2, -1)) {
      accumulatedPath += `/${segment}`
      breadcrumbs.push({
        label: segmentLabels[segment] || segment.replaceAll('-', ' '),
        link: `${accumulatedPath}/`,
      })
    }

    breadcrumbs.push({ label: currentTitle(segments.at(-1) ?? projectId) })
    return breadcrumbs
  }

  return []
})
</script>

<template>
  <nav v-if="items.length" class="doc-breadcrumb" aria-label="面包屑">
    <ol>
      <li v-for="(item, index) in items" :key="`${item.label}-${index}`">
        <a v-if="item.link" :href="item.link">{{ item.label }}</a>
        <span v-else aria-current="page">{{ item.label }}</span>
      </li>
    </ol>
  </nav>
</template>
