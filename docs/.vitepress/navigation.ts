import type { DefaultTheme } from 'vitepress'

const page = (text: string, link: string): DefaultTheme.SidebarItem => ({ text, link })

const group = (
  text: string,
  items: DefaultTheme.SidebarItem[],
  collapsed = true,
): DefaultTheme.SidebarItem => ({ text, items, collapsed })

const section = (
  text: string,
  link: string,
  items: DefaultTheme.SidebarItem[],
): DefaultTheme.SidebarItem => ({ text, link, items, collapsed: true })

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
  page('Zero Core 文档', '/projects/core/'),
  group('技术参数', [
    page('技术参数总览', '/projects/core/reference/technical-specifications'),
    page('协议能力矩阵', '/projects/core/reference/protocol-capabilities'),
    page('构建特性', '/projects/core/configuration/features'),
  ], false),
  group('配置与运行', [
    page('配置参考', '/projects/core/configuration/'),
    page('运行模式与出站组', '/projects/core/configuration/modes-and-groups'),
    page('配置错误处理', '/projects/core/guides/config-failure-examples'),
  ]),
  group('协议实现', [
    page('协议概览', '/projects/core/protocols/'),
    page('配置速查', '/projects/core/protocols/configuration'),
    page('已知缺口', '/projects/core/protocols/incomplete'),
    section('SOCKS5', '/projects/core/protocols/socks5/', [
      page('入站', '/projects/core/protocols/socks5/inbound'),
      page('出站', '/projects/core/protocols/socks5/outbound'),
      page('共享能力', '/projects/core/protocols/socks5/shared'),
    ]),
    page('HTTP CONNECT', '/projects/core/protocols/http/'),
    section('Mixed', '/projects/core/protocols/mixed/', [
      page('入站', '/projects/core/protocols/mixed/inbound'),
      page('架构', '/projects/core/protocols/mixed/architecture'),
    ]),
    section('VLESS', '/projects/core/protocols/vless/', [
      page('入站', '/projects/core/protocols/vless/inbound'),
      page('出站', '/projects/core/protocols/vless/outbound'),
      page('共享能力', '/projects/core/protocols/vless/shared'),
    ]),
    section('Hysteria2', '/projects/core/protocols/hysteria2/', [
      page('入站', '/projects/core/protocols/hysteria2/inbound'),
      page('出站', '/projects/core/protocols/hysteria2/outbound'),
      page('共享能力', '/projects/core/protocols/hysteria2/shared'),
    ]),
    section('Shadowsocks', '/projects/core/protocols/shadowsocks/', [
      page('入站', '/projects/core/protocols/shadowsocks/inbound'),
      page('出站', '/projects/core/protocols/shadowsocks/outbound'),
      page('元数据', '/projects/core/protocols/shadowsocks/metadata'),
      page('共享能力', '/projects/core/protocols/shadowsocks/shared'),
      page('流式传输', '/projects/core/protocols/shadowsocks/stream'),
    ]),
    section('Trojan', '/projects/core/protocols/trojan/', [
      page('入站', '/projects/core/protocols/trojan/inbound'),
      page('出站', '/projects/core/protocols/trojan/outbound'),
      page('元数据', '/projects/core/protocols/trojan/metadata'),
      page('共享能力', '/projects/core/protocols/trojan/shared'),
    ]),
    section('Mieru', '/projects/core/protocols/mieru/', [
      page('入站', '/projects/core/protocols/mieru/inbound'),
      page('出站', '/projects/core/protocols/mieru/outbound'),
      page('Flow', '/projects/core/protocols/mieru/flow'),
    ]),
    section('VMess', '/projects/core/protocols/vmess/', [
      page('入站', '/projects/core/protocols/vmess/inbound'),
      page('出站', '/projects/core/protocols/vmess/outbound'),
      page('加密', '/projects/core/protocols/vmess/crypto'),
      page('元数据', '/projects/core/protocols/vmess/metadata'),
      page('MUX', '/projects/core/protocols/vmess/mux'),
      page('共享能力', '/projects/core/protocols/vmess/shared'),
      page('流式传输', '/projects/core/protocols/vmess/stream'),
      page('UDP', '/projects/core/protocols/vmess/udp'),
    ]),
  ]),
  group('控制面与契约', [
    page('控制与集成', '/projects/core/control-plane/'),
    page('配置模型', '/projects/core/control-plane/configuration'),
    page('HTTP JSON API', '/projects/core/control-plane/http-api'),
    page('本地 IPC', '/projects/core/control-plane/ipc-protocol'),
    page('事件目录', '/projects/core/control-plane/events'),
    page('FlowHook', '/projects/core/control-plane/hooks'),
    page('节点主动上报', '/projects/core/control-plane/push-connector'),
    page('CLI', '/projects/core/control-plane/cli'),
    page('通用契约', '/projects/core/control-plane/contract'),
    page('破坏性变更', '/projects/core/control-plane/breaking-changes'),
  ]),
  group('架构与格式', [
    page('总体架构', '/projects/core/architecture/'),
    page('请求生命周期', '/projects/core/architecture/lifecycle'),
    page('参考资料入口', '/projects/core/reference/'),
    page('Zero Rule IR v1', '/projects/core/reference/zero-rule-ir-v1'),
    page('ZRS 0.1', '/projects/core/reference/zrs-0.1'),
    page('ZRS Golden Vector', '/projects/core/reference/zrs-0.1-golden'),
  ]),
  group('运行与接入', [
    page('指南入口', '/projects/core/guides/'),
    page('快速开始', '/projects/core/guides/quickstart'),
    page('GUI 接入 Core', '/projects/core/guides/gui-integration'),
    page('面板接入 Core', '/projects/core/guides/panel-integration'),
    page('Connector 生产运维', '/projects/core/guides/connector-operations'),
    page('Connector 生产报告模板', '/projects/core/guides/connector-production-report-template'),
  ]),
  group('参与项目', [
    page('参与 Zero Core', '/projects/core/contributing/'),
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
