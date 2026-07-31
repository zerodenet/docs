# Zboard

<ProjectMeta project-id="zboard" />

Zboard 是面向代理服务提供商的一站式运营管理平台，将 VPS 基础设施、协议节点、订阅交付、用户套餐、订单、流量统计和运维流程整合到统一系统中。

## 开始使用

1. 阅读[部署指南](./guides/installation)。
2. 完成[首次初始化](./guides/first-setup)。
3. 根据业务需要配置[节点与协议服务](./guides/node-management)。

## 核心能力

- 管理 VPS 资产、SSH 凭证和节点生命周期；
- 管理 VLESS、VMess、Shadowsocks、Trojan、Hysteria2 等协议服务；
- 生成面向 ZNet Sink、Clash/Mihomo、sing-box 的订阅配置；
- 管理用户、套餐、订单、订阅和流量额度；
- 接收节点运行事件并进行运营审计。

Zboard 将基础设施资源与商业资源分离：

```text
节点资产 → 协议服务 → 节点组 → 套餐 / SKU → 订单 → 订阅
```

## 文档入口

- [用户指南](./guides/)
- [部署指南](./guides/installation)
- [节点管理](./guides/node-management)
- [参与 Zboard](./contributing/)

内部设计、开发记录和实现讨论请以 [Zboard 仓库](https://github.com/zerodenet/zboard) 为准。
