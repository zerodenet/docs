import type { DefaultTheme } from 'vitepress'

const page = (text: string, link: string): DefaultTheme.SidebarItem => ({ text, link })

const group = (
  text: string,
  items: DefaultTheme.SidebarItem[],
  collapsed = true,
): DefaultTheme.SidebarItem => ({ text, items, collapsed })

export const nav: DefaultTheme.NavItem[] = [
  { text: '开始使用', link: '/projects/' },
  {
    text: '项目文档',
    items: [
      { text: 'ZNet Sink', link: '/projects/znet-sink/', activeMatch: '^/projects/znet-sink/' },
      { text: 'Zero Core', link: '/projects/core/', activeMatch: '^/projects/core/' },
      { text: 'ZBoard', link: '/projects/zboard/', activeMatch: '^/projects/zboard/' },
    ],
  },
  { text: '下载客户端', link: '/download' },
  { text: '社区', link: '/community/' },
]

const projectSidebar: DefaultTheme.SidebarItem[] = [
  page('选择项目', '/projects/'),
  page('项目如何配合', '/solutions/'),
  group('项目文档', [
    page('ZNet Sink', '/projects/znet-sink/'),
    page('Zero Core', '/projects/core/'),
    page('ZBoard', '/projects/zboard/'),
  ], false),
  page('升级与兼容', '/progress'),
]

const communitySidebar: DefaultTheme.SidebarItem[] = [
  page('社区', '/community/'),
  page('问题反馈', '/community/#问题反馈'),
  page('赞助、广告与友情链接', '/community/#赞助广告与友情链接'),
]

const coreSidebar: DefaultTheme.SidebarItem[] = [
  page('Zero Core', '/projects/core/'),
  group('开始使用', [
    page('运行第一个代理', '/projects/core/guides/quickstart'),
    page('接入远程节点', '/projects/core/guides/configuration-basics'),
    page('日常操作', '/projects/core/guides/operations'),
    page('故障排查', '/projects/core/guides/troubleshooting'),
  ], false),
  group('按需配置', [
    page('TUN 与 DNS', '/projects/core/guides/tun-and-dns'),
    page('应用代理与节点测速', '/projects/core/guides/proxy-and-urltest'),
    page('热更新配置', '/projects/core/guides/hot-reload'),
    page('选择协议', '/projects/core/protocols/'),
    page('协议配置示例', '/projects/core/protocols/configuration'),
    page('运行模式与出站组', '/projects/core/configuration/modes-and-groups'),
    page('DNS 与 Fake-IP 参数', '/projects/core/configuration/dns'),
  ]),
  group('配置与维护参考', [
    page('配置字段', '/projects/core/configuration/'),
    page('配置错误示例', '/projects/core/guides/config-failure-examples'),
    page('CLI 命令', '/projects/core/control-plane/cli'),
    page('升级与自定义构建', '/projects/core/guides/installation'),
    page('构建特性', '/projects/core/configuration/features'),
    page('协议能力与限制', '/projects/core/reference/protocol-capabilities'),
    page('能力与端口速查', '/projects/core/reference/technical-specifications'),
  ]),
  group('外部程序接入', [
    page('控制 API 使用', '/projects/core/guides/control-api'),
    page('控制接口安全', '/projects/core/guides/control-security'),
    page('GUI 接入', '/projects/core/guides/gui-integration'),
    page('Connector Webhook', '/projects/core/guides/connector-integration'),
    group('接口与格式参考', [
      page('控制接口总览', '/projects/core/control-plane/'),
      page('HTTP API', '/projects/core/control-plane/http-api'),
      page('本地 IPC', '/projects/core/control-plane/ipc-protocol'),
      page('Connector 投递约定', '/projects/core/control-plane/connector'),
      page('事件目录', '/projects/core/control-plane/events'),
      page('配置模型', '/projects/core/control-plane/configuration'),
      page('通用契约', '/projects/core/control-plane/contract'),
      page('兼容性约定', '/projects/core/control-plane/breaking-changes'),
      page('Zero Rule IR v1', '/projects/core/reference/zero-rule-ir-v1'),
      page('ZRS 0.1', '/projects/core/reference/zrs-0.1'),
      page('ZRS Golden Vector', '/projects/core/reference/zrs-0.1-golden'),
    ]),
  ]),
  group('阅读与贡献', [
    page('阅读说明', '/projects/core/guides/'),
    page('参考索引', '/projects/core/reference/'),
    page('规范与贡献指南', '/projects/core/contributing/'),
  ]),
]

const sinkSidebar: DefaultTheme.SidebarItem[] = [
  page('ZNet Sink', '/projects/znet-sink/'),
  group('开始使用', [
    page('从安装到第一次连接', '/projects/znet-sink/guides/first-connection'),
    page('管理订阅', '/projects/znet-sink/guides/subscriptions'),
    page('切换节点与应用代理', '/projects/znet-sink/guides/proxy-and-probes'),
    page('故障排查', '/projects/znet-sink/guides/troubleshooting'),
  ], false),
  group('按需设置', [
    page('TUN 接管', '/projects/znet-sink/guides/tun'),
    page('DNS 与 Fake-IP', '/projects/znet-sink/guides/dns'),
    page('安装与管理插件', '/projects/znet-sink/guides/plugins'),
  ]),
  group('维护与帮助', [
    page('平台安装详情', '/projects/znet-sink/guides/installation'),
    page('迁移设置与管理内核', '/projects/znet-sink/guides/settings-transfer'),
    page('数据与诊断', '/projects/znet-sink/guides/data-and-diagnostics'),
    page('操作入口速查', '/projects/znet-sink/guides/features'),
    page('阅读说明', '/projects/znet-sink/guides/'),
  ]),
  group('参与项目', [page('规范与贡献指南', '/projects/znet-sink/contributing/')]),
]

const zboardSidebar: DefaultTheme.SidebarItem[] = [
  page('ZBoard', '/projects/zboard/'),
  group('开始使用', [
    page('从部署到第一条线路', '/projects/zboard/guides/'),
    page('日常使用与分享', '/projects/zboard/guides/daily-operations'),
    page('订阅配置与用量', '/projects/zboard/guides/subscriptions-and-traffic'),
    page('故障排查', '/projects/zboard/guides/troubleshooting'),
  ], false),
  group('节点与订阅管理', [
    page('节点管理', '/projects/zboard/guides/node-management'),
    page('协议服务', '/projects/zboard/guides/protocol-services'),
    page('前置入口与共享代理池', '/projects/zboard/guides/network-fronting'),
    page('分配订阅与订单', '/projects/zboard/guides/plans-and-orders'),
    page('订阅筛选', '/projects/zboard/guides/subscription-filtering'),
  ]),
  group('站点维护', [
    page('部署选项', '/projects/zboard/guides/installation'),
    page('初始化设置', '/projects/zboard/guides/first-setup'),
    page('数据存储与备份', '/projects/zboard/guides/storage-and-backups'),
    page('升级与数据库维护', '/projects/zboard/guides/maintenance'),
    page('节点清理', '/projects/zboard/guides/node-cleanup'),
    page('公告与邮件', '/projects/zboard/guides/announcements-and-email'),
    page('DNS 与证书', '/projects/zboard/guides/dns-and-certificates'),
  ]),
  group('插件扩展', [
    page('插件使用说明', '/projects/zboard/plugins/'),
    page('配置市场与安装插件', '/projects/zboard/plugins/marketplace'),
    page('第三方登录', '/projects/zboard/plugins/login'),
    page('安装安全与信任', '/projects/zboard/plugins/trust'),
  ]),
  group('技术参考', [
    page('配置与运行参考', '/projects/zboard/reference/'),
    page('资源与访问权限', '/projects/zboard/reference/core-modules'),
    page('节点配置交付', '/projects/zboard/reference/node-config-delivery'),
    page('规则兼容性', '/projects/zboard/reference/managed-rule-compatibility'),
    group('插件接口', [
      page('插件开发', '/projects/zboard/plugins/development'),
      page('身份接口', '/projects/zboard/plugins/identity-reference'),
      page('生命周期与数据', '/projects/zboard/plugins/governance'),
    ]),
  ]),
  group('参与项目', [
    page('规范与贡献指南', '/projects/zboard/contributing/'),
    page('本地开发与检查', '/projects/zboard/contributing/development'),
  ]),
]

export const sidebar: DefaultTheme.Sidebar = {
  '/progress': projectSidebar,
  '/solutions/': projectSidebar,
  '/community/': communitySidebar,
  '/projects/core/': coreSidebar,
  '/projects/znet-sink/': sinkSidebar,
  '/projects/zboard/': zboardSidebar,
  '/projects/': projectSidebar,
}
