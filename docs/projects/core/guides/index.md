# Zero Core 使用指南

按下面的顺序得到一个可用代理，再增加你需要的功能。只想使用桌面界面的用户，可回到[项目选择](/projects/)找到 ZNet Sink。

## 从零启动

1. [安装与构建](./installation)：下载、解压并运行二进制。
2. [启动第一个节点](./quickstart)：复制完整配置，验证本地代理请求。
3. [配置基础](./configuration-basics)：接入自己的远程节点并设置分流。

## 管理运行中的节点

- [运行与观测](./operations)：看连接、切节点、查日志、停止与重启。
- [运行模式与出站组](../configuration/modes-and-groups)：手动选择、自动测速、故障切换。
- [HTTP / Mixed 与 URLTest](./proxy-and-urltest)：应用代理设置和测速结果的含义。
- [运行 TUN 与 DNS](./tun-and-dns)：接管系统流量，验证 TCP、UDP 与 DNS。
- [DNS 与 Fake-IP](../configuration/dns)：指定解析服务、按域名分流。
- [安全热更新配置](./hot-reload)：先校验再应用，失败后确认旧状态。
- [故障排查](./troubleshooting)：按现象找到下一步检查。

## 接入外部程序

以下是可选的集成内容，不是运行代理的必要步骤：

- [使用控制 API](./control-api)与[控制接口安全](./control-security)
- [Connector Webhook](./connector-integration)：将节点事件投递给外部服务
- [GUI 接入](./gui-integration)：开发本地控制界面

需要查字段时进入[配置参考](../configuration/)，需要填写节点参数时进入[协议配置](../protocols/)。
