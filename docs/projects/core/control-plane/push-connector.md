# Push Connector

Push Connector 是节点主动与中心管理端收敛状态的可选同进程组件，支持 Zero 原生短周期同步、远程命令接收和版本化协议用户同步。
接收端可以是面板、监控系统或任意 HTTP 服务。

Zero 原生面板合同的机器可读权威副本是 [`zero-panel-v1.openapi.json`](/projects/core/control-plane/zero-panel-v1.openapi.json)，合同标识为 `zero.panel.v1`。随发布二进制执行 `zero connector contract` 可输出同一份 OpenAPI 3.1 JSON，机场面板不需要从第三方方言反推 Zero 的接口。

## 架构

```
┌──────────────────────┐         HTTP POST        ┌──────────────────────┐
│    Zero Node          │ ───── sync request ────> │    Receiver           │
│                      │ <──── sync response ──── │                      │
│  PushConnector       │                          │  /api/v1/nodes/       │
│    control sync loop │                          │    {id}/sync          │
│    protocol user sync│                          │    {id}/users         │
└──────────────────────┘                          └──────────────────────┘
```

每轮都是节点发起、请求完成后即释放的短连接：节点 → 接收端。中心不为每个节点维持长连接，命令和变更提示通过同一个同步响应返回；配置、用户、流量与在线快照仍使用独立端点承载。

## 与 GUI 和事件 Sink 的职责边界

`zero-connector` crate 同时承载 Push Connector 和 EventDispatcher，但两者不是同一条数据链路，也不替代 GUI 控制连接：

| 组件 | 上游能力 | 对外职责 | 是否消费 flow 实时事件 |
|------|----------|----------|------------------------|
| GUI connection（IPC/HTTP/gRPC） | `QueryService`、`CommandService`、`EventSource` | 本地或远程交互、状态查询、命令和实时界面更新 | 是；订阅建立时可先收到 `flow.snapshot` |
| EventDispatcher（JSONL/Webhook Sink） | `EventSource` | 过滤、序列化、重试、死信和持久事件投递 | 是；只投递生命周期增量，不投递 `flow.snapshot` |
| PushConnector（Panel Connector） | 窄统计提供器、`CommandService`、可选 `EventSource` | 周期心跳、节点汇总统计、远程命令、用户 revision 同步、面板原生计费批报和在线 IP 上报 | `report_traffic=true` 时消费 `flow.completed` 计费；`report_alive=true` 时用 `flow.snapshot` 和生命周期增量维护在线状态 |

因此，GUI 收取 flow 的路径不是 PushConnector；GUI 与 EventDispatcher 共享控制面的事件语义，但分别维护自己的传输和生命周期。PushConnector 中的“轮询”仅指从面板拉取远程命令，不表示轮询内核事件日志。

## 配置

```json
{
  "push": {
    "url": "https://receiver.example.com",
    "node_id": "node-001",
    "api_key_file": "secrets/panel-token",
    "sync_interval_seconds": 10,
    "pull_commands": true,
    "command_state_path": "state/commands.json",
    "sync_node_config": true,
    "node_config_protocol": "vless",
    "node_config_inbound_tag": "vless-in",
    "node_config_state_path": "state/node-config.json",
    "node_config_sync_interval_seconds": 15,
    "sync_users": true,
    "user_sync_protocol": "vless",
    "user_sync_inbound_tag": "vless-in",
    "user_sync_state_path": "state/vless-users.json",
    "user_sync_interval_seconds": 15
  }
}
```

| 字段 | 类型 | 默认 | 说明 |
|------|------|------|------|
| `url` | string | — | 接收端 API 根 URL，设置后启用 connector |
| `node_id` | string | — | 本节点标识，`url` 设置后必填 |
| `api_key` | string | — | 固定接收端 API 密钥；与 `api_key_env`、`api_key_file` 三选一 |
| `api_key_env` | string | — | API 密钥环境变量名；每次请求重新读取进程环境 |
| `api_key_file` | string | — | API 密钥文件；每次请求重新读取，支持原子替换后无重启轮换，相对配置目录解析 |
| `allow_insecure` | bool | `false` | 允许 `http://`；仅用于明确受信任的本地测试网络 |
| `sync_interval_seconds` | u64 | `30` | 原生控制同步间隔 |
| `pull_commands` | bool | `false` | 是否执行 `/sync` 响应中的命令 |
| `command_state_path` | string | — | 已接受命令的持久防重放账本；启用命令时必填 |
| `sync_node_config` | bool | `false` | 拉取并应用一个受限的面板节点配置 |
| `node_config_protocol` | string | `vless` | 预期协议；协议变更 fail closed |
| `node_config_inbound_tag` | string | — | 面板独占管理的单个 inbound tag |
| `node_config_state_path` | string | — | 持久 ETag 状态；启用时必填 |
| `node_config_sync_interval_seconds` | u64 | `15` | 节点配置条件拉取间隔 |
| `sync_users` | bool | `false` | 启用版本化协议用户同步 |
| `sync_vless_users` | bool | `false` | 兼容旧配置的 VLESS 专用启用开关；新配置使用 `sync_users` |
| `user_sync_protocol` | string | `vless` | 被管理 inbound 的协议；当前支持 `vless`、`vmess`、`trojan`、`shadowsocks`、`hysteria2` |
| `user_sync_inbound_tag` | string | — | 被面板独占管理的 inbound tag |
| `user_sync_state_path` | string | — | 已应用 revision 的持久状态文件；相对配置目录解析 |
| `user_sync_interval_seconds` | u64 | `15` | 用户同步间隔 |
| `report_traffic` | bool | `false` | 消费 `flow.completed` 并使用 adapter 原生流量接口批报 |
| `traffic_outbox_path` | string | — | 未 ACK 计费事实的持久 journal；启用流量批报时必填 |
| `traffic_batch_size` | usize | `1000` | 每批最多投递的完成 flow 计费事实数 |
| `traffic_max_in_memory_deliveries` | usize | `4096` | 内存计费工作集上限；其余未 ACK 事实保留在 outbox 并分页加载 |
| `traffic_report_interval_seconds` | u64 | `10` | 正常批报间隔；失败批次指数退避到最多 64 秒 |
| `report_alive` | bool | `false` | 基于 flow 快照和生命周期事件上报每用户当前源 IP 集合 |
| `alive_report_interval_seconds` | u64 | `30` | 检查并上报已变化 alive/device 快照的间隔 |

`url` 为空时 connector 不启动。`url` 默认必须使用 HTTPS；明文 HTTP 只有显式设置 `allow_insecure: true` 才能通过配置校验。`api_key`、`api_key_env` 与 `api_key_file` 必须且只能设置一个。生产轮换优先使用权限受限的 `api_key_file`：先在同目录写入并 `fsync` 临时文件，再原子替换目标；下一次同步、用户同步、计费或 alive 请求自动使用新值。空文件、读取失败或轮换中间态会让该次请求失败并进入现有重试，不会回退到旧密钥。

所有可写 connector 状态文件、JSONL event sink、event outbox/dead-letter、主体配额快照与 `api_key_file` 必须拥有不同路径。校验会先相对配置目录解析并消除 `.` / `..`；Windows 还按大小写不敏感规则比较。路径别名不能用来绕过单文件单所有者约束，避免独立 writer 相互覆盖凭据、cursor、ACK、事件输出或计费 journal。

JSONL event sink、dead letter、event/traffic outbox、command replay、user/node cursor 和主体配额状态在运行期还会持有同路径的 `.zero.lock` 跨进程独占 lease。第二个进程尝试消费或写入相同文件时启动即失败；正常退出或崩溃后 OS 释放 lease，遗留的空锁文件不会阻止接管。配置校验同时保留这些锁路径，其他状态或凭据不能占用它们。

## 固定的原生边界

connector 不再公开 `PanelAdapter`、`ConnectorPeer` 或 `spawn_*_with_adapter` 一类进程内方言注入入口。二进制只内置 Zero 原生 HTTP peer，并严格实现 `zero.panel.v1`。第三方面板有三种选择：直接实现这份原生合同；直接调用 Zero API/gRPC；或在面板侧部署独立兼容桥。第三方方言、字段投影和升级节奏均不进入 Zero 内核及 connector 进程。

原生响应采用 fail-closed 解析：节点配置、用户更新、同步回复和计费 ACK 出现未知字段、未知 schema 或非法枚举均不会推进本地 cursor/ACK。同步、节点配置和计费 ACK 响应上限为 1 MiB，用户更新响应上限为 16 MiB；`Content-Length` 与 chunked body 都执行上限检查。远程命令会先验证顶层字段、受支持方法和必需参数，再持久化防重放状态；不支持远程完整配置替换。

## 节点注册与鉴权

Zero 原生 HTTP peer 启动后首先执行幂等注册，注册成功前不会发送控制同步、同步用户或投递计费事实：

```http
POST /api/v1/nodes/{node_id}/register
Authorization: Bearer {api_key}
Content-Type: application/json

{
  "node_id": "node-001",
  "build_id": "0.0.15-rc.1",
  "command_pull": true,
  "node_config_sync": true,
  "user_sync": true,
  "traffic_reporting": false,
  "alive_reporting": false
}
```

非 `2xx`、超时或凭据文件读取失败均视为注册失败，节点以 2、4、8 秒递增、最高 64 秒的退避重试。管理端必须把相同 `node_id` 的重复注册实现为幂等更新，并在注册端校验节点是否有权声明对应 ID。

### Zero 原生节点配置契约

Zero 原生 HTTP peer 通过 Zero 自己的版本化快照拉取单入站配置。进程启动时不带条件头强制取得完整快照；后续请求携带上次已确认的 ETag：

```http
GET /api/v1/nodes/{node_id}/config
Authorization: Bearer {api_key}
If-None-Match: "node-config-v41"
```

无变化返回 `304 Not Modified`。有变化必须同时返回新的 `ETag` 和以下正文：

```json
{
  "schema_id": "zero.panel.node-config.v1",
  "config": {
    "protocol": "vless",
    "listen_address": "0.0.0.0",
    "listen_port": 443,
    "transport": {
      "type": "websocket",
      "settings": {
        "path": "/zero",
        "headers": {}
      }
    },
    "security": {
      "type": "file_tls",
      "settings": {
        "cert_path": "/etc/zero/tls/fullchain.pem",
        "key_path": "/etc/zero/tls/private.key",
        "server_name": "edge.example.com",
        "alpn": ["http/1.1"]
      }
    }
  }
}
```

`transport.type` 是 Zero 自有的 `tcp`、`websocket`、`grpc`、`h2`、`http_upgrade` 或 `split_http`；`security.type` 是 `none`、`local_tls`、`file_tls` 或 `reality`。协议不匹配、未知 schema/字段、缺失 ETag、非法传输安全组合或候选配置校验失败都不会推进 cursor。只有 `PanelConfigService` 确认 listener reconcile 完成后才原子保存 ETag；节点和用户投影只形成运行时覆盖，不写回启动配置文件。路由、出站、API、运行时、凭据、其他入站以及完整部署配置始终由本地 Zero 所有；进程重启后由强制全量节点/用户快照重建面板覆盖。

### Zero 原生计费与在线契约

Zero 原生 HTTP peer 实现 Zero 自己的线协议。启用 `report_traffic` 后，节点向以下端点投递未 ACK 的完成流事实：

```http
POST /api/v1/nodes/{node_id}/traffic
Authorization: Bearer {api_key}
Content-Type: application/json

{
  "schema_id": "zero.panel.traffic.v1",
  "records": [
    {
      "event_id": "flow-completed-01",
      "principal_key": "account:10001",
      "bytes_up": 1024,
      "bytes_down": 4096
    }
  ]
}
```

面板必须在同一事务中以 `(node_id, event_id)` 去重并累计首次出现的事实，然后返回已持久接受的 ID：

```json
{"accepted_event_ids":["flow-completed-01"]}
```

已经处理过的重复 `event_id` 也必须再次出现在 ACK 中。节点只清除明确 ACK 的事实；部分 ACK 只清除对应记录，未知 ID、重复 ID、非 `2xx`、响应丢失或无效 JSON 均保留原始 `event_id` 和字节数重试。因此请求批次在重试时可以重新分组，幂等性仍由单条计费事实保证，不依赖易变的批次边界。

启用 `report_alive` 后，节点发送整个节点当前在线快照：

```http
POST /api/v1/nodes/{node_id}/alive
Authorization: Bearer {api_key}
Content-Type: application/json

{
  "schema_id": "zero.panel.alive.v1",
  "principals": [
    {
      "principal_key": "account:10001",
      "source_ips": ["198.51.100.10"]
    }
  ]
}
```

该请求是替换语义而非增量累加；面板收到 `2xx` 前节点会重发同一快照。空 `principals` 必须清空该节点之前的在线集合。这样 Zero 原生契约本身具备计费防重和在线状态收敛能力，不依赖任何第三方面板方言。

第三方面板协议不在此合同内。面板可以直接实现本合同或 Zero API/gRPC；不愿适配时，应在面板侧部署独立兼容桥，桥接程序不得进入 Zero 节点主二进制。

## 持久状态兼容性

带 `event_dispatcher` 的 Zero 二进制提供纯只读预检：

```bash
zero connector state --json /etc/zero/config.json
```

报告 schema 为 `zero.connector.upgrade-state-report.v1`，聚合 connector 自己的 event/traffic outbox、dead letter、command replay、node cursor、user revision、文件凭据检查，以及由 `zero-engine` 所有的 principal quota v1 检查。检查不启动 connector、不发送面板请求、不截断 outbox，也不输出凭据内容。缺失且尚未初始化的文件是兼容状态；未换行 outbox 尾帧标记为 `recoverable_partial_tail`；中段损坏、未知状态字段、未知 quota 版本、重复主体余额或读取失败均令总报告 `compatible=false` 并以非零状态退出。

升级前必须用旧、新二进制分别检查同一份一致性快照；候选版本实际推进 revision、quota 和计费 ACK 后，还必须由旧二进制再次检查。该检查证明格式可读，不替代真实进程启动、协议流量、面板计费和升级窗口对账。

## Connector 可观测性与积压

`status sinks`、HTTP `/api/v1/sinks` 和对应 gRPC 查询会把普通事件 sink 与以下 panel channel 合并返回：

- `panel-control`：节点注册、心跳、命令和用户同步的成功/失败状态。
- `panel-traffic`：已 ACK 完成事件数、投递失败及 `pending` 未 ACK 计费事实数。
- `panel-alive`：在线 IP 快照投递状态。

每项包含 `pending`、`total_delivered`、`total_failed`、单调累计的 `replay_gaps`、最近成功/失败时间及 `last_error`。运维告警至少应覆盖：`panel-control` 连续失败、`panel-traffic.pending` 持续增长、`replay_gaps > 0`，以及 outbox 所在磁盘剩余空间。`pending` 是当前节点完整 durable backlog（包括尚未加载进内存的磁盘页），不是面板已入账但响应丢失的检测器。

## 原生控制同步

### POST /api/v1/nodes/{node_id}/sync

**请求：**
```json
{
  "schema_id": "zero.connector.sync.v1",
  "node_id": "node-001",
  "build_id": "<build-id>",
  "observed": {
    "uptime_seconds": 3600,
    "active_flows": 42,
    "bytes_up": 1024000,
    "bytes_down": 5120000
  },
  "applied": {
    "node_config_cursor": "\"cfg-41\"",
    "user_revision": 108
  }
}
```

请求头：`Authorization: Bearer {api_key}`

**响应（已收敛）：**
```json
{ "schema_id": "zero.connector.sync.v1" }
```

**响应（命令和变更提示）：**
```json
{
  "schema_id": "zero.connector.sync.v1",
  "node_config_changed": true,
  "user_revision": 109,
  "commands": [
    {
      "command_id": "cmd-001",
      "issued_at_unix_ms": 1784688000000,
      "expires_at_unix_ms": 1784688060000,
      "method": "policies.select",
      "params": {
        "policy_tag": "proxy",
        "target_tag": "server-b"
      }
    }
  ]
}
```

命令在当前同步周期内执行。`node_config_changed` 和更高的 `user_revision` 只是立即条件拉取提示，实际配置与用户数据不会塞入同步响应；周期性条件拉取仍作为丢提示后的恢复路径。流量采用独立的 durable ACK 通道。

### 支持的命令

| method | 说明 |
|--------|------|
| `policies.select` | 切换 selector，params: `policy_tag`, `target_tag` |
| `policies.probe` | 立即探测策略组，params: `policy_tag` |
| `mode.set` | 切换运行模式，params: `mode`, 可选 `outbound` |
| `flows.close` | 关闭活动 flow，params: `flow_id` |
| `tun.start` / `tun.stop` | 启停 TUN；start 需要 `addr`, `tag`，可选 `name`, `mask`, `mtu` |
| `diagnostics.probe_target` | 探测出站目标，params: `target_tag` |
| `diagnostics.dns_lookup` | DNS 查询，params: `hostname` |
| `diagnostics.trace_route` | 路由诊断，params: `target`，可选 `port`, `protocol`, `inbound_tag` |

命令执行结果通过日志记录，不在同步响应中回传。远端命令不暴露任意 `config.validate`、`config.apply` 或 `config.apply_runtime`；connector 只能通过受限的节点配置投影更新明确托管的 inbound。未来可扩展 `POST /api/v1/nodes/{node_id}/commands/{cmd_id}/result`。

每条命令必须使用不超过 128 字节的路径安全 `command_id`，有效期不能超过 5 分钟，签发时间允许最多 30 秒时钟偏差。节点在执行副作用前把 ID 与过期时间原子写入 `command_state_path`，因此中心重试和节点重启均不会重复执行；状态无法持久化时拒绝执行。`pull_commands: false` 时忽略同步响应中的命令。命令延迟直接由统一的 `sync_interval_seconds` 决定，不再存在第二套命令轮询周期或 `/commands` 请求。

## 版本化协议用户同步

启用 `sync_users` 后，节点启动时读取本地 revision，并按间隔请求。`user_sync_protocol` 当前可选 `vless`、`vmess`、`trojan`、`shadowsocks` 或 `hysteria2`；旧字段 `sync_vless_users` 只作为 VLESS 兼容入口：

```http
GET /api/v1/nodes/{node_id}/users?after_revision=41
Authorization: Bearer {api_key}
```

无变更返回 `204 No Content`。有变更返回一个累积差量或全量快照：

```json
{
  "revision": 42,
  "inbound_tag": "vless-in",
  "full": false,
  "changes": [
    {
      "op": "upsert",
      "credential_id": "credential-10001",
      "principal_key": "account:10001",
      "id": "11111111-2222-3333-4444-555555555555",
      "flow": null,
      "up_bps": 10000000,
      "down_bps": 50000000,
      "device_limit": 2,
      "quota_remaining_bytes": 1073741824
    },
    {
      "op": "delete",
      "credential_id": "credential-10002",
      "principal_key": "account:10002"
    }
  ]
}
```

身份字段不能混用：

- `credential_id`：节点侧凭据记录的稳定 ID。
- `principal_key`：非敏感、稳定的计费/封禁主体键。
- `id`：面板返回的协议密钥材料；VLESS/VMess 解释为 UUID，Trojan/Shadowsocks/Hysteria2 解释为 password，不能跨协议复用。
- `quota_remaining_bytes`：可选的节点侧共享剩余额度快照。相同 `principal_key` 与 revision 的 TCP、UDP、MUX、QUIC 子流共同扣减上传与下载字节；降到零后整个主体以 `quota_exhausted` 清退，同 revision 的新连接继续被拒绝。面板必须用更高 revision 下发新的余额快照。

节点先把面板方言投影为 Zero 自有的 `PanelUserApply`，完整校验差量和结果配置，再通过 `PanelConfigService` 等待运行时 listener reconcile。只有 reconcile 成功后才清退受影响主体、原子写入 `user_sync_state_path` 并发送 ACK；绑定、准备或确认失败会恢复 last-known-good，不推进 revision，也不误杀旧配置仍授权的会话。VMess 未指定 cipher 时使用 `aes-128-gcm`；VLESS 仍可携带 `flow`。Trojan、Shadowsocks 与 Hysteria2 的面板管理配置使用 `users` 数组；旧的单 `password` 配置继续兼容静态节点，但不会被静默升级为面板身份。Shadowsocks 2022 多用户使用 SIP023 EIH：节点配置预置不随用户同步变化的 `identity_password`（iPSK），面板为每个用户下发单个 uPSK；空用户快照保留 iPSK 但拒绝全部认证。该模式只支持 AES 2022，chacha20 EIH 会在应用前被拒绝。被删除或换绑的 `principal_key` 会拒绝新认证，并取消该主体的活动 TCP/UDP flow；已认证 UDP association、VLESS/VMess MUX carrier 与 Hysteria2 QUIC carrier 同时收到主体撤销通知并退出，不能继续创建新子流。

```http
POST /api/v1/nodes/{node_id}/users/ack
Authorization: Bearer {api_key}
Content-Type: application/json

{"revision":42}
```

ACK 失败不会回滚已应用配置；节点保留 pending ACK 并在下个周期或重启后重试。面板必须保证 revision 单调递增，并对相同 revision 的 ACK 幂等。`full: true` 表示 `changes` 中的 upsert 集合是该 inbound 的完整面板用户集合。

生产启用节点侧共享余额时应同时配置 `runtime.principal_quota_state_path`。节点在独立后台线程中以约 50ms 合并窗口写入原子余额快照，正常停机强制刷新，重启后按相同主体与 policy revision 续扣；持久化失败后新限额连接 fail closed。突然断电仍可能损失最近一个合并窗口，因此严格财务账以持久 `flow.completed` 计费 ACK 为准，节点余额用于实时 admission，不宣称逐字节事务一致。

## Keepalive 与重连

- 每次 `/sync` 成功重置 `last_success` 时间戳
- `/sync` 失败后进入指数退避：1s → 2s → 4s → 8s → ... → 最大 64s
- 断连超过 2 分钟记录 `warn` 日志
- 中心应实现同步超时检测（如 90s 未收到 `/sync` 视为节点离线）

## 面板侧参考实现

最小可用的面板端点（Python/Flask）：

```python
from flask import Flask, request, jsonify

app = Flask(__name__)
nodes = {}  # node_id -> last_seen

@app.post("/api/v1/nodes/<node_id>/sync")
def sync(node_id):
    body = request.get_json()
    nodes[node_id] = body
    resp = {"schema_id": "zero.connector.sync.v1"}

    # 嵌入待执行命令
    pending = get_pending_commands(node_id)
    if pending:
        resp["commands"] = pending

    return jsonify(resp)

def get_pending_commands(node_id):
    # 从数据库读取待执行命令
    return []
```

## 安全

- 所有请求携带 `Authorization: Bearer {api_key}`
- 默认强制 HTTPS；只有显式 `allow_insecure: true` 才允许 HTTP
- `api_key` 支持从环境变量读取（`api_key_env`），避免写入配置文件
