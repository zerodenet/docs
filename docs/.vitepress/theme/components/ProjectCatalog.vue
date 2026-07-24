<script setup lang="ts">
import { withBase } from 'vitepress'
import { projectKindLabels, projectStatusLabels, projects } from '../../projects'

defineProps<{ compact?: boolean }>()

const displayAddress = (url: string) => url.replace(/^https?:\/\//, '')
const quickStartLabel = (kind: string) => kind === 'application' ? '安装与使用' : '快速开始'
</script>

<template>
  <div
    class="project-catalog"
    :class="{ 'project-catalog--compact': compact }"
    aria-label="ZeroDeNet 项目目录"
  >
    <article
      v-for="(project, index) in projects"
      :key="project.id"
      class="project-catalog__item"
    >
      <span class="project-catalog__index" aria-hidden="true">
        {{ String(index + 1).padStart(2, '0') }}
      </span>

      <div class="project-catalog__identity">
        <p class="project-catalog__eyebrow">
          <span>{{ projectKindLabels[project.kind] }}</span>
          <span>{{ projectStatusLabels[project.status] }}</span>
        </p>
        <h3>
          <span v-if="compact">{{ project.name }}</span>
          <a v-else :href="withBase(project.docsRoot)">{{ project.name }}</a>
        </h3>
        <p class="project-catalog__tagline">{{ project.tagline || project.description }}</p>
      </div>

      <div class="project-catalog__content">
        <p v-if="!compact" class="project-catalog__description">{{ project.description }}</p>

        <p v-if="!compact && project.platforms?.length" class="project-catalog__platforms">
          <span class="project-catalog__label">支持平台</span>
          {{ project.platforms.join(' · ') }}
        </p>

        <nav class="project-catalog__actions" :aria-label="`${project.name} 常用入口`">
          <a class="project-link project-link--primary" :href="withBase(project.docsRoot)">进入文档 <span aria-hidden="true">→</span></a>
          <a v-if="!compact && project.quickStart" class="project-link" :href="withBase(project.quickStart)">{{ quickStartLabel(project.kind) }}</a>
          <template v-if="!compact">
            <a v-if="project.download" class="project-link" :href="project.download" target="_blank" rel="noreferrer">下载</a>
            <a class="project-link" :href="project.repository" target="_blank" rel="noreferrer">源码</a>
          </template>
        </nav>

        <dl v-if="!compact" class="project-catalog__addresses">
          <div v-if="project.download">
            <dt>下载</dt>
            <dd><a :href="project.download" target="_blank" rel="noreferrer">{{ displayAddress(project.download) }}</a></dd>
          </div>
          <div>
            <dt>源码</dt>
            <dd><a :href="project.repository" target="_blank" rel="noreferrer">{{ displayAddress(project.repository) }}</a></dd>
          </div>
        </dl>
      </div>
    </article>
  </div>
</template>
