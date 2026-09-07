# ZNet Sink

<ProjectMeta project-id="znet-sink" />

::: info 文档对应版本
本轮使用说明按 2026-09-03 的 [develop 提交 dff6b73](https://github.com/zerodenet/znet-sink/tree/dff6b732415a860e3807cb22ccbdb016c230eccc)核对。develop 包含尚未进入稳定版的功能；安装旧版时，以实际版本和可用能力为准。
:::

ZNet Sink 是跨平台代理客户端，提供配置与订阅管理、节点选择、系统代理、连接状态和诊断。默认集成 Zero Core，并可通过适配接入其他运行时。

::: tip 先在网页里操作一遍
打开[交互式客户端导览](./guides/interactive-tour)，可以用安全的假数据体验连接、订阅同步、节点切换、规则分流、连接记录和诊断流程，不需要安装客户端。
:::

<figure class="product-screenshot product-screenshot--wide">
  <img src="/screenshots/znet-sink-rules.png" alt="ZNet Sink 专业模式中的规则集管理界面" loading="lazy">
  <figcaption>实机截图 · 专业模式的规则集管理</figcaption>
</figure>

## 第一次使用

1. [下载最新版客户端](/download)，并[完成首次启动](./guides/installation)。
2. [导入配置并完成第一次连接](./guides/first-connection)。
3. 如果使用远程订阅，阅读[订阅管理](./guides/subscriptions)。

## 主要功能

- 管理本地代理配置和远程订阅；
- 查看连接状态并切换节点、策略组和运行模式；
- 管理系统代理、[TUN 接管网段](./guides/tun)及 [DNS/Fake-IP](./guides/dns)；
- [迁移客户端设置并管理内核版本](./guides/settings-transfer)；
- 查看实时连接、日志和能力信息；
- 导出经过脱敏的诊断资料。

完整说明见[功能总览](./guides/features)。简约模式保留日常使用入口，专业模式增加节点、规则、实时连接、日志和调试功能；切换界面模式不会修改已有配置和连接行为。

遇到问题时，先查看[故障排查](./guides/troubleshooting)，再按[数据与诊断](./guides/data-and-diagnostics)导出不含代理配置、订阅地址或凭据的诊断包。

## 项目入口

- [用户指南](./guides/)
- [交互式客户端导览](./guides/interactive-tour)
- [功能总览](./guides/features)
- [故障排查](./guides/troubleshooting)
- [参与 ZNet Sink](./contributing/)
