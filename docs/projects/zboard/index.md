# ZBoard

<ProjectMeta project-id="zboard" />

ZBoard 是面向 Zero 代理服务的自托管基础面板，提供节点、协议、用户、订阅、基础订单和流量管理。在线支付及其他超出基础管理范围的能力通过插件按需实现。

管理员配置节点和访问权限，用户在账户中心获取订阅、查看用量和提交工单。Zero 运行在节点上，负责代理连接与流量处理。

## 从这里开始

| 你想做什么 | 阅读入口 |
| --- | --- |
| 安装自己的面板 | [安装教程](./guides/installation) |
| 创建管理员和站点 | [首次初始化](./guides/first-setup) |
| 接入节点并提供订阅 | [节点管理](./guides/node-management) → [协议服务](./guides/protocol-services) → [订阅配置](./guides/subscriptions-and-traffic) |
| 安装按需扩展 | [插件市场](./plugins/marketplace)与[登录插件](./plugins/login) |
| 开发或改进 ZBoard | [参与项目](./contributing/) |

## 基础能力

- **节点与协议**：管理服务器、SSH 连接、Zero 安装和配置发布，配置 VLESS、VMess、Shadowsocks、Trojan、Hysteria2 和 Mieru 服务。
- **访问与订阅**：通过节点组关联套餐和用户权益，生成 Zero、Clash/Mihomo、sing-box 等客户端配置。
- **网络前置**：使用转发入口访问落地服务，并按需共用节点代理池。
- **基础订单与流量**：管理订单、订阅有效期和流量额度，查询用量和任务结果。
- **账户与支持**：提供用户账户、公告、工单和审计记录。

具体协议是否可用取决于节点安装的 Zero 内核。连接节点、发布配置与客户端实际连接是不同步骤，首次使用可按[用户指南](./guides/)逐项完成。

## 选择版本

[0.0.1](https://github.com/zerodenet/zboard/releases/tag/v0.0.1) 是首个公开版本。下载入口见 [Releases](https://github.com/zerodenet/zboard/releases)。插件运行时和市场在后续开发版本中提供，对应说明会标注适用范围。
