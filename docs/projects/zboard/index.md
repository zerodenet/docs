# Zboard

<ProjectMeta project-id="zboard" />

::: info 文档对应版本
本轮使用说明按 2026-09-09 的 [main 提交 e1b7246c](https://github.com/zerodenet/zboard/tree/e1b7246cc4ef805bf39b22d634ba209114eb3b14)核对。已公开 [v0.0.1 正式版](https://github.com/zerodenet/zboard/releases/tag/v0.0.1)；源码、发布与安装验收范围见[实现与文档进度](/progress)。实际能力以所用制品及运行时响应为准。
:::

Zboard 是代理服务运营管理平台，用于管理 VPS、协议服务、节点组、商品、订单、订阅、配置交付、流量、DNS 和证书。

## 开始使用

1. 阅读[部署指南](./guides/installation)。
2. 完成[首次初始化](./guides/first-setup)，确认站点、系统时区和历史保留策略。
3. 接入基础设施并配置[节点与协议服务](./guides/node-management)。
4. 根据客户端和商业模型配置[订阅交付与流量](./guides/subscriptions-and-traffic)。
5. 需要自动维护域名和 TLS 时配置[DNS 与证书](./guides/dns-and-certificates)。

## 核心能力

- 管理 VPS 资产、供应商账号、SSH 凭证、Zero 安装升级和节点生命周期；
- 将 Zero 内核健康、Connector 事件在线和业务流量活跃作为不同运行事实分别观测；
- 管理前置 TCP/UDP 转发与节点共享代理池，分别授权入口线路和落地协议；
- 使用持久化发布队列重试配置交付；本地资源删除与远端停机清理分别执行；
- 为指定用户分配待付款订单，调整应付金额并保留原因，管理员确认后开通权益；
- 管理 VLESS、VMess、Shadowsocks、Trojan、Hysteria2、Mieru 等协议服务；
- 为 VLESS/VMess 配置 TCP、WebSocket、gRPC 和受支持的 TLS/REALITY 组合；
- 生成面向 ZNet Sink、Clash/Mihomo、sing-box 的完整配置订阅，以及 Shadowrocket、Quantumult X、v2rayN 节点订阅；
- 管理用户、套餐、订单、订阅、流量额度和计费倍率，并提供后端聚合的流量历史与趋势；
- 通过管理 Dashboard 查看收入/订单、订阅生命周期、活跃连接、当前待处理事件和基础设施健康；
- 管理 Cloudflare DNS 记录以及 HTTP-01、DNS-01 证书签发与续期；
- 使用 IANA 系统时区统一运营时间和业务日历读取，并配置审计/运营历史保留周期；
- 接收节点运行事件并进行运营审计。

```text
节点资产 → 协议服务 → 节点组 → 套餐 / SKU → 订单 → 订阅
     ↘ DNS 记录 / 托管证书 ↗
```

协议服务配置、节点实际发布状态和订阅交付状态分别记录。节点完成配置验证、激活和内核健康检查后，可以独立判断 Connector 是否恢复；没有当前用户流量并不等于节点不可用。

## 运营面板

管理 Dashboard 以 `today`、`7d`、`30d` 三个时间范围提供后端聚合的运营读模型，主要包括：

- 已支付净收入、订单和新购/续费构成；
- 新订阅、当前有效订阅以及即将到期/额度耗尽状态；
- 当前有活跃 Principal flow 的订阅和活跃连接总数；
- 所选区间的计费流量和业务趋势；
- 当前未解决的 Connector 离线、最新协议发布失败和待管理员处理工单；
- SSH、Connector、流量凭据、协议服务等基础设施准备度。

历史失败任务、已经被后续成功覆盖的发布失败和普通待支付订单不会继续被当成当前待处理事故。多币种区间也不会被强行相加成一个虚假的收入值。

Dashboard 的日期边界遵循系统设置中的 IANA `system_timezone`。底层记录仍保存为 UTC 绝对时间。

## 系统运营

管理员可以在系统设置中维护时区和运营历史保留策略。默认审计日志保留 180 天，已结束的运营历史和任务历史默认保留 90 天；`0` 表示永久保留。

“设置 → 关于 ZBoard”提供当前 Zboard 版本、发布通道、后端启动时间/运行时长、首次安装时间、MPL-2.0 开源许可和项目资源入口。版本和运行信息来自管理员专用系统信息接口，不通过公开系统信息接口暴露。

## 文档入口

- [用户指南](./guides/)
- [部署指南](./guides/installation)
- [首次初始化](./guides/first-setup)
- [节点与协议服务管理](./guides/node-management)
- [协议服务配置](./guides/protocol-services)
- [订阅交付与流量展示](./guides/subscriptions-and-traffic)
- [DNS 与证书管理](./guides/dns-and-certificates)
- [参与 Zboard](./contributing/)

## 日常操作入口

- [后台导航与日常运营](./guides/daily-operations)
- [套餐、订单与用户交付](./guides/plans-and-orders)
- [公告、注册验证与邮件](./guides/announcements-and-email)
- [系统维护与数据库迁移](./guides/maintenance)
