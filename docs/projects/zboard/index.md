# ZBoard

<ProjectMeta project-id="zboard" />

ZBoard 是面向自用与分享的 Zero 代理服务管理面板。你可以在一个 Web 控制台里接入自己的服务器、配置线路、为自己或其他用户分配订阅，并查看用量。节点上的 [Zero Core](https://github.com/zerodenet/core) 负责实际代理连接，面板负责配置和管理。

先让自己的一条线路可用，再按需要分享给其他人。核心保持日常管理所需的基础能力，第三方登录、支付渠道等扩展按需使用插件。

## 从这里开始

| 你现在要做什么 | 阅读入口 |
| --- | --- |
| 从零搭建自己的面板 | [安装](./guides/installation) → [初始化](./guides/first-setup) |
| 把服务器变成可用线路 | [接入节点](./guides/node-management) → [配置协议](./guides/protocol-services) |
| 给自己或其他人开通访问 | [分配订阅](./guides/plans-and-orders) |
| 已有账户，想导入客户端 | [获取配置与查看用量](./guides/subscriptions-and-traffic) |
| 平时管理、停止分享或排障 | [日常使用与分享](./guides/daily-operations) · [故障排查](./guides/troubleshooting) |
| 需要额外能力 | [插件使用](./plugins/) |

## 基础能力

- **自己的节点**：保存服务器与 SSH 信息，安装 Zero，发布配置并查看结果。
- **自己的线路**：配置协议、证书和端口；按需要增加转发入口或上游代理。
- **访问分配**：用权限组选择线路，用订阅记录有效期和流量额度，向客户端交付配置。
- **日常管理**：查看用量、任务和日志，管理账户、公告及工单。

界面仍包含商品、销售规格和订单。当前版本通过订单确认创建订阅；自用或免费分享可分配零金额订单，无需接入在线支付。具体步骤见[开通自己的第一份订阅](./guides/plans-and-orders#self-use)。这些现有功能不意味着首次使用必须搭建商业销售流程。

## 选择版本

本轮使用说明核对于 **2026-09-30**，以已发布的 [v0.0.2-rc.202609291405](https://github.com/zerodenet/zboard/releases/tag/v0.0.2-rc.202609291405) 为基线；当日 `main` 和 `develop` 均指向该版本提交。它是候选版（RC），不是正式稳定版。

[v0.0.1](https://github.com/zerodenet/zboard/releases/tag/v0.0.1) 是首个正式版本，不包含后续插件及新版管理入口。部署时选择明确的 [Release](https://github.com/zerodenet/zboard/releases)，让镜像、部署文件和说明对应同一版本；已有站点先读[升级与恢复](./guides/maintenance#upgrade)。面板版本与节点 Zero 版本分别管理，不要求版本号相同。

贡献者只需从[项目规范与贡献](./contributing/)开始。
