# 能力与端口速查

本页用于部署前快速核对。实际能力始终以运行中的 `zero build-info` 和 `/api/v1/capabilities` 为准。

## 构建能力

| 能力 | 默认构建 | Feature |
|------|----------|---------|
| 主流代理协议与 DNS | 是 | `full` |
| HTTP 控制接口 | 是 | `status-api` |
| 本地 IPC 与 CLI | 是 | 内置 |
| Connector Webhook | 否 | `connector` |
| 本地 JSONL sink | 否 | `sink-jsonl` |
| gRPC 控制接口 | 否 | `grpc-api` |

`connector`、`grpc-api` 和 `status-api` 相互独立，按部署需要选择。

## 常用监听

| 用途 | 地址或端口 | 说明 |
|------|------------|------|
| Mixed 本地代理 | 示例使用 `127.0.0.1:7890` | 由 inbound 配置决定 |
| HTTP 控制接口 | 示例使用 `127.0.0.1:9090` | 由 `api.control.listen` 或 `--status-listen` 决定 |
| gRPC 控制接口 | HTTP 控制端口 + 1 | 需要 `grpc-api` |
| Unix IPC | `~/.zero/control.sock` | 可用 `--control-socket` 覆盖 |
| Windows IPC | `\\.\pipe\zero-control` | Named Pipe |

这些是文档示例，不是必须占用的固定端口。

## 常用命令

```bash
zero build-info
zero validate config.json
zero run config.json
zero status --json
zero flows
zero events
zero reload candidate.json
zero connector state --json config.json
```

完整说明见[CLI 命令](/projects/core/control-plane/cli)。

## 配置与运行参考

- [配置字段](/projects/core/configuration/)
- [协议配置](/projects/core/protocols/)
- [协议能力矩阵](./protocol-capabilities)
- [HTTP API](/projects/core/control-plane/http-api)
- [Connector 投递合同](/projects/core/control-plane/connector)
