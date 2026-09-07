import DefaultTheme from 'vitepress/theme'
import type { Theme } from 'vitepress'
import DiscussionFeed from './components/DiscussionFeed.vue'
import ClientTour from './components/ClientTour.vue'
import DownloadChooser from './components/DownloadChooser.vue'
import ProjectCatalog from './components/ProjectCatalog.vue'
import ProjectMeta from './components/ProjectMeta.vue'
import Layout from './Layout.vue'
import './custom.css'

export default {
  extends: DefaultTheme,
  Layout,
  enhanceApp({ app }) {
    app.component('DiscussionFeed', DiscussionFeed)
    app.component('ClientTour', ClientTour)
    app.component('DownloadChooser', DownloadChooser)
    app.component('ProjectCatalog', ProjectCatalog)
    app.component('ProjectMeta', ProjectMeta)
  },
} satisfies Theme
