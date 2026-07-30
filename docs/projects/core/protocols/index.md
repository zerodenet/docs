# 选择和配置协议

本节只回答如何在配置中使用协议。源码结构、Rust 类型和内部调度方式保留在 Core 仓库，不作为部署前置知识。

## 本地代理入口

| 需求 | 建议 |
|------|------|
| 一个端口同时给浏览器和系统工具使用 | Mixed |
| 标准 SOCKS5 客户端，包含 UDP ASSOCIATE | SOCKS5 |
| 只需要 HTTP CONNECT | HTTP |

第一次启动建议使用 Mixed，并只监听 `127.0.0.1`。示例见[启动第一个节点](/projects/core/guides/quickstart)。

## 远程代理节点

| 协议 | 常见用途 | 配置重点 |
|------|----------|----------|
| VLESS | TLS、REALITY、WebSocket、gRPC、H2/XHTTP 和 MUX/XUDP | UUID、传输组合、SNI/REALITY |
| VMess | 兼容现有 VMess 服务端和 MUX 场景 | UUID、cipher、TLS 与传输 |
| Trojan | TLS 外观的 TCP/UDP 代理 | password、证书/SNI |
| Shadowsocks | 轻量 AEAD/AEAD 2022 TCP/UDP | cipher、password/key material |
| Hysteria2 | QUIC 上的 TCP/UDP | password、证书、UDP 网络质量 |
| Mieru | Mieru 客户端/服务端互通 | username、password、端口 |
| SOCKS5 | 连接已有上游 SOCKS 服务 | server、port、可选认证 |

配置片段见[协议配置示例](./configuration)。每个二进制可以通过 Cargo feature 裁剪协议，部署前运行：

```bash
zero build-info
```

## 入站和出站不是一回事

- inbound 表示客户端如何连接当前 Zero；
- outbound 表示 Zero 如何连接目标或上游节点；
- 同一协议的入站和出站字段可能不同；
- 证书私钥通常只出现在服务端入站，客户端出站通常配置 SNI、CA 或 REALITY 公钥；
- `direct` 和 `block` 是内置出站语义，不是外部代理协议。

## 多凭证入站

VLESS、VMess、Trojan、Shadowsocks 和 Hysteria2 等入站可以声明多个协议凭证。外部系统提交完整 Zero 配置来增加、停用或替换凭证，Zero 在协议认证成功后把该凭证对应的运行身份用于流量、配额和会话控制。

配置教程优先使用协议本身的凭证字段，例如 VLESS/VMess 的 `id`、Trojan/Hysteria2 的 `password`。不要为了接入 Connector 再创建另一套用户协议；Connector 只投递事件。

## 确认支持范围

目录存在不代表当前二进制已经编译该协议，也不代表所有 TCP、UDP、MUX 和传输组合都具有相同成熟度。上线前同时检查：

- `zero build-info`
- [协议能力矩阵](/projects/core/reference/protocol-capabilities)
- 与目标服务端的实际互操作测试
