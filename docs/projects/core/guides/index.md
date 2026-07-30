# Zero Core 使用指南

这里按实际操作顺序组织文档，不要求先理解 Zero 的内部模块。

## 从零启动

1. [安装与构建](./installation)
2. [启动第一个节点](./quickstart)
3. [配置基础](./configuration-basics)

## 管理运行中的节点

- [运行与观测](./operations)：状态、流、策略、事件、日志和 Connector 积压。
- [安全热更新配置](./hot-reload)：校验、应用、确认和失败回滚。
- [使用控制 API](./control-api)：HTTP、IPC、CLI 和 gRPC 的选择与调用。
- [保护控制接口](./control-security)：Bearer、TLS、mTLS 和远程访问边界。
- [故障排查](./troubleshooting)：从错误信息定位配置、监听、控制面和投递问题。

## 接入外部程序

- [Connector Webhook](./connector-integration)：注册完整接收地址，处理事件、ACK、重试和 outbox。
- [GUI 接入](./gui-integration)：通过 IPC 或 HTTP 构建本地控制端。

需要查字段时进入[配置参考](/projects/core/configuration/)，需要查某个代理协议时进入[协议配置](/projects/core/protocols/)。
