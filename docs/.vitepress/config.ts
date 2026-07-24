import { defineConfig } from 'vitepress'
import { nav, sidebar } from './navigation'

export default defineConfig({
  title: 'ZeroDeNet',
  description: 'ZeroDeNet 开源项目文档',
  lang: 'zh-CN',
  cleanUrls: true,
  lastUpdated: true,
  sitemap: {
    hostname: 'https://docs.zerodenet.org',
  },

  head: [
    ['meta', { name: 'theme-color', content: '#0d5bd7' }],
    ['meta', { property: 'og:site_name', content: 'ZeroDeNet' }],
  ],

  themeConfig: {
    nav,
    sidebar,
    search: {
      provider: 'local',
      options: {
        locales: {
          root: {
            translations: {
              button: {
                buttonText: '搜索文档',
                buttonAriaLabel: '搜索文档',
              },
              modal: {
                noResultsText: '没有找到相关内容',
                resetButtonTitle: '清除查询',
                footer: {
                  selectText: '选择',
                  navigateText: '切换',
                  closeText: '关闭',
                },
              },
            },
          },
        },
      },
    },
    socialLinks: [{ icon: 'github', link: 'https://github.com/zerodenet' }],
    outline: { level: [2, 3], label: '本页目录' },
    docFooter: { prev: '上一页', next: '下一页' },
    lastUpdated: { text: '最后更新' },
    returnToTopLabel: '返回顶部',
    sidebarMenuLabel: '文档导航',
    darkModeSwitchLabel: '外观',
    lightModeSwitchTitle: '切换到浅色模式',
    darkModeSwitchTitle: '切换到深色模式',
    footer: {
      message: 'ZeroDeNet 开源项目文档',
    },
  },
})
