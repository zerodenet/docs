# 使用场景

## 桌面代理

在 Windows、macOS 或 Linux 上使用代理，可以从 [ZNet Sink](/projects/znet-sink/) 开始。

ZNet Sink 提供配置与订阅管理、节点选择、系统代理、连接状态和诊断。默认集成 Zero Core，也可以按适配能力接入其他运行时。

- [安装 ZNet Sink](/projects/znet-sink/guides/installation)
- [完成第一次连接](/projects/znet-sink/guides/first-connection)
- [功能说明](/projects/znet-sink/guides/features)

## 运行节点

[Zero Core](/projects/core/) 可作为本地网关、边缘节点或服务器运行，提供协议、路由、策略、出站组以及 HTTP、IPC、CLI 等控制接口。

- [快速开始](/projects/core/guides/quickstart)
- [配置基础](/projects/core/guides/configuration-basics)
- [协议配置](/projects/core/protocols/)

## 应用集成

应用、GUI 或控制服务可以通过 Zero Core 的 HTTP、IPC、CLI 等控制接口管理运行时。

- [控制接口总览](/projects/core/control-plane/)
- [GUI 接入](/projects/core/guides/gui-integration)
- [Connector Webhook](/projects/core/guides/connector-integration)

## 服务运营

[Zboard](/projects/zboard/) 用于管理 VPS、协议服务、节点组、商品、订单、订阅、配置交付和流量。

Zboard 可以管理 Zero Core 节点，也可以通过适配接入外部节点或运行时。Zboard 当前处于预览阶段。

- [部署 Zboard](/projects/zboard/guides/installation)
- [节点与协议服务管理](/projects/zboard/guides/node-management)
- [订阅交付与流量展示](/projects/zboard/guides/subscriptions-and-traffic)

## 常见组合

| 需求 | 入口 |
| --- | --- |
| 桌面代理 | ZNet Sink |
| 自建节点 | Zero Core |
| 自己开发客户端或控制面 | Zero Core 控制接口 |
| 管理节点和订阅业务 | Zboard |
| ZNet Sink 使用 Zero 运行时 | ZNet Sink + Zero Core |
| Zboard 管理 Zero 节点 | Zboard + Zero Core |
