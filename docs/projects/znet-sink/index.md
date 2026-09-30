# ZNet Sink

<ProjectMeta project-id="znet-sink" />

ZNet Sink 是 Windows、macOS 和 Linux 上的桌面代理客户端。你可以用它添加订阅、选择节点、开启代理，并查看连接和日志。它基于 Tauri 构建，负责界面和本机管理；实际转发流量的是单独安装的 Zero Core（参见[项目选择](/projects/)）。当前客户端对接 Zero，不提供切换其他代理内核的功能。

## 第一次使用

准备一条自己的订阅链接，或服务提供方给出的 Zero JSON 配置。安装客户端不会自动获得代理节点。

1. [安装 ZNet Sink，并安装 Zero 内核](./guides/installation)。
2. [添加订阅、选中配置，完成第一次连接](./guides/first-connection)。
3. 连接成功后，再按需要设置 [TUN](./guides/tun)、[DNS](./guides/dns)或[绕过内网](./guides/proxy-and-probes#统一绕过规则)。

第一次建议按教程使用专业模式，只开启系统代理，先确认浏览器能用。简约模式的电源按钮会同时开启系统代理和 TUN，需要额外的系统权限。

## 主要功能

- [订阅管理](./guides/subscriptions)：添加、同步和定时更新代理来源
- [节点选择与测速](./guides/proxy-and-probes#节点与-urltest-测速)：选择出口，检查节点是否可用
- [系统代理与 TUN](./guides/tun)：让浏览器或更多应用使用代理
- [DNS 与 Fake-IP](./guides/dns)：调整域名解析和内网访问
- [插件](./guides/plugins)：在支持插件的客户端版本中安装并授权扩展
- [数据与诊断](./guides/data-and-diagnostics)：查看连接、日志，准备问题反馈

完整入口见[功能总览](./guides/features)。遇到连接问题，直接进入[故障排查](./guides/troubleshooting)。

<figure class="product-screenshot product-screenshot--wide">
  <img src="/screenshots/znet-sink-overview-demo.png" alt="ZNet Sink 概览，展示内核运行状态、代理模式、TUN 和流量" loading="lazy">
  <figcaption>概览示意 · 截图来自客户端前端和脱敏演示数据，按钮位置可能随版本变化</figcaption>
</figure>

## 文档适用版本

本指南于 2026-09-30 核对：

- 最新正式版仍为 [v0.0.1](https://github.com/zerodenet/znet-sink/releases/tag/v0.0.1)
- 当前界面说明以已发布的 [v0.0.2-rc.202609291414 候选版](https://github.com/zerodenet/znet-sink/releases/tag/v0.0.2-rc.202609291414)为准；对应[发布源码 3aa5c7f](https://github.com/zerodenet/znet-sink/tree/3aa5c7fe36b3cc0966e417482fa13813119b31f9)
- 插件、当前配置的本地修改等功能与 0.0.1 不同；这些页面会注明差异。候选版不等于正式版，使用前保留配置备份

客户端、内核和插件分别更新。某个按钮是否可用，还取决于实际安装的 Zero 内核、当前配置及系统权限。发布包存在不代表各平台安装运行已全部验收；已知验证范围见[版本与使用限制](/progress)。

## 项目入口

- [用户指南](./guides/)
- [功能总览](./guides/features)
- [故障排查](./guides/troubleshooting)
- [贡献与问题反馈](./contributing/)
