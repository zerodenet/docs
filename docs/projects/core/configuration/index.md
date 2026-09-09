# 配置参考

Zero 使用一个完整 JSON 文件描述入站、出站、路由、运行参数和可选管理能力。这里提供面向使用者的字段地图；具体协议字段请从[协议配置示例](/projects/core/protocols/configuration)开始。

## 顶层结构

```json
{
  "schema_version": 1,
  "inbounds": [],
  "outbounds": [
    {
      "tag": "direct",
      "protocol": { "type": "direct" }
    },
    {
      "tag": "block",
      "protocol": { "type": "block" }
    }
  ],
  "outbound_groups": [],
  "runtime": {},
  "api": {},
  "mode": { "type": "rule" },
  "route": {
    "rule_sets": [],
    "rules": [],
    "url_rewrite": [],
    "final": { "type": "direct" }
  }
}
```

| 字段 | 是否必需 | 用途 |
|------|----------|------|
| `schema_version` | 否 | 默认 `1`；只接受支持的版本，导出时显式携带 |
| `inbounds` | 否 | 默认 `[]`；监听地址与入站协议，TUN-only 或仅管理模式均可为空 |
| `outbounds` | 否 | 默认 `[]`；需要引用命名出站时定义 |
| `outbound_groups` | 否 | 手动选择、自动测速、故障切换、链式代理或负载均衡 |
| `mode` | 否 | `rule`、`direct` 或 `global`；默认 `rule` |
| `route` | 是 | 规则集、匹配规则、URL 改写与默认去向；明确指定 `final` |
| `runtime` | 否 | DNS、TUN、超时、事件日志、网络和状态持久化 |
| `api` | 否 | 控制接口、事件投递、outbox 和 hooks |

未知字段会被拒绝。修改后先运行：

```bash
zero validate config.json
```

## 入站与出站

每个入站和出站都必须有唯一 `tag`。其他配置通过 tag 引用它们：

```json
{
  "inbounds": [
    {
      "tag": "mixed-in",
      "listen": { "address": "127.0.0.1", "port": 7890 },
      "protocol": { "type": "mixed" }
    }
  ],
  "outbounds": [
    {
      "tag": "direct",
      "protocol": { "type": "direct" }
    }
  ],
  "route": { "final": { "type": "direct" } }
}
```

协议凭证写在对应协议的原生字段中，例如 VLESS/VMess 的 `id`、Trojan 的 `password`。Connector 不引入另一套用户或凭证模型。

| 公共参数 | 所在位置 | 默认 / 说明 |
| --- | --- | --- |
| `tag` | 入站、出站 | 必填，供路由与管理引用 |
| `listen.address`、`listen.port` | 入站 | 必填，监听地址与端口 |
| `protocol.type` | 入站、出站 | 必填，协议种类；其他字段按协议选择 |
| `udp.enabled` | 入站、出站 | `true`，还受全局 UDP 策略和协议能力约束 |
| `idle_timeout_secs` | 入站 | 可选 TCP 空闲超时，省略时内核使用 `300` 秒 |

协议内的服务器地址、认证、TLS 与传输示例见[协议配置](../protocols/configuration)。

## 模式与路由

先检查 `route.bypass` 直连例外；未命中时，`rule` 模式按顺序匹配 `route.rules`，最终回退到 `route.final`：

```json
{
  "mode": { "type": "rule" },
  "route": {
    "rules": [
      {
        "condition": {
          "type": "domain",
          "values": ["internal.example"]
        },
        "action": { "type": "direct" }
      }
    ],
    "final": {
      "type": "route",
      "outbound": "proxy"
    }
  }
}
```

`global` 模式需要指定出站或出站组：

```json
{
  "mode": {
    "type": "global",
    "outbound": "proxy"
  }
}
```

可用规则、规则集与 ZRS 语法见[规则能力参考](/projects/core/reference/zero-rule-ir-v1)。

| `route` 参数 | 默认 / 类型 | 说明 |
| --- | --- | --- |
| `final` | 必填 object | 未命中动作：`direct`、`reject` 或 `route`；`route` 需 `outbound` |
| `bypass` | `[]`，条件数组 | 命中即直连，优先于运行模式；复用规则条件，不带 `action` |
| `rules` | `[]` | 每条为 `condition` 与 `action`，顺序匹配 |
| `rule_sets` | `[]` | 共用规则资源，可供流量路由和适用的 DNS 分流引用 |
| `rule_sets[].tag` | 必填 string | 规则集标识 |
| `rule_sets[].type` | 必填 enum | `file` 或 `url` |
| `rule_sets[].path` | 必填 string | 本地文件或远程资源缓存路径 |
| `rule_sets[].url` | 可选 string | `type: "url"` 时必填 |
| `rule_sets[].format` | 必填 enum | `domain_list`、`cidr_list`、`zero_rule_ir`（别名 `zero_ir`）、`zrs` |
| `rule_sets[].update_interval_seconds` | `86400` | 远程更新间隔，秒 |
| `geoip_database` | 无 | 使用 `geoip` 条件时提供 GeoLite2 Country 文件 |
| `url_rewrite` | `[]` | 域名改写列表 |
| `url_rewrite[].from` / `from_regex` | 可选 string | 精确域名或正则匹配，按配置校验选择 |
| `url_rewrite[].to` | 必填 string | 目标域名；正则可使用 `$1` 等捕获 |
| `url_rewrite[].status_code` | 无 | 可选 HTTP 重定向状态码，只对适用的 HTTP 请求有意义 |

运行模式及各组的参数见[运行模式与出站组](./modes-and-groups)。

## runtime

多数部署可以先省略 `runtime`。常用项包括：

| 字段 | 类型 / 默认值 | 用途 |
|------|------|------|
| `event_log_capacity` | integer，`1024` | 内存事件重放容量 |
| `udp_upstream_idle_timeout_seconds` | integer，`30` | UDP 上游空闲超时，秒 |
| `latency_test_url` | string / null | 通用出站探测 URL；默认 `http://www.gstatic.com/generate_204` |
| `principal_quota_state_path` | string / null | 可选主体额度崩溃恢复快照路径 |
| `udp.enabled` | bool，`true` | 是否允许 UDP |
| `dns` | object / null | DNS 服务器、缓存、分流和 Fake-IP，详见 [DNS 参数](./dns) |
| `network.mtu` | integer，`1500` | TUN 与用户态网络栈 MTU；可由 TUN 局部值覆盖 |
| `tun` | object / null | 随代理生命周期启停的声明式 TUN 配置 |
| `log.level` | string，`info` | `trace`、`debug`、`info`、`warn`、`error` |
| `log.files` | array，`[]` | 文件输出，省略时输出到 stderr |
| `log.files[].path` | string，必填 | 日志路径 |
| `log.files[].level` | string / null | 单文件日志级别；省略时继承 `log.level` |
| `log.files[].max_bytes` | integer，`10485760` | 单文件轮转大小，字节 |
| `log.files[].max_files` | integer，`5` | 日志文件保留数量 |
| `log.rate_limit.max_per_second` | integer | 可选每秒日志上限，`0` 不限；省略 `rate_limit` 不限流 |

涉及路径的字段以主配置文件所在目录为基准。配置、证书、运行状态和日志建议分开存放。

### 声明式 TUN

配置中 `runtime.tun` 为对象时，Zero 会在代理运行期间管理 TUN；省略或为 `null` 时，仍可通过 `tun.start` / `tun.stop` 显式管理。以下是配置片段，完整启动示例见[运行 TUN 与 DNS](../guides/tun-and-dns)。启用 `dns_hijack` 前必须准备有效的 `runtime.dns`。

```json
{
  "runtime": {
    "network": {
      "mtu": 1500
    },
    "tun": {
      "addr": "10.66.0.1/24",
      "tag": "tun",
      "auto_route": true,
      "dual_stack": true,
      "strict_route": true,
      "dns_hijack": true
    }
  }
}
```

| 字段 | 默认值 | 说明 |
|------|--------|------|
| `name` | 系统默认 | 可选 TUN 接口名称 |
| `addr` | — | 主地址；必填 |
| `mask` | `255.255.255.0` | IPv4 掩码 |
| `secondary_addr` | 自动 | 双栈时另一地址族的 CIDR；省略时使用 Zero 的保留 TUN 地址 |
| `mtu` | `runtime.network.mtu` | TUN 局部 MTU 覆盖 |
| `tag` | `tun` | TUN 流量进入 Zero 后使用的 inbound tag |
| `auto_route` | `true` | 自动安装经过 TUN 的 split-default 路由 |
| `include_cidrs` | `[]` | 自动接管的目标 CIDR；空列表表示全量 |
| `exclude_cidrs` | `[]` | 从接管计划中扣除的目标 CIDR，沿用系统路由 |
| `dual_stack` | `true` | 同时准备 IPv4 与 IPv6 路由；明确单栈部署时才建议关闭 |
| `strict_route` | `true` | 自动路由安装失败时终止本次启动并回滚 |
| `dns_hijack` | `true` | 将 TUN 中的 TCP/UDP 53 端口流量交给 Zero DNS |

自动路由启用后，Zero 会跟踪物理默认出口变化并协调捕获路由。受管 TCP、UDP 与 QUIC 出站使用物理出口避免回环；是否具备某个地址族的实际出口，应查看 TUN 状态。双栈捕获不代表 IPv6 出口或 NAT64 已可用。

主地址可使用 IP 或 CIDR，第二地址必须是另一地址族的 CIDR；MTU 范围为 `576–65535`。单栈时不设置第二地址。接管/排除 CIDR 依赖 `auto_route: true`；使用 Fake-IP 时还需接管合成池地址。`strict_route` 除失败回滚外，还使用平台提供的路由/防漏策略；Windows 的严格路由允许 DHCP 客户端流量以支持地址续租。

Windows、Linux 和 macOS 的路由实现使用相同的生命周期语义，但创建 TUN、修改路由表仍需要对应平台权限。Windows 官方发布产物会携带运行 TUN 所需的 Wintun 组件；权限或驱动问题见[故障排查](/projects/core/guides/troubleshooting)。

## api

`api` 中的能力彼此独立：

- `control`：HTTP/IPC 控制面的监听与认证。
- `event_sinks`：零到多个事件投递目标；Webhook 地址是接收方提供的完整 URL。
- `outbox_path`、`dead_letter_path`、`dispatcher`：可靠投递日志、死信及重试/磁盘保护策略，详见[控制面参数](../control-plane/configuration)。
- `hooks`：事件触发的本地命令。

启用某个 Cargo feature 只代表二进制包含该能力；是否运行仍由配置决定。管理节点时使用 Zero API、IPC 或 gRPC；Connector 只投递事件，不是第二套管理 API。

## 安全修改配置

控制面提交的是完整候选配置，不是局部补丁：

```bash
zero validate candidate.json
zero reload candidate.json
zero status --json
```

成功表示候选配置已经完成运行时应用；应用失败会返回错误并尝试保留上一份可用状态。外部控制器应保存自己的完整 desired state，并避免多个写入方并发覆盖。

继续阅读：

- [配置基础](/projects/core/guides/configuration-basics)
- [安全热更新配置](/projects/core/guides/hot-reload)
- [运行模式与出站组](./modes-and-groups)
- [控制面配置合同](/projects/core/control-plane/configuration)
