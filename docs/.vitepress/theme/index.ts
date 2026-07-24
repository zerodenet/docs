import DefaultTheme from 'vitepress/theme'
import type { Theme } from 'vitepress'
import ProjectCatalog from './components/ProjectCatalog.vue'
import ProjectMeta from './components/ProjectMeta.vue'
import Layout from './Layout.vue'
import './custom.css'

export default {
  extends: DefaultTheme,
  Layout,
  enhanceApp({ app }) {
    app.component('ProjectCatalog', ProjectCatalog)
    app.component('ProjectMeta', ProjectMeta)
  },
} satisfies Theme
