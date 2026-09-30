<span id="项目"></span>

# 我该用哪个项目？

先看你要完成什么。三个项目可以配合使用，也可以单独使用；安装客户端不需要同时部署面板或自己构建内核。

| 你现在的情况 | 选择 | 第一步 |
| --- | --- | --- |
| 已有订阅链接或代理配置，想在电脑上连接 | **ZNet Sink** 桌面客户端 | [安装客户端](/projects/znet-sink/guides/installation)，再[完成第一次连接](/projects/znet-sink/guides/first-connection) |
| 想直接用配置文件运行代理，或在服务器上搭建节点 | **Zero Core** 代理内核 | [安装内核](/projects/core/guides/installation)，再[运行本地代理](/projects/core/guides/quickstart) |
| 想把自己的节点统一管理，给自己或受邀用户分配订阅 | **ZBoard** 基础面板 | [部署面板](/projects/zboard/guides/installation)，再[完成初始化与首次交付](/projects/zboard/guides/first-setup) |

## 它们如何配合

- Zero Core 处理实际的代理连接、路由和 DNS
- ZNet Sink 提供桌面操作界面，管理本机配置和 Zero Core；安装包、客户端设置与内核能力需要分别确认
- ZBoard 管理用户、节点与订阅权限，把配置交给节点和客户端；额外的登录、支付等能力按需通过插件接入

例如，你可以用 ZBoard 管理服务器上的 Zero Core，再把订阅导入 ZNet Sink。只有一个已有订阅时，从 ZNet Sink 开始即可。

## 找不到说明中的功能？

先看[版本与使用限制](/progress)，确认自己使用的是正式版、候选版还是源码构建。再到对应项目的故障排查页检查当前版本、配置和权限；无需先阅读接口或开发文档。

<ProjectCatalog />
