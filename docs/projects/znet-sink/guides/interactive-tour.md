---
aside: false
title: 交互式客户端导览
description: 使用安全的假数据，在网页中体验 ZNet Sink 的连接、订阅、节点、规则、连接记录和诊断流程。
---

# 交互式客户端导览

ZNet Sink 的桌面界面基于 Tauri WebView。本页用网页组件复现主要工作区，并填充安全的演示数据；所有按钮都只改变当前页面状态，不会读取本机配置、调用内核或发起订阅请求。

<ClientTour />

## 从演示继续到真实客户端

1. 先在[客户端下载页](/download)选择与你的平台和架构匹配的安装包。
2. 按[安装与首次启动](./installation)准备 Zero 内核。
3. 参考[完成第一次连接](./first-connection)导入配置并开启系统代理或 TUN。
4. 遇到状态不一致时，再按[数据与诊断](./data-and-diagnostics)检查连接、日志和诊断结果。

演示中的域名来自 `example.com`、`example.net`、`example.org`，IP 使用文档保留网段，不对应真实订阅、节点或用户环境。
