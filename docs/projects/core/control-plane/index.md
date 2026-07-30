# 控制接口总览

Zero 的 HTTP、gRPC、IPC 和 CLI 共享同一套查询与命令语义。Connector 是独立的事件投递通道，不参与外部系统对节点的管理请求。

## 选择入口

| 场景 | 推荐入口 | 主要用途 |
|------|----------|----------|
| 同机 GUI、守护程序 | IPC | 查询、命令、订阅事件 |
| 浏览器或简单外部控制器 | HTTP | JSON API、SSE |
| 跨主机强类型客户端 | gRPC | 查询、命令、流式事件 |
| 人工运维 | CLI | 校验、状态、切换、热更新 |
| 节点主动通知外部系统 | Connector | 可靠投递 `zero.event.v1` |

HTTP、IPC 和 gRPC 都是管理通道。Connector 只把事件投递到注册方提供的完整 URL，不规定接收端路径、认证方式或业务工作流。

## 推荐接入顺序

1. 查询 `health`，确认节点在线。
2. 查询 `capabilities`，识别当前发行物编译的能力。
3. 查询 `config`、`runtime` 和 `stats`，建立初始视图。
4. 订阅事件，按快照和 revision 合并增量状态。
5. 修改配置时先执行 `config.validate`，确认后再执行 `config.apply`。

`config` 查询返回运行配置摘要，不是完整配置文件。外部控制器必须维护自己的完整 desired state。

## 文档入口

| 任务 | 文档 |
|------|------|
| 使用 HTTP 查询和命令 | [HTTP API](./http-api) |
| 使用本地 socket/pipe | [IPC 协议](./ipc-protocol) |
| 使用命令行 | [CLI 命令](./cli) |
| 配置控制接口和认证 | [控制面配置](./configuration) |
| 处理事件 | [事件目录](./events) |
| 注册 Webhook | [Connector 投递合同](./connector) |
| 实现 GUI | [GUI 接入指南](/projects/core/guides/gui-integration) |
| 处理版本差异 | [破坏性变更](./breaking-changes) |

## 安全边界

- 本地 IPC 依赖操作系统文件或管道权限。
- HTTP 跨主机部署应由可信隧道或外部 TLS 终止保护。
- gRPC 可以配置原生 TLS/mTLS，也可以位于外部 TLS 终止之后。
- Bearer token 用于认证，不能代替传输加密。
- `api.control` 的监听地址或认证不能通过承载它的 `config.apply` 在线自替换。

详细部署方式见[保护控制接口](/projects/core/guides/control-security)。
