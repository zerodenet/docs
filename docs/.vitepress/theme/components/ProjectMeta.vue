<script setup lang="ts">
import { computed } from 'vue'
import { withBase } from 'vitepress'
import { getProject, projectKindLabels, projectStatusLabels } from '../../projects'

const props = defineProps<{ projectId: string }>()
const project = computed(() => getProject(props.projectId))
const displayAddress = (url: string) => url.replace(/^https?:\/\//, '')
</script>

<template>
  <section class="project-meta" :aria-label="`${project.name} 项目信息`">
    <p class="project-meta__summary">
      <span>{{ projectKindLabels[project.kind] }}</span>
      <span>{{ projectStatusLabels[project.status] }}</span>
      <span v-if="project.platforms?.length">{{ project.platforms.join(' · ') }}</span>
    </p>

    <nav class="project-meta__actions" :aria-label="`${project.name} 常用入口`">
      <a
        v-if="project.download"
        class="project-link project-link--primary"
        :href="project.download"
        target="_blank"
        rel="noreferrer"
      >下载最新版 <span aria-hidden="true">↗</span></a>
      <a v-if="project.quickStart" class="project-link" :href="withBase(project.quickStart)">
        {{ project.kind === 'application' ? '安装指南' : '快速开始' }}
      </a>
      <a class="project-link" :href="project.repository" target="_blank" rel="noreferrer">GitHub 源码 <span aria-hidden="true">↗</span></a>
    </nav>

    <dl class="project-meta__addresses">
      <div v-if="project.download">
        <dt>下载地址</dt>
        <dd><a :href="project.download" target="_blank" rel="noreferrer">{{ displayAddress(project.download) }}</a></dd>
      </div>
      <div>
        <dt>源码地址</dt>
        <dd><a :href="project.repository" target="_blank" rel="noreferrer">{{ displayAddress(project.repository) }}</a></dd>
      </div>
    </dl>
  </section>
</template>
