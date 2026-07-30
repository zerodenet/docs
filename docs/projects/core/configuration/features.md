# 构建特性

Cargo features 决定二进制包含哪些能力。配置引用未编译的协议时，Zero 会在启动前明确报错。

## 默认构建

```bash
cargo build --release
```

默认等价于 `full + status-api`：

- `full`：SOCKS5、HTTP、Mixed、VLESS、Hysteria2、Shadowsocks、Trojan、VMess、Mieru 和 DNS。
- `status-api`：运行状态与控制端点。

Connector 和 gRPC 不在默认集合中。

## 按需裁剪

```bash
cargo build --release --no-default-features \
  --features socks5,http,status-api
```

可单独选择的协议能力：

| Feature | 包含能力 |
|---------|----------|
| `socks5` | SOCKS5 |
| `http` | HTTP CONNECT |
| `mixed` | Mixed 入站 |
| `vless` | VLESS |
| `hysteria2` | Hysteria2 |
| `shadowsocks` | Shadowsocks |
| `trojan` | Trojan |
| `vmess` | VMess |
| `mieru` | Mieru |
| `dns` | DNS、缓存、路由与 Fake IP |

协议的具体入站、出站、TCP、UDP、MUX 和传输支持范围，以运行时能力矩阵为准，见[协议能力与限制](/projects/core/reference/protocol-capabilities)。

## 管理与事件能力

| Feature | 用途 | 隐含依赖 |
|---------|------|----------|
| `status-api` | HTTP/IPC 状态与控制 | 无 |
| `grpc-api` | gRPC 控制面 | `zero-grpc` |
| `event-dispatcher` | 通用事件分发 | `zero-connector` |
| `sink-jsonl` | JSONL 本地事件 sink | `event-dispatcher` |
| `connector` | Webhook 事件投递 | `event-dispatcher` |

这些能力相互独立：

- `connector` 不会自动启用 `status-api` 或 `grpc-api`。
- `status-api` 和 `grpc-api` 用于管理节点。
- `connector` 按 `api.event_sinks` 投递 `zero.event.v1` 事件，不提供配置、用户或面板工作流。

需要 API 管理和 Webhook 投递的节点可以构建：

```bash
cargo build --release \
  --features full,status-api,grpc-api,connector
```

如果只需要 HTTP/IPC 管理，不必启用 `grpc-api`；如果不需要节点主动投递事件，也不必启用 `connector`。

## 确认当前二进制

不同发行物可能采用不同 feature 组合。部署前运行：

```bash
zero build-info
```

再使用实际配置执行：

```bash
zero validate config.json
```

不要只根据源码中存在某个协议判断发行物一定包含它。
