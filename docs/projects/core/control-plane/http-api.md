# HTTP JSON API

通过 HTTP 查询运行状态、执行控制命令和订阅 SSE 事件。接入时先查询 `capabilities`，确认实际可用的功能与限制。

## 基础信息

- 稳定前缀：`/api/v1/`
- 认证：`Authorization: Bearer <token>` 或 `X-Zero-Api-Key: <token>`；通过 `api.control` 启用时必须配置凭证。CLI `--status-listen` 是无认证调试入口，必须只绑定 loopback，不能暴露到不可信网络
- CORS：所有端点返回 `Access-Control-Allow-Origin: *`
- 限流：Query 100/s，Command 10/s，SSE 新建请求 5/s（并非同时在线连接数上限）

## 通用响应格式

HTTP 和 IPC 共享相同的响应信封格式（定义在 `zero_api::ApiResponse`）。`api_id` 字段始终存在，用于协议标识。

成功：
```json
{
  "api_id": "zero.api.v1",
  "ok": true,
  "result": { }
}
```

失败：
```json
{
  "api_id": "zero.api.v1",
  "ok": false,
  "error": {
    "code": "not_found",
    "message": "Policy not found",
    "field_path": "policy_tag"
  }
}
```

配置校验失败时附带字段级诊断：
```json
{
  "api_id": "zero.api.v1",
  "ok": false,
  "error": {
    "code": "invalid_argument",
    "message": "config validation failed",
    "details": [
      { "field_path": "inbounds[0]", "message": "`inbounds[0] `socks-in`: password must not be empty" }
    ]
  }
}
```

| 字段 | 类型 | 说明 |
|------|------|------|
| `api_id` | string | 协议标识，始终为 `"zero.api.v1"` |
| `id` | string \| number | IPC 请求关联 ID；HTTP 适配器不回显请求中的 `id`，响应省略此字段 |
| `ok` | bool | 成功标志 |
| `result` | JSON value | 成功时的响应数据；可以是对象、数组或其他 JSON 值，失败时省略 |
| `error.code` | string | 机器可读错误码（snake_case） |
| `error.message` | string | 人类可读错误信息 |
| `error.field_path` | string? | 参数校验错误时的字段路径 |
| `error.details` | array? | 结构化、字段级诊断；每项 `{field_path?, message}`。配置校验错误时填充，含如 `inbounds[0]`、`runtime.udp_upstream_idle_timeout_seconds` 等字段路径。非校验错误省略此字段 |

HTTP/IPC 错误信封不包含内部 `ApiError.cause`；配置字段诊断读取 `error.details`。认证失败、限流、未知路径等 HTTP 传输层错误可能只返回 `{"error":"..."}`，先检查 HTTP 状态，再检查存在时的 `ok`。

> **HTTP 和 IPC 的 Query `result` 格式不同**：HTTP 的 `result` 直接包含端点数据（如 `{engine_build_id:"build-id",...}`）。IPC 的 `result` 包含一个变体名 key 包裹（如 `{"health":{engine_build_id:"build-id",...}}`）。详见 [ipc-protocol.md](/projects/core/control-plane/ipc-protocol)。

以下是命令错误的 HTTP 状态映射。Query 查询错误（例如不存在的 flow 或 policy）仍可能返回 HTTP `200`，但信封为 `ok: false`；客户端必须检查 `ok` 和 `error.code`，不能只靠状态码判断成功。

错误码（snake_case）：

| code | HTTP | 说明 |
|------|------|------|
| `not_found` | 404 | 资源不存在 |
| `invalid_argument` | 400 | 参数无效 |
| `permission_denied` | 403 | 权限不足 |
| `insufficient_os_privilege` | 403 | 操作系统权限不足，例如创建 TUN 或修改路由 |
| `feature_disabled` | 501 | 功能未编译 |
| `conflict` | 409 | 状态冲突 |
| `unsupported` | 501 | 不支持的操作 |
| `internal` | 500 | 内部错误 |

---

## Query 端点

以下 JSON 示例仅展示成功响应的 `response.result`，外层仍有 `api_id` 和 `ok`；较大的快照示例省略部分字段。

### GET /api/v1/capabilities

API 能力列表。响应包含独立版本范围 `contracts`、稳定 `error_codes` 和 `global_limitations`。按[通用契约](./contract#v1-契约版本)匹配版本与功能，不能仅凭构建版本推断能力；下例只展示部分字段。

```json
{
  "api_id": "zero.api.v1",
  "schema_id": "zero.event.v1",
  "adapters": [{ "kind": "in_process", "enabled": true }],
  "sinks": [{ "kind": "none", "enabled": false }],
  "features": ["query", "config_snapshot", "runtime_snapshot", "flow_snapshot", "policy_snapshot"],
  "protocols": [
    {
      "protocol": "socks5",
      "feature": "socks5",
      "compiled": true,
      "status": "supported",
      "compatibility_baseline": "rfc_1928_rfc_1929",
      "inbound": {
        "tcp": { "supported": true, "level": "supported", "notes": [] },
        "udp": { "supported": true, "level": "supported", "notes": [] }
      },
      "outbound": {
        "tcp": { "supported": true, "level": "supported", "notes": [] },
        "udp": { "supported": true, "level": "supported", "notes": [] }
      },
      "transports": ["tcp"],
      "mux": { "supported": false, "level": "not_applicable", "notes": [] },
      "limitations": []
    }
  ],
  "build_features": ["status-api", "socks5", "http", "mixed", "vless"],
  "permissions": ["read"]
}
```

`protocols` 按当前二进制编译的协议提供机器可读能力矩阵，供 GUI 和外部控制器判断可用功能与限制。TCP/UDP 能力模型和限制码详见[协议能力参考](/projects/core/reference/protocol-capabilities)。

### GET /api/v1/health

进程健康状态。

```json
{
  "engine_build_id": "build-id",
  "core_instance_id": "instance-id",
  "config_revision": 1,
  "started_at_unix_ms": 1713500000000,
  "healthy": true
}
```

### GET /api/v1/config

当前配置摘要，不是可直接提交给 `config.apply` 的完整配置；不返回凭证、完整路由或协议配置。控制器应保存自己的完整配置文件。所有类型定义在 `zero-api::snapshot` 模块，外部消费者可直接依赖 `zero-api` crate。

```json
{
  "config_revision": 1,
  "mode": { "kind": "rule" },
  "rule_count": 5,
  "listeners": [
    { "tag": "socks-in", "protocol": "socks5", "listen_address": "0.0.0.0", "listen_port": 1080 }
  ],
  "outbounds": [
    { "tag": "direct", "protocol": "direct", "server": null, "port": null },
    { "tag": "proxy", "protocol": "vless", "server": "1.2.3.4", "port": 443 }
  ],
  "outbound_groups": [
    {
      "tag": "auto",
      "kind": "url_test",
      "outbounds": ["server-a", "server-b"],
      "selected": "server-a",
      "latency_ms": 120,
      "last_checked_unix_ms": 1713500000000,
      "effective_chains": [["server-a"]],
      "url_test_members": [
        {
          "member_tag": "server-a",
          "healthy": true,
          "latency_ms": 120,
          "last_checked_unix_ms": 1713500000000,
          "last_error": null,
          "effective_chains": [["server-a"]]
        }
      ]
    }
  ]
}
```

| 字段 | 说明 |
|------|------|
| `mode.kind` | 路由模式：`rule` / `global` / `direct` |
| `mode.outbound` | global 模式的出站 tag（其他模式省略） |
| `rule_count` | 规则数量 |
| `listeners` | 入站监听列表（tag, protocol, listen_address, listen_port） |
| `outbounds` | 出站列表（tag, protocol, server?, port?） |
| `outbound_groups` | 出站组（selector/fallback/url_test/relay/load_balance） |

### GET /api/v1/runtime

完整运行时状态：统计、日志配置、活动流、最近完成的流。

```json
{
  "stats": {
    "active_sessions": 3,
    "total_started": 100,
    "completed_sessions": 97,
    "failed_sessions": 0,
    "blocked_sessions": 0,
    "direct_sessions": 50,
    "chained_sessions": 47,
    "bytes_up": 1024000,
    "bytes_down": 5120000,
    "udp_upstream": { "active_associations": 0, "..." : "..." }
  },
  "udp_upstream_idle_timeout_seconds": 300,
  "log_level": "info",
  "log_files": ["logs/zero.log"],
  "pid": 12345,
  "config_path": "config.json",
  "started_at_unix_ms": 1713500000000,
  "active_sessions": [],
  "recent_completed_sessions": []
}
```

| 字段 | 说明 |
|------|------|
| `stats` | 统计摘要（同 `GET /api/v1/stats`） |
| `udp_upstream_idle_timeout_seconds` | UDP upstream 空闲超时 |
| `log_level` | 当前日志级别（`trace`/`debug`/`info`/`warn`/`error`） |
| `log_files` | 配置的日志文件路径列表，无文件输出时为空数组 |
| `pid` | 守护进程 OS 进程 ID |
| `config_path` | 运行中的配置文件路径（未指定时省略） |
| `started_at_unix_ms` | 进程启动时间（UNIX 毫秒） |
| `active_sessions` | 活动流详情列表 |
| `recent_completed_sessions` | 最近完成的流详情列表 |

### GET /api/v1/stats

轻量统计摘要。`active_sessions`, `total_started`, `completed_sessions`, `failed_sessions`, `bytes_up`, `bytes_down` 等。

### GET /api/v1/principal_flows

按主体查询活跃流数量，返回 `core_instance_id`、`session_registry_revision` 和 `principals`。用于与 flow 事件中的主体计数同步；不是历史流量或计费数据库。

### GET /api/v1/flows

活动流列表，`response.result` 直接是 `FlowSnapshot` 数组，例如 `{"api_id":"zero.api.v1","ok":true,"result":[]}`；没有 `active_flows` 包装键。支持过滤。

| 参数 | 默认 | 说明 |
|------|------|------|
| `limit` | 100 | 最大返回数 |
| `inbound_tag` | — | 按入站过滤 |
| `principal_key` | — | 按用户过滤 |

### GET /api/v1/flows/{flow_id}

单流详情。不存在时返回 `ok: false`、`error.code: "not_found"`；HTTP 状态可能仍为 `200`，应以响应信封判断结果。

### GET /api/v1/policies

所有 policy 状态（selector / fallback / url_test / load_balance），包含当前选择和健康探测结果。

### GET /api/v1/policies/{policy_tag}

单个 policy 详情。不存在时返回 `ok: false`、`error.code: "not_found"`；HTTP 状态可能仍为 `200`，应以响应信封判断结果。

### GET /api/v1/sinks

事件 sink 的投递状态快照。`pending` 表示尚未投递或尚未持久 ACK 的当前积压。

```json
{
  "sinks": [
    {
      "name": "connector-traffic",
      "pending": 12,
      "total_delivered": 4200,
      "total_failed": 3,
      "replay_gaps": 1,
      "last_success_at_unix_ms": 1713500000000,
      "last_failure_at_unix_ms": 1713499900000,
      "last_error": null,
      "outbox_storage": {
        "available_bytes": 8589934592,
        "total_bytes": 107374182400,
        "reserve_bytes": 5368709120,
        "maintenance_reserve_bytes": 1342177280,
        "write_blocked": false
      }
    }
  ]
}
```

`replay_gaps` 是单调累计的事件序列断档数；后续投递恢复成功只会清除 `last_error`，不会清零该计数。事件 sink 的 `pending` 在配置 outbox 时统计完整磁盘 backlog，包括尚未载入内存页的未 ACK 事件。配置 outbox 时还会返回 `outbox_storage`；`reserve_bytes` 是绝对值与比例配置计算出的有效 PUT 保留水位，`maintenance_reserve_bytes` 是 ACK 和压缩仍不得突破的紧急水位。`write_blocked: true` 表示新的 outbox PUT 已暂停，但只要尚未到紧急水位，现有 delivery 仍可投递和 ACK。未配置 outbox 时该字段省略。

### GET /api/v1/tun_status

TUN 虚拟网卡运行状态。

```json
{
  "running": true,
  "name": "zero-tun",
  "addr": "10.0.0.1",
  "tag": "tun-in"
}
```

| 字段 | 说明 |
|------|------|
| `running` | TUN 是否正在运行 |
| `name` | 网卡名称（运行时返回） |
| `addr` | 网卡地址（运行时返回） |
| `tag` | 入站 tag（运行时返回） |

状态还包含以下运行事实；可选字段及空 CIDR 列表可能省略：

| 字段 | 说明 |
| --- | --- |
| `addresses`、`mtu` | 实际生效的全部接口地址及 MTU |
| `healthy`、`last_error` | 健康状态与最后错误 |
| `auto_route`、`include_cidrs`、`exclude_cidrs` | 自动路由及捕获范围 |
| `dual_stack`、`strict_route`、`dns_hijack` | 实际启用的接管策略 |
| `egress_interface`、`egress_interface_v4`、`egress_interface_v6` | 物理出口接口 |
| `ipv4_egress`、`ipv6_egress` | 含 `availability`（`unknown` / `available` / `unavailable`）、可选 `interface` 和 `reason` |
| `network_generation` | 网络出口状态代次 |
| `address_family_policy`、`ipv6_to_ipv4_fallbacks` | 地址族策略及 IPv6 到 IPv4 回退计数 |
| `managed_by_config` | 是否由声明式配置管理 |

查询失败表示无法确认状态，不应构造 `running: false`。缺少新字段的旧响应也不能用于确认新参数已应用。

未启动时 `running` 为 `false`，`name`、`addr`、`tag` 等可选字段省略；状态还会包含布尔值、计数及地址族状态。不要将缺少可选字段当作解析错误。

---

## Command 端点

### POST /api/v1/commands

统一命令入口。HTTP 请求只需 `method` 和 `params`；此适配器不回显额外的 `id`。

```json
{
  "method": "policies.select",
  "params": {
    "policy_tag": "proxy",
    "target_tag": "direct"
  }
}
```

成功响应有两层结果：外层 `response.result` 是 `CommandResponse`，包含 `accepted` 以及可选的业务 `result`。例如：

```json
{
  "api_id": "zero.api.v1",
  "ok": true,
  "result": {
    "accepted": true,
    "result": { "policy_tag": "proxy", "selected": "direct" }
  }
}
```

下文有业务数据的 Response 示例展示 `response.result.result`；仅 `{ "accepted": true }` 的示例展示 `response.result`。IPC Command 使用相同的两层结构，并回显 IPC 请求 `id`。

支持的方法：

#### policies.select

切换 selector 的当前出站。

Params：`policy_tag` (string), `target_tag` (string)

`policy_tag` 必须是一个 `selector` policy。`target_tag` 是该 selector
`outbounds` 里的直接成员 tag；这个成员可以是普通 outbound，也可以是
`url_test`、`load_balance`、`fallback`、`relay` 或另一个 `selector`。控制层不要把嵌套
policy 展开成最终 leaf 后再发送；例如 selector `proxy` 的成员里有 url_test
组 `auto`，选择它时发送：

```json
{
  "method": "policies.select",
  "params": {
    "policy_tag": "proxy",
    "target_tag": "auto"
  }
}
```

这只会把外层 selector 选到 `auto`。`auto` 内部最终选中哪个成员，仍由
`url_test` 探测状态决定；需要立即刷新延迟时，再对 `auto` 发送
`policies.probe`，并通过事件或 policy 查询读取结果。

Response：
```json
{ "policy_tag": "proxy", "selected": "direct" }
```

错误：
- `not_found` — policy 不存在
- `invalid_argument` — target 不在 members 中

权限：`control`

#### policies.probe

触发 `url_test` 立即执行一轮探测（**异步**：命令仅触发，不等探测完成）。

Params：`policy_tag` (string)、`operation_id` (string，可选；省略或空字符串时由内核生成)

Response（同步返回的只是"已触发"，**不含延迟**）：
```json
{
  "policy_tag": "auto",
  "probe_triggered": true,
  "operation_id": "probe-123",
  "coalesced": false,
  "core_instance_id": "instance-id",
  "config_revision": 1
}
```

重复手动请求可能合并到同一轮，届时 `coalesced: true`，应使用 ACK 返回的有效 `operation_id` 配对完成事件，不能假定请求中的值一定生效。

延迟结果通过两种途径获取（GUI 二选一）：

1. **事件推送**（推荐）—— 探测完成后发射 `policy.probe.completed` 事件，payload 含每个成员的 `latency_ms`（见 [events.md](/projects/core/control-plane/events#policy-probe-completed)）。
2. **查询拉取** —— `GET /api/v1/policies/{policy_tag}` 返回 `PolicySnapshot`，其中 `latency_ms`（整组，= 选中节点延迟）与 `url_test_members[].latency_ms`（每成员）、`last_checked_unix_ms`、`last_error`。

> 单成员预算为 5 秒传输预算加节点 DNS 主/备用服务器的去重超时预算，上限 60 秒；并发队列等待不在该预算内。整组耗时取决于成员数及并发情况，不能假定 5 秒内结束。

错误：`not_found` — policy 不存在或不是 `url_test` 类型

权限：`control`

#### flows.close

主动关闭活动 flow。

Params：`flow_id` (string)

Response：
```json
{ "flow_id": "flow-123", "closed": true }
```

错误：`not_found` — flow 不存在或已结束

权限：`control`

#### config.validate

校验配置有效性，不改变运行时状态。

Params：`config` (object, 完整配置)

Response：
```json
{ "valid": true }
```

错误：`invalid_argument` — 配置无效；读取 `error.message` 和 `error.details`，HTTP/IPC 信封不传递内部 `cause`

权限：`config`

#### config.apply

持久化并热加载完整运维配置。响应会等待 proxy listener、flow hooks 和 EventDispatcher 等进程级服务完成 reconciliation；失败时尝试恢复上一份运行态和源文件。回滚本身也可能失败，应检查错误消息并重新查询实际状态。

Params：`config` (object, 完整配置)

Response：
```json
{
  "applied": true,
  "persistence": "source_file",
  "reconciled": true,
  "application_components": ["event-dispatcher"]
}
```

错误：
- `invalid_argument` — 配置无效
- `internal` — listener 或 application service 重建失败，响应 message 会说明回滚结果
- `api.control` 的 listener/credential 变更会 fail-closed；当前不支持在承载命令的控制面上自替换，需显式重启

权限：`config`

#### config.apply_runtime

应用不写回运维配置文件的运行时覆盖。HTTP、IPC 与 gRPC 都通过可等待确认的公共命令入口执行；响应只会在 proxy 与 application service reconcile 完成后返回。

Params：`config` (object, 完整配置)

Response：
```json
{
  "applied": true,
  "persistence": "runtime_only",
  "reconciled": true,
  "application_components": []
}
```

权限：`config`

#### mode.set

切换全局代理模式。

Params：`mode` (string, `"rule"` | `"direct"` | `"global"`), `outbound` (string, 仅 global 模式必填)

Response：
```json
{ "accepted": true }
```

错误：
- `invalid_argument` — mode 值无效，或 global 缺少 outbound
- `invalid_argument` — outbound tag 不存在

权限：`admin`

#### tun.start

启动 TUN 虚拟网卡。还支持 `secondary_addr`（另一地址族 CIDR，可选）、`include_cidrs` / `exclude_cidrs`（string[]，默认 `[]`）和 `auto_route`、`dual_stack`、`strict_route`、`dns_hijack`（bool，默认均为 `true`）。参数约束见[声明式 TUN](../configuration/#声明式-tun)。劫持需要有效 DNS 配置；结束后查询 `tun_status` 核对实际状态，超时不代表命令未执行。

Params：`name` (string, 可选), `addr` (string), `mask` (string, 可选, 默认 `"255.255.255.0"`), `mtu` (number, 可选；省略时使用 `runtime.network.mtu`，其默认值为 1500), `tag` (string)

Response：
```json
{ "accepted": true }
```

权限：`admin`

#### tun.stop

停止 TUN 虚拟网卡。

Params：无

Response：
```json
{ "accepted": true }
```

权限：`admin`

#### tun.recover

立即审计并尝试恢复运行中的 TUN 网络路由。请求为 `{"method":"tun.recover","params":{}}`；成功的 `response.result` 为 `{ "accepted": true }`。执行后查询 `tun_status` 确认健康状态与出口，不把命令接受等同于端到端联网成功。

权限：`admin`

#### diagnostics.probe_target

对指定出站的 `server:port` 做一次 **直连 TCP 可达性探测**（**同步**返回）。

> ⚠️ 这是诊断用途：从内核所在主机通过 direct connector **直接连接**到出站配置里的 server:port，**不经过代理协议、不做 TLS 握手、不发协议请求**。`latency_ms` 仅反映"本机 → 服务器 TCP 端口"的 RTT，不等于经代理的端到端延迟。2 秒超时。
>
> 经代理的单节点延迟使用下面的 `diagnostics.probe_outbound`；组成员探测和选择使用 `policies.probe`。

Params：`target_tag` (string)、`operation_id` (string，可选)

Response：
```json
{
  "target_tag": "server-a",
  "server": "1.2.3.4",
  "port": 443,
  "reachable": true,
  "latency_ms": 12
}
```

无固定 server 的出站（relay 链、无 server 的 direct）返回 `reachable: false` 且 `error: "outbound has no probeable fixed server"`。

错误：`not_found` — target 不存在

权限：`admin`

#### diagnostics.probe_outbound

对指定出站做一次 **经代理的同步单节点延迟探测**（`url_test` 探测的单节点、同步版本）。

与另两种探测的区别：

| 命令 | 同步 | 走代理 | 测的是 |
|---|---|---|---|
| `policies.probe` | ❌ 异步（多成员） | ✅ | 组内每成员经代理首字节延迟 |
| `diagnostics.probe_target` | ✅ | ❌ 直连 TCP | 本机→server:port TCP RTT |
| **`diagnostics.probe_outbound`** | **✅** | **✅** | **单节点经代理首字节延迟** |

经出站建立连接（包括适用的代理 TLS 和协议握手）→ 发 HTTP `HEAD` → 读首字节，返回毫秒耗时。仅支持 `http://` 目标 URL，因此没有目标网站的 HTTPS 握手；代理自身的 TLS 握手仍计入。传输预算为 5 秒，另加配置的节点 DNS 主/备用服务器超时预算，去重后合计、最高 60 秒；等待并发名额还可能增加命令总耗时。

这是诊断操作，不改变策略选择或出站健康状态，并绕过已有的出站健康隔离；不能把诊断成功当作 selector 已切换或 url_test 已更新。

Params：`target_tag` (string)、`operation_id` (string，可选)、`url` (string, 兼容性可选参数)。配置了
`runtime.latency_test_url` 时始终使用全局地址；否则使用命令中的 `url`，两者都未提供时默认
`http://www.gstatic.com/generate_204`。

Response（成功）：
```json
{
  "target_tag": "node-a",
  "url": "http://www.gstatic.com/generate_204",
  "via": "through_proxy",
  "reachable": true,
  "latency_ms": 128
}
```

Response（探测失败——超时/拒绝，属于**结果**而非命令错误，GUI 据此显示节点不可达）：
```json
{
  "target_tag": "node-a",
  "url": "http://www.gstatic.com/generate_204",
  "via": "through_proxy",
  "reachable": false,
  "latency_ms": null,
  "error": "probe target closed connection without response"
}
```

目标不存在、URL 非法和探测失败均返回成功命令信封（`ok: true`、`accepted: true`），业务结果为 `reachable: false`、`terminal_status: "failed"`。检查 `error_code`，例如 `target_not_found`、`invalid_probe_url`、`unsupported_target`、`probe_timeout`；不要只检查 `ok`。命令 JSON 无法解析、鉴权等错误仍使用失败信封。

成功与失败结果都还包含 `operation_id`、`core_instance_id`、`config_revision`、`operation_kind: "diagnostic_outbound"`、起止时间和 `duration_ms`，以及 `timeout_ms`、`dns_budget_ms`、`transport_budget_ms`、`deadline_capped`。`affects_policy_selection` 和 `affects_outbound_health` 为 `false`，`bypasses_outbound_health_quarantine` 为 `true`。以上 Response 示例只展示部分业务字段。

权限：`admin`

#### diagnostics.dns_lookup

解析域名。

Params：`hostname` (string)

Response：
```json
{
  "hostname": "example.com",
  "resolved_addresses": ["93.184.216.34", "2606:2800:220:1:248:1893:25c8:1946"],
  "count": 2
}
```

权限：`admin`

#### diagnostics.dns_cache

查询内核 DNS 解析器缓存（来自 `runtime.dns` 配置，非 OS 解析）。

Params：`domain` (string, 可选)，`limit` (number, 可选，默认 256，仅列表模式生效)

- 传 `domain`：返回该域名的缓存命中状态、地址与剩余 TTL。
- 不传 `domain`：列出当前所有有效缓存条目（按 `limit` 截断）。

Response（指定域名，命中）：
```json
{
  "enabled": true,
  "domain": "example.com",
  "hit": true,
  "addresses": ["93.184.216.34"],
  "ttl_seconds": 280
}
```

Response（未命中或缓存未启用）：
```json
{ "enabled": true, "domain": "missing.example", "hit": false, "addresses": [], "ttl_seconds": null }
```

Response（列表模式）：
```json
{
  "enabled": true,
  "entries": [
    { "domain": "example.com", "addresses": ["93.184.216.34"], "ttl_seconds": 280 }
  ],
  "count": 1
}
```

`enabled: false` 表示未配置 `runtime.dns.cache`。

权限：`admin`

#### diagnostics.fakeip_lookup

查询 Fake-IP 映射（`runtime.dns.answer.type: "fake_ip"`）。`domain` 与 `ip` 二选一；查询已有映射，不分配新地址：

- `domain`：前向查询（域名 → 已分配的 Fake IP，**不分配**新 IP）。
- `ip`：反向查询（Fake IP → 真实域名）。

Response（前向）：
```json
{ "enabled": true, "domain": "google.com", "fake_ip": "198.18.0.5" }
```

Response（反向）：
```json
{ "enabled": true, "ip": "198.18.0.5", "domain": "google.com" }
```

`fake_ip` / `domain` 为 `null` 表示无映射；`enabled: false` 表示未配置 Fake IP。两者都省略返回 `invalid_argument`。

#### fakeip.clear

清理 Fake-IP 映射，同时更新持久状态。权限为 `admin`。`params` 使用 `domain` 或 `ip` 二选一清理指定映射，空对象 `{}` 清空全部，不能同时设置两项。应用可能仍缓存旧合成地址，清理后需要重新解析；不要将它用作普通 DNS 缓存刷新。

权限：`admin`

#### diagnostics.trace_route

查看路由规则对指定目标的匹配结果。

Params：`target` (string), `port` (number), `protocol` (string, 可选，默认 `"tcp"`), `inbound_tag` (string, 可选)

Response：
```json
{
  "target": "1.1.1.1",
  "port": 443,
  "protocol": "tcp",
  "inbound_tag": "hk-in",
  "effective_mode": "rule",
  "route_action": { "route": "proxy" },
  "matched_rule": { "index": 2, "condition": "ip: 1.0.0.0/8" }
}
```

`matched_rule` 为命中的规则（0 基 `index` + 人类可读 `condition` 摘要，如 `domain: example.com`、`ip: 10.0.0.0/8`、`and(domain_keyword: login, geoip: CN)`）。命中 `final` 动作（无规则匹配）时为 `null`。

权限：`admin`

---

## 鉴权

内核采用 Bearer Token 鉴权和粗粒度权限门禁：

- **未配置 token**（例如 CLI `--status-listen` 的本地调试模式）：所有端点无鉴权，默认授予 `read`、`control`、`config`、`admin`
- **已配置 token**：所有请求必须携带 `Authorization: Bearer <token>` 或 `X-Zero-Api-Key: <token>`；当前配置 token 映射为 `admin`
- **权限名称**：`read`、`control`、`config`、`admin`，对外序列化使用 snake_case

这是一个内核，不是多租户 SaaS。内核只提供控制面能力边界；租户、角色、审计等业务权限应在上层面板/网关实现。

---

## 事件流端点

### GET /api/v1/events/stream

Server-Sent Events (SSE) 实时事件流。

| 参数/头 | 说明 |
|---------|------|
| `?types=flow.completed,policy.selected` | 事件类型过滤；包含任一 flow 生命周期类型时会生成活动快照 |
| `?since=<sequence>` | 断点续传，从指定 sequence 之后开始 |
| `Last-Event-ID: <sequence>` | 同上，HTTP 头形式 |

事件格式：
```
id: 42
event: flow.completed
data: {"schema_id":"zero.event.v1","event_id":"...","event_type":"flow.completed",...}
```

连接断开后可使用 `Last-Event-ID` 请求追赶，服务端先发送保留的追赶事件再切回实时流。单次最多追赶 256 条；事件环有容量限制，缺口只记录服务端警告，SSE 不提供完整历史保证。跨进程重启必须丢弃旧序号（用 `core_instance_id` 区分）；需要可靠完成记录时使用带 outbox 的 sink。详见 [events.md](/projects/core/control-plane/events)。

实时订阅阶段会生成 `flow.snapshot` 作为当前活动连接基线；它不在事件环中，因此不会被 `?since=` 回放，也不会出现在下面的一次性 `/events` 结果中。带断点续传的连接会先收到事件环中的追赶事件，再进入包含新快照的实时阶段。消费者应以快照的 `records` 替换活动集合，并按 `revision` 合并后续生命周期事件。

### GET /api/v1/events

事件快照（一次性返回当前事件日志中的所有事件）。不如 `/events/stream` 实时，适合一次性调试。这里的“事件快照”是事件环内容，不是 `flow.snapshot` 活动连接基线。
