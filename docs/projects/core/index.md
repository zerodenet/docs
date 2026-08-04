# Zero Core 使用手册

<ProjectMeta project-id="core" />

Zero Core 是可裁剪的网络代理内核。本手册从“把节点运行起来”开始，说明如何配置协议、管理运行中的节点、接入外部系统和处理故障。实现设计与仓库工程规则不属于这里的主线。

## 第一次使用

按顺序完成：

1. [安装与构建](./guides/installation)：准备 Rust、选择 feature 并得到 `zero` 可执行文件。
2. [启动第一个节点](./guides/quickstart)：使用一个可直接验证的本地 Mixed 入站配置启动 Zero。
3. [配置基础](./guides/configuration-basics)：加入代理出站、路由和运行参数。
4. [运行与观测](./guides/operations)：查看状态、流、策略、事件和日志。

## 我想完成……

| 目标 | 从这里开始 |
|------|------------|
| 增加或修改 VLESS、VMess、Trojan 等节点 | [协议配置](./protocols/) |
| 使用 HTTP/Mixed 本地代理、QUIC 域名或 URLTest | [代理入口与 URLTest](./guides/proxy-and-urltest) |
| 不重启进程地更新凭证、监听器或路由 | [安全热更新配置](./guides/hot-reload) |
| 用脚本或服务管理 Zero | [使用控制 API](./guides/control-api) |
| 跨主机安全访问 HTTP/gRPC | [保护控制接口](./guides/control-security) |
| 让节点主动把事件送到控制端 | [Connector Webhook 接入](./guides/connector-integration) |
| 开发本地 GUI | [GUI 接入](./guides/gui-integration) |
| 启动失败、配置不生效或事件积压 | [故障排查](./guides/troubleshooting) |

## 接口怎么选

| 场景 | 推荐入口 |
|------|----------|
| 同机人工操作 | CLI，通过本地 IPC 自动连接 |
| 同机 GUI | IPC 查询、命令与事件订阅 |
| 运维脚本或控制服务 | HTTP JSON API |
| 强类型服务端集成 | 可选 gRPC |
| 节点主动上报事件 | 可选 Connector Webhook |

HTTP、IPC 和 gRPC 调用的是同一组 Zero 查询与命令。Connector 只负责事件投递，不是另一套节点管理 API。

## 查字段和协议

- [完整配置字段](./configuration/)
- [构建特性](./configuration/features)
- [CLI 命令](./control-plane/cli)
- [HTTP API](./control-plane/http-api)
- [事件目录](./control-plane/events)
- [协议能力矩阵](./reference/protocol-capabilities)
