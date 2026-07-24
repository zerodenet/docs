# 配置模型参考

大部分控制面配置位于 `api` 键下；节点主动上报的 `push` 配置位于顶层 `push` 键（不在 `api` 下）。本文档记录当前 API 配置字段。

完整的配置模型（inbounds、outbounds、route、runtime）请参阅 [config.md](/projects/core/configuration/)。

## 完整示例

```json
{
  "api": {
    "control": {
      "enabled": true,
      "listen": { "address": "127.0.0.1", "port": 9090 },
      "api_key": "sk-secret"
    },
    "hooks": [
      { "type": "ipc", "socket": "/run/billing/hook.sock", "timeout_ms": 100 }
    ],
    "event_sinks": [
      {
        "type": "jsonl",
        "tag": "audit",
        "path": "/var/log/zero/events.jsonl",
        "events": ["flow.completed", "engine.warning"]
      },
      {
        "type": "webhook",
        "tag": "billing",
        "url": "https://billing.example.com/events",
        "events": ["flow.completed"]
      }
    ],
    "outbox_path": "state/event-deliveries.jsonl",
    "dead_letter_path": "state/event-dead-letter.jsonl",
    "dispatcher": {
      "max_in_memory_deliveries": 4096,
      "replay_batch_size": 4096
    }
  },
  "push": {
    "url": "https://receiver.example.com",
    "node_id": "node-001",
    "api_key": "sk-xxx",
    "sync_interval_seconds": 10,
    "pull_commands": true
  }
}
```

## `api.control`

本地 HTTP 控制接口。

| 字段 | 类型 | 默认值 | 说明 |
|------|------|------|------|
| `enabled` | bool | `false` | 是否启动 HTTP 控制服务器 |
| `listen` | object | -- | 监听地址；`enabled=true` 时必填 |
| `listen.address` | string | -- | 绑定 IP，`127.0.0.1` 仅本地，`0.0.0.0` 公网 |
| `listen.port` | u16 | -- | 监听端口 |
| `api_key` | string | -- | Bearer token；未设置则不认证（建议仅本地使用） |
| `api_key_env` | string | -- | 从环境变量读取 api_key；优先级低于 `api_key` |

**CLI 覆盖**：`--status-listen 127.0.0.1:9090` 优先级高于配置文件。两者不能同时使用。

### 限流

内置限流，无需配置：

| 类别 | 限制 | 响应 |
|------|------|------|
| 查询 (GET) | 100 req/s | 429 Too Many Requests |
| 命令 (POST) | 10 req/s | 429 Too Many Requests |
| SSE 并发 | 5 连接 | 429 Too Many Requests |

## `api.hooks`

Flow 生命周期钩子，按数组顺序执行。

```json
{ "type": "ipc", "socket": "/run/billing/hook.sock", "timeout_ms": 100 }
```

| 字段 | 类型 | 默认值 | 说明 |
|------|------|------|------|
| `type` | string | -- | 钩子类型，目前仅支持 `"ipc"` |
| `socket` | string | -- | IPC socket 路径 |
| `timeout_ms` | u64 | `100` | 请求超时（毫秒）；超时则 fail-open 放行 |

**CLI 覆盖**：`--ipc-hook-socket /run/billing/hook.sock` 优先级高于配置文件。

钩子协议详情：参见 [hooks.md](/projects/core/control-plane/hooks)。

## `push`

节点主动向外部管理端点上报。接收端可以是面板、监控系统或任意 HTTP 服务。

```json
{
  "push": {
    "url": "https://receiver.example.com",
    "node_id": "node-001",
    "api_key": "sk-xxx",
    "sync_interval_seconds": 10,
    "pull_commands": true
  }
}
```

| 字段 | 类型 | 默认值 | 说明 |
|------|------|------|------|
| `url` | string | -- | 接收端 URL；设置后启用 push |
| `node_id` | string | -- | 本节点标识 |
| `api_key` | string | -- | 认证密钥 |
| `api_key_env` | string | -- | 从环境变量读取 api_key |
| `allow_insecure` | bool | `false` | 允许 `http://`，仅用于受信任测试网络 |
| `sync_interval_seconds` | u64 | `30` | Zero 原生控制同步间隔 |
| `pull_commands` | bool | `false` | 是否执行原生同步响应中的远程命令 |
| `sync_node_config` | bool | `false` | 启用版本化节点配置同步；仅允许修改一个显式托管的 inbound |
| `node_config_protocol` | string | `vless` | 托管入站协议：`vless`、`vmess`、`trojan`、`shadowsocks` 或 `hysteria2`；协议切换会被拒绝 |
| `node_config_inbound_tag` | string | -- | 唯一允许被面板节点配置修改的 inbound tag |
| `node_config_state_path` | string | -- | 节点配置 ETag 状态文件；启用节点配置同步时必填 |
| `node_config_sync_interval_seconds` | u64 | `15` | 节点配置条件拉取间隔 |
| `sync_users` | bool | `false` | 启用版本化协议用户同步 |
| `sync_vless_users` | bool | `false` | 旧版 VLESS 专用兼容开关 |
| `user_sync_protocol` | string | `vless` | 面板管理的协议；当前支持 `vless`、`vmess`、`trojan`、`shadowsocks`、`hysteria2`；Shadowsocks 2022 多用户要求入站预置 SIP023 `identity_password` |
| `user_sync_inbound_tag` | string | -- | 面板独占管理的 inbound tag |
| `user_sync_state_path` | string | -- | 已应用 revision 状态文件 |
| `user_sync_interval_seconds` | u64 | `15` | 用户同步间隔 |
| `report_traffic` | bool | `false` | 从 `flow.completed` 提取带稳定 `event_id` 的计费事实并通过 Zero 原生流量端点上报 |
| `traffic_outbox_path` | string | -- | 未获面板成功响应的计费事实 journal；启用流量上报时必填 |
| `traffic_batch_size` | usize | `1000` | 单次面板请求最多投递的完成 flow 事实数 |
| `traffic_max_in_memory_deliveries` | usize | `4096` | 同时物化在内存中的未 ACK 计费事实上限；其余事实保留在 outbox 磁盘 journal |
| `traffic_report_interval_seconds` | u64 | `10` | 流量批报尝试间隔；失败后另加指数退避 |
| `report_alive` | bool | `false` | 从 flow 快照与生命周期增量维护并上报用户在线 IP |
| `alive_report_interval_seconds` | u64 | `30` | 已变化在线快照的检查和上报间隔 |

`sync_node_config` 不授予管理端任意 `config.apply` 权限。Connector 只能把 Zero 原生节点合同投影为协议中立的单入站配置；本地路由、出站、API、connector 凭据、运行时选项和其他 inbound 均保持不变。候选配置通过公共 `config.apply_runtime` 命令执行，等待代理监听器 reconcile ACK，且不会写回运维配置文件。每次进程启动强制取得一份完整节点配置，之后使用持久 ETag 条件拉取；绑定、协议准备或确认超时均恢复上一份配置且不推进 ETag。

协议详情：参见 [push-connector.md](/projects/core/control-plane/push-connector)。

## `api.event_sinks`

事件投递目标数组。

生产事件投递建议同时配置 `api.outbox_path`。`api.dispatcher.max_in_memory_deliveries`（默认 `4096`）限制活跃投递工作集；超过工作集的未 ACK delivery 只在 outbox 中保留轻量文件偏移索引，并在槽位释放后分页加载，不会因为面板长时间不可用而在内存中复制完整事件积压。`api.dispatcher.replay_batch_size`（默认 `4096`）控制每轮从 engine event log 补偿有界 live queue 断档的最大事件数。两个值都必须大于零。

`/api/v1/sinks` 的 `pending` 是 outbox 中全部未 ACK delivery 数，不只是当前内存页。若 outbox 写入失败，dispatcher 不会把该 delivery 当作已持久化成功；replay cursor 保留在缺口之前，并通过 `last_error` 暴露故障。若 engine event log 在磁盘恢复前已淘汰缺口，状态会记录 replay gap，需要人工对账。

### JSON Lines 文件

```json
{
  "type": "jsonl",
  "tag": "audit",
  "path": "/var/log/zero/events.jsonl",
  "events": ["flow.completed"],
  "source_id": "node-001"
}
```

| 字段 | 类型 | 默认值 | 说明 |
|------|------|------|------|
| `type` | string | -- | `"jsonl"` |
| `tag` | string | -- | 唯一标识 |
| `path` | string | -- | 文件路径；相对路径相对于配置目录解析 |
| `events` | string[] | `[]` | 事件类型白名单；空 = 接收所有 |
| `source_id` | string | -- | 覆盖事件 source_id |

### Webhook

```json
{
  "type": "webhook",
  "tag": "billing",
  "url": "https://example.com/events",
  "events": ["flow.completed"],
  "api_key": "sk-xxx",
  "api_key_env": "WEBHOOK_KEY"
}
```

| 字段 | 类型 | 默认值 | 说明 |
|------|------|------|------|
| `type` | string | -- | `"webhook"` |
| `tag` | string | -- | 唯一标识 |
| `url` | string | -- | 接收端点 |
| `events` | string[] | `[]` | 事件类型白名单 |
| `api_key` | string | -- | 请求头 `Authorization: Bearer {key}` |
| `api_key_env` | string | -- | 从环境变量读取 |
| `allow_insecure` | bool | `false` | 允许明文 `http://`（仅测试用） |

投递失败自动重试（指数退避 2s->4s->8s->...->64s，最多 6 次）。

## `api.dead_letter_path`

死信队列文件路径。超过最大重试次数的事件不会被丢弃，而是写入此文件持久化。

| 字段 | 类型 | 说明 |
|------|------|------|
| `dead_letter_path` | string | 死信 JSON Lines 文件路径；未设置则事件最终丢弃 |

死信文件格式：每行一个 JSON 对象，包含 `dead_lettered_at_unix_ms` 和 `original_event`。

## `api.outbox_path`

持久投递 journal。配置后，dispatcher 会在调用 Sink 之前同步写入每个 `(sink_tag, event_id)` delivery；Sink 返回已交付后写入 ACK。进程退出或异常重启时，未 ACK delivery 会从 journal 恢复并重投。

```json
{
  "api": {
    "outbox_path": "state/event-outbox.jsonl",
    "dead_letter_path": "state/event-dead-letter.jsonl"
  }
}
```

Webhook 接收端必须用 `event_id` 建立唯一约束并幂等返回 `2xx`。这样 ACK 写入前崩溃导致的 at-least-once 重投不会重复计费。达到重试上限后，delivery 进入 dead letter 并在 outbox 中 ACK。

### 投递状态查询

```bash
zero status  # 包含 sink 投递统计
```

## 相关运行时字段

以下配置字段位于 `api` 部分之外，但可通过 `GET /api/v1/config` 获取，与控制面消费者相关。

| 字段 | 位置 | 说明 |
|------|------|------|
| `idle_timeout_secs` | `inbounds[*]` | TCP 中继空闲超时（秒，默认 300） |
| `url_rewrite` | `route.url_rewrite[]` | 路由前的域名重写规则（`from` / `from_regex` -> `to`） |
| `domain_regex` | `route.rules[*].condition` | 按正则表达式匹配域名的条件类型 |
| `up_bps` / `down_bps` | `inbounds[*].protocol`（Hysteria2、Shadowsocks、Trojan） | 每入站的 GCRA 速率限制 |

完整详情参见 [config.md](/projects/core/configuration/)。
