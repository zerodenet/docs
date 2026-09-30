# 使用指南

第一次使用的目标是：在自己的客户端里连通一条由 ZBoard 管理的线路。一个面板、一台节点服务器、一个协议和一份订阅就可以开始。

## 第一次使用

1. [安装面板](./installation)：选择明确版本，准备数据库和持久目录，启动服务。
2. [初始化站点](./first-setup)：创建管理员；只做自用时可以关闭公开注册。
3. [接入节点](./node-management)：添加服务器，验证 SSH，安装 Zero。
4. [配置协议](./protocol-services)：填写对外地址、监听端口和协议，检查发布结果。
5. [分配第一份订阅](./plans-and-orders#self-use)：把线路加入权限组，通过零金额分配为自己开通访问。
6. [导入客户端](./subscriptions-and-traffic)：复制对应格式的订阅链接，实际连接并核对用量。

目前开通订阅仍使用商品、规格和订单记录。指南会说明如何用这套已有流程完成自用分配；无需先设置收款渠道、邮件营销或公开销售页面。

## 按需配置

| 下一步想做什么 | 指南 |
| --- | --- |
| 分享给其他人，分别管理用量与访问 | [日常使用与分享](./daily-operations) |
| 使用外部转发地址或面板托管转发 | [网络前置](./network-fronting) |
| 使用上游订阅维护共享代理池 | [共享代理池](./network-fronting#可选代理路径) |
| 调整订阅里的线路、规则和本地端口 | [订阅配置](./subscriptions-and-traffic) · [节点过滤](./subscription-filtering) |
| 增加第三方登录等功能 | [插件市场](../plugins/marketplace) · [登录插件](../plugins/login) |
| 管理域名、证书、公告和注册邮件 | [DNS 与证书](./dns-and-certificates) · [公告与邮件](./announcements-and-email) |
| 备份、升级或更换数据库 | [存储与备份](./storage-and-backups) · [系统维护](./maintenance) |
| 无法导入、无法连接或发布失败 | [故障排查](./troubleshooting) |
| 停用并清理一台节点 | [节点清理](./node-cleanup) |

菜单名称按[当前文档基线](../#选择版本)说明；旧版本或自定义过菜单的站点可能不同。排查具体兼容性时再读[运行参考](../reference/)，无需先了解内部架构。
