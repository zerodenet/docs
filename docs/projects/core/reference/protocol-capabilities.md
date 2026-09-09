# 协议能力与限制

不同发行物可以裁剪 Cargo features，因此源码中存在某个协议，不代表当前二进制一定包含它。部署和 GUI 接入应以节点返回的 `capabilities` 为准。

## 先查询实际能力

命令行：

```bash
zero build-info
```

HTTP：

```bash
curl http://127.0.0.1:9090/api/v1/capabilities
```

IPC：

```json
{"type":"query","id":1,"request":{"capabilities":{}}}
```

外部消费者应先检查 `compiled`，再分别检查入站/出站、TCP/UDP、MUX、传输和 `limitations`。不要只根据顶层 `status` 做单一布尔判断。

## 状态含义

| 值 | 含义 |
|----|------|
| `supported` | 正常支持，未记录协议级缺口 |
| `partial` | 基线路径可用，但某些方向、传输或外部互操作覆盖仍有限 |
| `experimental` | 可以试用，不应默认视为生产能力 |
| `unsupported` | 当前方向或能力未实现 |
| `not_applicable` | 协议本身不定义该方向 |

`partial` 不等于整个协议不可用。应继续读取方向字段和 `limitations`，并验证实际采用的传输组合。

## 当前能力摘要

下表用于快速选择，最终以当前节点的机器可读响应为准：

| 协议 | 总体状态 | 入站 TCP | 入站 UDP | 出站 TCP | 出站 UDP | MUX |
|------|----------|----------|----------|----------|----------|-----|
| `direct` | `supported` | 支持 | 支持（需 UDP 构建能力） | 支持 | 支持 | 不适用 |
| `block` | `supported` | 不支持 | 不支持 | 支持 | 支持 | 不适用 |
| `socks5` | `supported` | 支持 | 支持 | 支持 | 支持 | 不适用 |
| `http` | `supported` | 支持 | 不适用 | 不支持 | 不适用 | 不适用 |
| `mixed` | `supported` | 支持 | 支持 | 不支持 | 不支持 | 不适用 |
| `vless` | `partial` | 支持 | 部分 | 支持 | 部分 | 部分 |
| `hysteria2` | `partial` | 支持 | 部分 | 支持 | 部分 | 不支持 |
| `shadowsocks` | `partial` | 支持 | 支持 | 支持 | 支持 | 不支持 |
| `trojan` | `partial` | 支持 | 部分 | 支持 | 部分 | 不支持 |
| `vmess` | `partial` | 部分 | 部分 | 部分 | 部分 | 部分 |
| `mieru` | `supported` | 支持 | 支持 | 支持 | 支持 | 不支持 |

## VLESS 组合边界

VLESS 顶层保持 `partial`，因为不同 flow、传输、MUX 和 UDP 路径的成熟度不同。当前开发线中需要特别区分：

| 组合 | 当前结论 |
|------|----------|
| 普通 VLESS TCP + TLS/REALITY | 可用；仍需检查所选传输和发行物 capability |
| REALITY + `xtls-rprx-vision` + TCP 出站 | 已按 Xray Vision 线协议实现并完成真实进程互操作验证 |
| `xtls-rprx-vision` + `mux_concurrency` | 不支持，配置必须拆分 |
| `xtls-rprx-vision` + UDP | 不支持，会明确拒绝 |
| `zero-aead-v1` | Zero 私有兼容 flow，不是 Xray Vision |
| `xtls-rprx-vision-udp443` | 已废弃并拒绝，不再作为别名猜测 |
| Mux.Cool TCP / XUDP | 分别由 `mux_concurrency` / `xudp_concurrency` 启用，不依赖 Vision flow |
| XHTTP `stream-one` | 支持单条 H2/H2C 双向流；部署前仍需验证对端版本和链路组合 |

REALITY 客户端的 `client_fingerprint` 支持 `chrome`、`firefox`、`safari`、`edge`，默认 `chrome`。它只改变 REALITY 客户端 ClientHello；普通 TLS 和 REALITY 入站不读取该字段。

不要把“某一条真实互操作路径通过”扩大解释为所有传输、UDP、MUX 和中继组合都已具备相同成熟度。配置示例见[协议配置示例](/projects/core/protocols/configuration)。

## 部署时如何判断

对于每个节点配置：

1. 确认协议 `compiled: true`。
2. 确认使用方向的 capability 不是 `unsupported`。
3. 检查所选 transport 是否出现在 `transports`。
4. 使用 MUX 或 UDP 时检查对应字段。
5. 展示并记录 `limitations`，不要在 GUI 中丢弃。
6. 对实际客户端/服务端版本和传输组合做互操作测试。

例如，VLESS 顶层为 `partial`，但并不妨碍使用已支持的 TCP/TLS 路径；它表示不能把某条已验证路径推广为所有 UDP、MUX 和传输组合都已具备相同成熟度。

## GUI 与控制器建议

- 对 `compiled: false` 的协议隐藏或禁用配置入口。
- 对 `partial` 和 `experimental` 显示明确提示，不自动拒绝整个协议。
- 保留未知字段和未知 limitation code，以兼容更新后的内核。
- 保存用户选择前使用 `config.validate` 再做最终确认。
- 发行物升级后重新查询，不缓存上一个版本的能力矩阵。

配置格式见[协议配置示例](/projects/core/protocols/configuration)，构建裁剪见[构建特性](/projects/core/configuration/features)。
