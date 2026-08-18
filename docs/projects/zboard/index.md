# Zboard

<ProjectMeta project-id="zboard" />

Zboard 是代理服务运营管理平台，用于管理 VPS、协议服务、节点组、商品、订单、订阅、配置交付、流量、DNS 和证书。

## 开始使用

1. 阅读[部署指南](./guides/installation)。
2. 完成[首次初始化](./guides/first-setup)。
3. 接入基础设施并配置[节点与协议服务](./guides/node-management)。
4. 根据客户端和商业模型配置[订阅交付与流量](./guides/subscriptions-and-traffic)。
5. 需要自动维护域名和 TLS 时配置[DNS 与证书](./guides/dns-and-certificates)。
6. 开始日常运营后查看[运营概览与系统设置](./guides/operations)。

## 核心能力

- 管理 VPS 资产、供应商账号、SSH 凭证和节点生命周期；
- 管理 VLESS、VMess、Shadowsocks、Trojan、Hysteria2、Mieru 等协议服务；
- 为 VLESS/VMess 配置 TCP、WebSocket、gRPC 和受支持的 TLS/REALITY 组合；
- 生成面向 ZNet Sink、Clash/Mihomo、sing-box、Shadowrocket、Quantumult X、v2rayN 的订阅输出；
- 管理用户、套餐、订单、订阅、流量额度和计费倍率；
- 从业务健康视角查看收入、订单、订阅、节点、Connector、流量和待处理状态；
- 配置全站系统时区以及审计、任务和运行历史的保留周期；
- 管理 Cloudflare DNS 记录以及 HTTP-01、DNS-01 证书签发与续期；
- 接收节点运行事件并进行运营审计。

```text
节点资产 → 协议服务 → 节点组 → 套餐 / SKU → 订单 → 订阅
     ↘ DNS 记录 / 托管证书 ↗
```

协议服务配置、节点实际发布状态、Zero 健康、Connector 在线状态和订阅交付状态分别记录。节点完成配置验证、激活、健康检查和事件接入后，相关订阅配置才进入交付流程。

## 文档入口

- [用户指南](./guides/)
- [部署指南](./guides/installation)
- [节点与协议服务管理](./guides/node-management)
- [协议服务配置](./guides/protocol-services)
- [订阅交付与流量展示](./guides/subscriptions-and-traffic)
- [DNS 与证书管理](./guides/dns-and-certificates)
- [运营概览与系统设置](./guides/operations)
- [参与 Zboard](./contributing/)
