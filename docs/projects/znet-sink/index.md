# ZNet Sink

<ProjectMeta project-id="znet-sink" />

::: info 文档对应版本
本轮使用说明按 2026-09-09 的 [main 提交 6d822fb9](https://github.com/zerodenet/znet-sink/tree/6d822fb96140be87cdccdd0bea472ba0b089cf04)核对。已公开 [0.0.1 正式版](https://github.com/zerodenet/znet-sink/releases/tag/v0.0.1)；源码、发布与安装验收范围见[实现与文档进度](/progress)。实际能力以所用制品及运行时响应为准。
:::

ZNet Sink 是跨平台代理客户端，提供配置与订阅管理、节点选择、系统代理、连接状态和诊断。默认集成 Zero Core，并可通过适配接入其他运行时。

::: tip 关于界面截图
为避免公开真实订阅、节点和连接信息，部分整页截图由 ZNet Sink 当前 Svelte/Tauri 客户端前端加载脱敏演示数据生成。界面结构、组件和主题来自客户端本体；图中网络状态与测速结果仅用于说明操作。
:::

<figure class="product-screenshot product-screenshot--wide">
  <img src="/screenshots/znet-sink-overview-demo.png" alt="ZNet Sink 客户端概览，展示内核运行状态、代理模式、TUN 状态和流量趋势" loading="lazy">
  <figcaption>客户端真实界面 · 概览集中展示运行状态、代理模式、TUN 与实时流量</figcaption>
</figure>

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
- [功能总览](./guides/features)
- [故障排查](./guides/troubleshooting)
- [参与 ZNet Sink](./contributing/)
