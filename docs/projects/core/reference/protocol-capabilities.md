# 协议能力与限制

先确定对端使用的协议、方向和传输，再检查你手中的 Zero 是否支持。源码中存在某个协议，不代表当前二进制已经编译它；`supported` 也不代表所有第三方版本和部署环境都已通过验收。

## 先查询实际能力

不必启动代理即可查询：

```bash
zero build-info
```

在 `protocol_capabilities` 中检查 `compiled`、入站/出站 TCP/UDP、`mux`、`transports` 和 `limitations`。如果要集成控制端，运行中的节点也提供同一类信息：

```bash
curl -H "Authorization: Bearer $ZERO_API_KEY" \
  http://127.0.0.1:9090/api/v1/capabilities
```

该命令要求已按[控制 API 指南](../guides/control-api)启用 HTTP。IPC 查询形式为：

```json
{"type":"query","id":1,"request":{"capabilities":{}}}
```

## 状态含义

| 值 | 含义 |
|----|------|
| `supported` | 当前构建声明的能力已实现，仍需核对具体组合与对端 |
| `partial` | 有可用路径，同时保留明确限制 |
| `experimental` | 试验能力，不默认按生产可用处理 |
| `unsupported` | 当前方向或能力未实现 |
| `not_applicable` | 不适用于该协议 |

不要把顶层状态当作一个开关。一个协议可能没有出站方向，或只有部分传输适合所需的 UDP/中继路径。

## 当前能力摘要

下表帮助你选择协议方向。实际是否可用还取决于二进制的编译选项；以 `build-info` 的响应为准。WireGuard 需要专门的实验构建，范围见下方说明。

| 协议 | 总体状态 | 入站 TCP | 入站 UDP | 出站 TCP | 出站 UDP | MUX |
|------|----------|----------|----------|----------|----------|-----|
| `direct` | `supported` | 支持 | 支持（需 UDP 构建能力） | 支持 | 支持 | 不适用 |
| `block` | `supported` | 不支持 | 不支持 | 支持 | 支持 | 不适用 |
| `socks5` | `supported` | 支持 | 支持 | 支持 | 支持 | 不适用 |
| `http` | `supported` | 支持 | 不适用 | 不支持 | 不适用 | 不适用 |
| `mixed` | `supported` | 支持 | 支持 | 不支持 | 不支持 | 不适用 |
| `vless` | `supported` | 支持 | 支持 | 支持 | 支持 | 支持 |
| `hysteria2` | `supported` | 支持 | 支持 | 支持 | 支持 | 不支持 |
| `shadowsocks` | `supported` | 支持 | 支持 | 支持 | 支持 | 不支持 |
| `trojan` | `supported` | 支持 | 支持 | 支持 | 支持 | 支持 |
| `vmess` | `supported` | 支持 | 支持 | 支持 | 支持 | 支持 |
| `mieru` | `partial` | 支持 | 支持 | 支持 | 支持 | 支持 |
| `wireguard`（实验构建） | `experimental` | 实验 | 实验 | 实验 | 实验 | 不适用 |

Mieru 的 UDP 载体中继需要支持数据报的承载，长时间运行与恢复仍有验收限制。VLESS 独立 QUIC 传输保留上游已弃用的限制提示。MUX 一栏表示协议导出的逻辑复用能力，不等于把 QUIC 自带多流功能再配置成 `mux_concurrency`。

## VLESS 组合边界

选择 VLESS 传输与 flow 时，按以下边界配置：

| 组合 | 使用边界 |
|------|----------|
| 普通 TCP + TLS/REALITY | 按对端填写认证、服务名和证书参数 |
| `xtls-rprx-vision` | 支持提供直通切换能力的原始 TLS 1.3、REALITY 或 VLESS Encryption 承载；TLS 1.2 不提供该能力 |
| Vision + `mux_concurrency` | 不支持普通 MUX TCP；不要同时启用 |
| Vision UDP | 通过 XUDP；标准 Vision 默认拒绝 UDP/443 |
| `xtls-rprx-vision-udp443` | 出站允许 UDP/443 的策略值，线上仍使用标准 Vision flow |
| `zero-aead-v1` | Zero 私有迁移格式，不能用于 Xray Vision 对端 |
| XHTTP | 包含多种模式与 HTTP 载体；两端的模式、路径和 TLS 设置必须匹配 |

REALITY 的示例使用 `client_fingerprint: "chrome"`。当前实现还提供版本化指纹等选项；升级时不要假定短名称永远对应同一个浏览器版本。指纹不改变证书校验要求，也不保证流量不可识别。

字段示例见[协议配置](../protocols/configuration)。

## WireGuard 与 ICMP

WireGuard 需要显式启用 `wireguard` feature，仍为实验能力，不在默认 `full` 中。它提供 UDP 端点、认证 peer、原始 IP 转发，以及供普通代理入站使用的 TCP/UDP 转换。

::: warning 发行物兼容性
已发布的 [v0.0.3-dev.202609281319](https://github.com/zerodenet/core/releases/tag/v0.0.3-dev.202609281319) 包含这项实验能力；`v0.0.1` 和 `v0.0.2-rc.202609290540` 不包含 WireGuard。其他构建请先检查 `compiled`，不要仅凭配置格式相同就启用。
:::

部署前仍需注意：

- 对端的 `allowed_ips`、地址族、密钥、MTU 和回程路由必须匹配
- WireGuard 入站的 peer 身份不自动映射成 Zero 主体/用户策略
- 外层 UDP 代理需要双向 packet-path 或由具体成员组成的 relay，不能任意套用动态组
- 安全审计、真实 TUN、多 peer 故障和持续运行验收不能由一次握手成功代替

ICMP 不能经任意 TCP/UDP 代理转发。原始 Packet 路径可以保留 ICMP；`direct` Echo 使用宿主 raw/ping socket，需要对应系统权限。`translate` 的 Echo 地址转换是受限路径，不等于通用 NAT 或任意 ICMP 支持。普通代理请求成功或 `ping` 失败都不能单独证明另一种流量路径的状态。

启用前检查实际节点的 WireGuard capability 和限制，并验证所需的流量路径。

## 部署时如何判断

1. 确认协议 `compiled: true`。
2. 检查使用方向的 TCP/UDP capability。
3. 核对所选 transport、MUX、UDP 和 relay 组合。
4. 运行 `zero validate config.json`。
5. 用实际客户端/服务端版本验证目标请求、UDP 和断开后的新连接。

`validate` 检查配置，不会替你连接远程服务器或证明生产网络可用。

## GUI 与控制器建议

- 对未编译能力禁用配置入口
- 对 `partial` 和 `experimental` 显示限制，不丢弃 limitation code
- 兼容未知可选字段，升级内核后重新查询能力
- 写入前执行 `config.validate`，不要只比较产品版本号

构建裁剪见[构建特性](../configuration/features)，接口契约见[控制接口参考](../control-plane/)。
