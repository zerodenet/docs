# Zero Core

<ProjectMeta project-id="core" />

::: info 文档对应版本
本轮使用说明按 2026-09-03 的 [develop 提交 6d0553d](https://github.com/zerodenet/core/tree/6d0553d743ecd074379126e574d9263157486f7a)核对。develop 包含尚未进入稳定版的功能；安装旧版时，以实际版本和可用能力为准。
:::

Zero Core 是可裁剪的网络代理内核，可作为本地网关、边缘节点或服务器运行，并提供 CLI、HTTP、IPC 等控制接口。

## 第一次使用

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

HTTP、IPC 和 gRPC 调用的是同一组 Zero 查询与命令。Connector 负责事件投递。

## 查字段和协议

- [完整配置字段](./configuration/)
- [构建特性](./configuration/features)
- [CLI 命令](./control-plane/cli)
- [HTTP API](./control-plane/http-api)
- [事件目录](./control-plane/events)
- [协议能力矩阵](./reference/protocol-capabilities)

## DNS 与透明代理

先按 [TUN 与 DNS 使用指南](./guides/tun-and-dns)完成启动和验证，再查阅 [DNS 参数](./configuration/dns)、[运行与 TUN 参数](./configuration/)及 [CLI 参数](./control-plane/cli)。
