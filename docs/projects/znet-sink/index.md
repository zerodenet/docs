# ZNet Sink

<ProjectMeta project-id="znet-sink" />

ZNet Sink 是跨平台代理客户端，提供配置与订阅管理、节点选择、系统代理、TUN、连接状态和诊断。默认集成 Zero Core，并可通过适配接入其他运行时。

## 第一次使用

1. [安装并完成首次启动](./guides/installation)。
2. [导入配置并完成第一次连接](./guides/first-connection)。
3. 如果使用远程订阅，阅读[订阅管理](./guides/subscriptions)。
4. 需要接管系统路由时，阅读[TUN 模式](./guides/tun)。

## 主要功能

- 管理本地代理配置和远程订阅；
- 查看连接状态并切换节点、策略组和运行模式；
- 独立管理系统代理和 Zero TUN 入口；
- 查看实时连接、日志和能力信息；
- 导出经过脱敏的诊断资料。

完整说明见[功能总览](./guides/features)。简约模式保留日常使用入口，专业模式增加节点、规则、实时连接、日志和调试功能；切换界面模式不会修改已有配置和连接行为。

ZNet Sink `0.0.16-rc.8` 已接入 Zero `0.0.16` TUN 生命周期，但应用托管的 TUN DNS 劫持在当前版本仍暂不可用。需要 DNS 接管时不要只依据 TUN 开关判断，具体边界见[TUN 模式](./guides/tun)。

遇到问题时，先查看[故障排查](./guides/troubleshooting)，再按[数据与诊断](./guides/data-and-diagnostics)导出不含代理配置、订阅地址或凭据的诊断包。

## 项目入口

- [用户指南](./guides/)
- [功能总览](./guides/features)
- [TUN 模式](./guides/tun)
- [故障排查](./guides/troubleshooting)
- [参与 ZNet Sink](./contributing/)
