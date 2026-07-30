import type { DefaultTheme } from 'vitepress'

const page = (text: string, link: string): DefaultTheme.SidebarItem => ({ text, link })

const group = (
  text: string,
  items: DefaultTheme.SidebarItem[],
  collapsed = true,
): DefaultTheme.SidebarItem => ({ text, items, collapsed })

export const nav: DefaultTheme.NavItem[] = [
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
    ],
  },
]

const coreSidebar: DefaultTheme.SidebarItem[] = [
  page('Zero Core 使用手册', '/projects/core/'),
  group('开始使用', [
    page('使用指南', '/projects/core/guides/'),
    page('安装与构建', '/projects/core/guides/installation'),
    page('启动第一个节点', '/projects/core/guides/quickstart'),
    page('配置基础', '/projects/core/guides/configuration-basics'),
  ], false),
  group('日常管理', [
    page('运行与观测', '/projects/core/guides/operations'),
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
  ], false),
  group('帮助与诊断', [
    page('故障排查', '/projects/znet-sink/guides/troubleshooting'),
    page('数据与诊断', '/projects/znet-sink/guides/data-and-diagnostics'),
  ]),
  group('参与项目', [
    page('参与 ZNet Sink', '/projects/znet-sink/contributing/'),
  ]),
]

export const sidebar: DefaultTheme.Sidebar = {
  '/projects/core/': coreSidebar,
  '/projects/znet-sink/': sinkSidebar,
  '/projects/': [
    page('项目目录', '/projects/'),
    group('应用', [page('ZNet Sink', '/projects/znet-sink/')]),
    group('内核', [page('Zero Core', '/projects/core/')]),
  ],
}
