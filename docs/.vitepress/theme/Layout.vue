<script setup lang="ts">
import DefaultTheme from 'vitepress/theme'
import DocBreadcrumb from './components/DocBreadcrumb.vue'

const { Layout } = DefaultTheme
</script>

<template>
  <Layout>
    <template #doc-before>
      <DocBreadcrumb />
    </template>
  </Layout>
</template>
