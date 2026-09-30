<script setup lang="ts">
import { computed } from 'vue'
import { withBase } from 'vitepress'
import { getProject, projectKindLabels } from '../../projects'

const props = defineProps<{ projectId: string }>()
const project = computed(() => getProject(props.projectId))
const downloadHref = computed(() => (
  project.value.downloadPage ? withBase(project.value.downloadPage) : project.value.download
))
</script>

<template>
  <section class="project-meta" :aria-label="`${project.name} 项目信息`">
    <p class="project-meta__summary">
      <span>{{ projectKindLabels[project.kind] }}</span>
      <span v-if="project.platforms?.length">{{ project.platforms.join(' · ') }}</span>
    </p>

    <nav class="project-meta__actions" :aria-label="`${project.name} 常用入口`">
      <a v-if="project.quickStart" class="project-link project-link--primary" :href="withBase(project.quickStart)">
        开始使用 <span aria-hidden="true">→</span>
      </a>
      <a
        v-if="downloadHref"
        class="project-link"
        :href="downloadHref"
        :target="project.downloadPage ? undefined : '_blank'"
        :rel="project.downloadPage ? undefined : 'noreferrer'"
      >下载</a>
      <a class="project-link" :href="project.repository" target="_blank" rel="noreferrer">源码 <span aria-hidden="true">↗</span></a>
    </nav>
  </section>
</template>
