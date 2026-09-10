import type { DefaultTheme } from 'vitepress'

const page = (text: string, link: string): DefaultTheme.SidebarItem => ({ text, link })

const group = (
  text: string,
  items: DefaultTheme.SidebarItem[],
  collapsed = true,
): DefaultTheme.SidebarItem => ({ text, items, collapsed })

export const nav: DefaultTheme.NavItem[] = [
  { text: '下载客户端', link: '/download' },
  {
    text: '项目',
    items: [
      { text: '全部项目', link: '/projects/' },
      { text: '实现与文档进度', link: '/progress' },
      {
        text: '客户端',
        items: [
          { text: 'ZNet Sink', link: '/projects/znet-sink/', activeMatch: '^/projects/znet-sink/' },
        ],
      },
      {
        text: '内核',
        items: [
          { text: 'Zero Core', link: '/projects/core/', activeMatch: '^/projects/core/' },
        ],
      },
      {
        text: '运营平台',
        items: [
          { text: 'Zboard', link: '/projects/zboard/', activeMatch: '^/projects/zboard/' },
        ],
      },
    ],
  },
  { text: '使用场景', link: '/solutions/' },
  {
    text: '社区',
    items: [
      { text: '社区首页', link: '/community/' },
      { text: 'GitHub Discussions', link: 'https://github.com/orgs/zerodenet/discussions' },
      { text: 'Telegram', link: 'https://t.me/zerodenet' },
    ],
  },
]

const solutionSidebar: DefaultTheme.SidebarItem[] = [
  page('使用场景', '/solutions/'),
  page('实现与文档进度', '/progress'),
  group('项目', [
    page('全部项目', '/projects/'),
    page('ZNet Sink', '/projects/znet-sink/'),
    page('Zero Core', '/projects/core/'),
    page('Zboard', '/projects/zboard/'),
  ], false),
]

const communitySidebar: DefaultTheme.SidebarItem[] = [
  page('社区', '/community/'),
  page('问题反馈', '/community/#问题反馈'),
  page('赞助、广告与友情链接', '/community/#赞助广告与友情链接'),
]

const coreSidebar: DefaultTheme.SidebarItem[] = [
  page('Zero Core 使用手册', '/projects/core/'),
  group('开始使用', [
    page('使用指南', '/projects/core/guides/'),
    page('安装与构建', '/projects/core/guides/installation'),
    page('启动第一个节点', '/projects/core/guides/quickstart'),
    page('配置基础', '/projects/core/guides/configuration-basics'),
    page('运行 TUN 与 DNS', '/projects/core/guides/tun-and-dns'),
  ], false),
  group('日常管理', [
    page('运行与观测', '/projects/core/guides/operations'),
    page('HTTP / Mixed 与 URLTest', '/projects/core/guides/proxy-and-urltest'),
    page('安全热更新配置', '/projects/core/guides/hot-reload'),
    page('使用控制 API', '/projects/core/guides/control-api'),
    page('保护控制接口', '/projects/core/guides/control-security'),
    page('故障排查', '/projects/core/guides/troubleshooting'),
    page('配置错误示例', '/projects/core/guides/config-failure-examples'),
  ], false),
  group('外部系统接入', [
    page('Connector Webhook', '/projects/core/guides/connector-integration'),
    page('GUI 接入', '/projects/core/guides/gui-integration'),
  ]),
  group('协议配置', [
    page('选择协议', '/projects/core/protocols/'),
    page('配置示例', '/projects/core/protocols/configuration'),
    page('能力与限制', '/projects/core/reference/protocol-capabilities'),
  ]),
  group('参考', [
    page('参考入口', '/projects/core/reference/'),
    page('能力与端口速查', '/projects/core/reference/technical-specifications'),
    page('配置字段', '/projects/core/configuration/'),
    page('DNS 与 Fake-IP 参数', '/projects/core/configuration/dns'),
    page('运行模式与出站组', '/projects/core/configuration/modes-and-groups'),
    page('构建特性', '/projects/core/configuration/features'),
    page('控制接口总览', '/projects/core/control-plane/'),
    page('CLI 命令', '/projects/core/control-plane/cli'),
    page('HTTP API', '/projects/core/control-plane/http-api'),
    page('本地 IPC', '/projects/core/control-plane/ipc-protocol'),
    page('Connector 投递合同', '/projects/core/control-plane/connector'),
    page('事件目录', '/projects/core/control-plane/events'),
    page('配置模型', '/projects/core/control-plane/configuration'),
    page('通用契约', '/projects/core/control-plane/contract'),
    page('协议能力矩阵', '/projects/core/reference/protocol-capabilities'),
    page('破坏性变更', '/projects/core/control-plane/breaking-changes'),
    page('Zero Rule IR v1', '/projects/core/reference/zero-rule-ir-v1'),
    page('ZRS 0.1', '/projects/core/reference/zrs-0.1'),
    page('ZRS Golden Vector', '/projects/core/reference/zrs-0.1-golden'),
  ]),
]

const sinkSidebar: DefaultTheme.SidebarItem[] = [
  page('ZNet Sink 文档', '/projects/znet-sink/'),
  group('开始使用', [
    page('用户指南入口', '/projects/znet-sink/guides/'),
    page('安装与首次启动', '/projects/znet-sink/guides/installation'),
    page('完成第一次连接', '/projects/znet-sink/guides/first-connection'),
  ], false),
  group('功能说明', [
    page('功能总览', '/projects/znet-sink/guides/features'),
    page('订阅管理', '/projects/znet-sink/guides/subscriptions'),
    page('DNS 与 Fake-IP', '/projects/znet-sink/guides/dns'),
    page('TUN 接管与网络切换', '/projects/znet-sink/guides/tun'),
    page('迁移设置与管理内核', '/projects/znet-sink/guides/settings-transfer'),
    page('本地代理与节点测速', '/projects/znet-sink/guides/proxy-and-probes'),
  ], false),
  group('帮助与诊断', [
    page('故障排查', '/projects/znet-sink/guides/troubleshooting'),
    page('数据与诊断', '/projects/znet-sink/guides/data-and-diagnostics'),
  ]),
  group('参与项目', [
    page('参与 ZNet Sink', '/projects/znet-sink/contributing/'),
  ]),
]

const zboardSidebar: DefaultTheme.SidebarItem[] = [
  page('ZBoard 基础面板', '/projects/zboard/'),
  group('开始使用', [
    page('用户指南', '/projects/zboard/guides/'),
    page('安装与部署', '/projects/zboard/guides/installation'),
    page('首次初始化', '/projects/zboard/guides/first-setup'),
    page('日常管理', '/projects/zboard/guides/daily-operations'),
    page('数据存储与备份', '/projects/zboard/guides/storage-and-backups'),
  ], false),
  group('基础功能', [
    page('节点管理', '/projects/zboard/guides/node-management'),
    page('协议服务', '/projects/zboard/guides/protocol-services'),
    page('网络前置与共享代理池', '/projects/zboard/guides/network-fronting'),
    page('套餐与订单', '/projects/zboard/guides/plans-and-orders'),
    page('订阅与流量', '/projects/zboard/guides/subscriptions-and-traffic'),
    page('订阅筛选', '/projects/zboard/guides/subscription-filtering'),
    page('公告与邮件', '/projects/zboard/guides/announcements-and-email'),
    page('DNS 与证书', '/projects/zboard/guides/dns-and-certificates'),
    page('系统维护', '/projects/zboard/guides/maintenance'),
    page('节点清理', '/projects/zboard/guides/node-cleanup'),
    page('故障排查', '/projects/zboard/guides/troubleshooting'),
  ]),
  group('插件市场与使用', [
    page('插件能力与边界', '/projects/zboard/plugins/'),
    page('配置市场与安装插件', '/projects/zboard/plugins/marketplace'),
    page('启用第三方登录', '/projects/zboard/plugins/login'),
    page('安装安全与信任', '/projects/zboard/plugins/trust'),
  ], false),
  group('开发与技术参考', [
    page('参与项目', '/projects/zboard/contributing/'),
    page('本地开发', '/projects/zboard/contributing/development'),
    page('插件开发', '/projects/zboard/plugins/development'),
    page('身份接口', '/projects/zboard/plugins/identity-reference'),
    page('插件治理', '/projects/zboard/plugins/governance'),
    page('配置与运行参考', '/projects/zboard/reference/'),
    page('节点配置交付', '/projects/zboard/reference/node-config-delivery'),
    page('规则兼容性', '/projects/zboard/reference/managed-rule-compatibility'),
  ]),
]

export const sidebar: DefaultTheme.Sidebar = {
  '/progress': solutionSidebar,
  '/solutions/': solutionSidebar,
  '/community/': communitySidebar,
  '/projects/core/': coreSidebar,
  '/projects/znet-sink/': sinkSidebar,
  '/projects/zboard/': zboardSidebar,
  '/projects/': [
    page('项目目录', '/projects/'),
    page('实现与文档进度', '/progress'),
    group('应用', [page('ZNet Sink', '/projects/znet-sink/')]),
    group('内核', [page('Zero Core', '/projects/core/')]),
    group('基础面板', [page('ZBoard', '/projects/zboard/')]),
  ],
}
