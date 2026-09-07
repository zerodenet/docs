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
    page('交互式客户端导览', '/projects/znet-sink/guides/interactive-tour'),
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
  page('Zboard 文档', '/projects/zboard/'),
  group('开始使用', [
    page('用户指南入口', '/projects/zboard/guides/'),
    page('安装与部署', '/projects/zboard/guides/installation'),
    page('首次初始化', '/projects/zboard/guides/first-setup'),
    page('后台导航与日常运营', '/projects/zboard/guides/daily-operations'),
  ], false),
  group('功能说明', [
    page('节点与协议服务管理', '/projects/zboard/guides/node-management'),
    page('协议服务配置', '/projects/zboard/guides/protocol-services'),
    page('套餐、订单与用户交付', '/projects/zboard/guides/plans-and-orders'),
    page('订阅交付与流量展示', '/projects/zboard/guides/subscriptions-and-traffic'),
    page('公告、注册验证与邮件', '/projects/zboard/guides/announcements-and-email'),
    page('系统维护与数据库迁移', '/projects/zboard/guides/maintenance'),
    page('DNS 与证书管理', '/projects/zboard/guides/dns-and-certificates'),
    page('故障排查', '/projects/zboard/guides/troubleshooting'),
  ]),
  group('参与项目', [
    page('参与 Zboard', '/projects/zboard/contributing/'),
  ]),
]

export const sidebar: DefaultTheme.Sidebar = {
  '/solutions/': solutionSidebar,
  '/community/': communitySidebar,
  '/projects/core/': coreSidebar,
  '/projects/znet-sink/': sinkSidebar,
  '/projects/zboard/': zboardSidebar,
  '/projects/': [
    page('项目目录', '/projects/'),
    group('应用', [page('ZNet Sink', '/projects/znet-sink/')]),
    group('内核', [page('Zero Core', '/projects/core/')]),
    group('运营平台', [page('Zboard', '/projects/zboard/')]),
  ],
}
