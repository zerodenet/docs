# 使用指南

ZBoard 的核心是基础面板。先完成安装和一条服务的配置，再按需要添加节点、订阅规则与插件。

## 第一次使用

1. [安装面板](./installation)：选择版本，填写数据库与密钥配置，启动 Docker 服务。
2. [初始化站点](./first-setup)：创建管理员并设置站点。
3. [接入节点](./node-management)：配置 SSH，安装 Zero 并检查节点状态。
4. [创建协议服务](./protocol-services)：设置协议和端口，等待配置发布成功。
5. [开通订阅](./plans-and-orders)：关联节点组、套餐与用户权益。
6. [连接客户端](./subscriptions-and-traffic)：获取对应格式的订阅并查看流量。

English installation instructions are available in [First installation](./installation-en).

## 按需配置

| 需求 | 指南 |
| --- | --- |
| 使用转发入口或共享代理池 | [网络前置](./network-fronting) |
| 调整订阅中的节点 | [订阅节点过滤](./subscription-filtering) |
| 安装扩展功能 | [插件市场](../plugins/marketplace) |
| 配置第三方登录 | [登录插件](../plugins/login) |
| 保存和恢复面板数据 | [存储与备份](./storage-and-backups) |
| 排查连接和发布错误 | [故障排查](./troubleshooting) |
| 清理节点 | [节点清理](./node-cleanup) |

日常管理还包括[控制台操作](./daily-operations)、[公告与邮件](./announcements-and-email)、[DNS 与证书](./dns-and-certificates)和[系统维护](./maintenance)。实现契约与开发流程集中在[开发参考](../reference/)中。
