# 技术参数总览

本页提供 Zero Core 技术能力的索引和当前默认参数。精确到具体构建时，应同时查询运行时 `capabilities`，因为 Cargo features 可以裁剪协议和控制面能力。

## 能力基线

| 维度 | 当前边界 |
| --- | --- |
| 实现语言 | Rust |
| 运行形态 | 本地网关、边缘节点或服务端 |
| 配置 | 入站、出站、路由、DNS、运行时与控制面配置 |
| 默认构建预设 | `full + status_api` |
| 控制方式 | HTTP JSON、gRPC、Unix Domain Socket / Windows Named Pipe、CLI |
| 能力发现 | `capabilities` 查询与 `capabilities.protocols` 协议矩阵 |

构建预设、feature 依赖和裁剪方式见[构建特性](../configuration/features)。完整字段见[配置参考](../configuration/)。

## 协议范围

当前文档覆盖 SOCKS5、HTTP CONNECT、Mixed、VLESS、Hysteria2、Shadowsocks、Trojan、Mieru 和 VMess。`direct`、`block`、DNS 与 TUN 等能力具有各自的构建和运行边界。

协议目录存在不等于当前二进制已经启用，也不等于所有外部实现都已完成互操作验证。核对具体 TCP、UDP、MUX、传输方式和限制时，以[协议能力矩阵](./protocol-capabilities)和运行时能力响应为准。

## 控制接口

| 接口 | 默认端点或路径 | 主要用途 |
| --- | --- | --- |
| HTTP JSON | `127.0.0.1:9090` | 查询、命令、SSE 事件与远程调试 |
| gRPC | `127.0.0.1:9091` | SDK 或服务端集成 |
| 本地 IPC | `~/.zero/control.sock` / `\\.\pipe\zero-control` | 本地 GUI、CLI 与实时事件 |
| CLI | 自动发现本地 IPC | 状态、流、策略切换和事件查看 |

接口是否可用取决于构建特性和运行配置。字段、信封、权限与错误语义见[控制面契约](../control-plane/contract)，通道差异见[控制与集成](../control-plane/)。

## 运行时默认参数

| 参数 | 默认值或行为 |
| --- | --- |
| TCP 中继空闲超时 | 300 秒，可按入站配置 |
| 出站失败观察窗口 | 30 秒 |
| 出站失败阈值 | 窗口内 5 次失败 |
| 出站隔离时间 | 60 秒 |

这些值描述当前公开文档中的默认行为。部署时应以实际配置、当前构建和运行时状态为准。

## 继续阅读

- [协议概览](../protocols/)
- [配置参考](../configuration/)
- [总体架构](../architecture/)
- [控制面兼容性与破坏性变更](../control-plane/breaking-changes)
