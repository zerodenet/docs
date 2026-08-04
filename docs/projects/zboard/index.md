# Zboard

<ProjectMeta project-id="zboard" />

Zboard 是面向代理服务提供商的一站式运营管理平台，将 VPS 基础设施、协议节点、订阅交付、用户套餐、订单、流量统计、DNS、证书和运维流程整合到统一系统中。

## 开始使用

1. 阅读[部署指南](./guides/installation)。
2. 完成[首次初始化](./guides/first-setup)。
3. 接入基础设施并配置[节点与协议服务](./guides/node-management)。
4. 根据客户端和商业模型配置[订阅交付与流量](./guides/subscriptions-and-traffic)。
5. 需要自动维护域名和 TLS 时配置[DNS 与证书](./guides/dns-and-certificates)。

## 核心能力

- 管理 VPS 资产、供应商账号、SSH 凭证和节点生命周期；
- 管理 VLESS、VMess、Shadowsocks、Trojan、Hysteria2、Mieru 等协议服务；
- 为 VLESS/VMess 配置 TCP、WebSocket、gRPC 和受支持的 TLS/REALITY 组合；
- 生成面向 ZNet Sink、Clash/Mihomo、sing-box 的可直接运行订阅配置；
- 管理用户、套餐、订单、订阅、流量额度和计费倍率；
- 管理 Cloudflare DNS 记录以及 HTTP-01、DNS-01 证书签发与续期；
- 接收节点运行事件并进行运营审计。

Zboard 将基础设施资源与商业资源分离：

```text
节点资产 → 协议服务 → 节点组 → 套餐 / SKU → 订单 → 订阅
     ↘ DNS 记录 / 托管证书 ↗
```

协议服务配置、节点实际发布状态和订阅交付状态是不同层次。只有节点成功完成配置验证、激活、健康检查和事件接入后，依赖内核能力的订阅用户凭据才应进入公开输出。

## 文档入口

- [用户指南](./guides/)
- [部署指南](./guides/installation)
- [节点与协议服务管理](./guides/node-management)
- [协议服务配置](./guides/protocol-services)
- [订阅交付与流量展示](./guides/subscriptions-and-traffic)
- [DNS 与证书管理](./guides/dns-and-certificates)
- [参与 Zboard](./contributing/)

内部设计、开发记录和实现讨论请以 [Zboard 仓库](https://github.com/zerodenet/zboard) 为准。
