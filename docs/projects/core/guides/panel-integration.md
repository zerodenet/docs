# 机场面板接入指南

本文面向需要把 Zero 作为节点内核接入机场面板的开发者，给出节点在线状态、用户流量计费和远程运维的最小闭环。

生产部署、告警、备份恢复、计费对账和升级回滚见[Connector 生产运维手册](/projects/core/guides/connector-operations)。

Zero 只提供代理内核与通用控制面，不管理用户、套餐、余额、订单、订阅链接或设备数量。这些业务对象由面板维护，并通过稳定标识映射到 Zero 的 `node_id`、`source_id` 和 `principal_key`。

集成时应以 Zero 的 `zero.panel.v1` OpenAPI、Zero API/gRPC 和事件契约为准。Xboard 等现成面板若不愿直接实现这些合同，应在面板侧部署独立兼容桥；不要把面板方言或其他代理内核的内部对象复制进 Zero 的配置、connector 或运行时。

## 集成架构

```text
订阅/用户系统 ──生成凭据和节点配置──> Zero Node
                                      │
                ┌─────────────────────┼─────────────────────┐
                │                     │                     │
                ▼                     ▼                     ▼
          PushConnector         EventDispatcher       Control API
          原生同步/远程命令       flow.completed        查询/受控命令
                │                 Webhook                   │
                └─────────────────────┼─────────────────────┘
                                      ▼
                                  机场面板
```

三条链路职责不同：

| 需求 | Zero 能力 | 面板用途 |
|------|-----------|----------|
| 节点在线状态 | 顶层 `push` / PushConnector | 原生短周期同步、活跃连接数、节点累计流量和远程命令 |
| 用户流量计费 | `api.event_sinks` Webhook | 持久消费 `flow.completed`，按用户聚合最终字节数 |
| 运维查询 | `api.control` | 查询健康、运行状态、策略和 Sink 投递状态 |
| 订阅、套餐和支付 | 面板自身能力 | 生成客户端配置、管理账户和商业规则 |

GUI 实时连接不经过 PushConnector。GUI 使用 IPC/HTTP/gRPC 的 `EventSource`；机场面板的计费事件由 EventDispatcher 投递。

## 1. 构建节点

机场面板闭环需要 `panel_connector`。该 feature 会启用 PushConnector、Webhook Event Sink 和事件分发能力：

```bash
cargo build --release --features full,status_api,panel_connector
```

该构建只包含 Zero 原生 `zero.panel.v1` 和 Reference Adapter，不包含任何第三方面板方言。

如果还需要节点本地 JSONL 审计文件，额外启用 `sink_jsonl`：

```bash
cargo build --release --features full,status_api,panel_connector,sink_jsonl
```

未编译相应 feature 却配置 `push` 或 Webhook 时，Zero 会在启动阶段明确报错，不会静默忽略。

## 2. 建立面板标识映射

面板至少维护以下映射：

| 面板对象 | Zero 字段 | 建议值 |
|----------|-----------|--------|
| 节点 | `push.node_id` | `edge-shanghai-01` |
| 事件来源 | Sink `source_id` | 与 `node_id` 相同 |
| 节点凭据记录 | 入站用户 `credential_id` | `credential:10001:v1` |
| 用户/账户 | 入站用户 `principal_key` | `account:10001` |
| 投递幂等键 | 事件 `event_id` | 原样保存并建立唯一索引 |

`credential_id`、`principal_key` 和协议密钥必须分离：前者标识节点凭据记录，`principal_key` 是稳定、非敏感的面板账户 ID，VLESS `id` 只是可轮换的 UUID 密钥材料。不要使用密码、UUID 凭据原文或会随套餐变化的显示名称作为计费主键。

以下 SOCKS5 入站把认证用户映射到面板账户：

```json
{
  "tag": "panel-users",
  "listen": { "address": "0.0.0.0", "port": 1080 },
  "protocol": {
    "type": "socks5",
    "users": [
      {
        "username": "user-10001",
        "password": "replace-with-generated-secret",
        "principal_key": "account:10001"
      }
    ]
  }
}
```

VLESS、VMess、Trojan、Shadowsocks 和 Hysteria2 的面板管理用户统一支持 `credential_id`、`principal_key`、`up_bps` 和 `down_bps`。同一 `principal_key`、`policy_revision` 和双向速率定义一个 Zero 主体策略带宽池，所有并发 TCP/UDP 会话共同消费其上传、下载 GCRA 时间线；UDP 首包、后续包和返回包也在该聚合范围内。revision 或速率变化会建立新时间线，旧会话只在确认式清退完成前保留旧策略。主体清退会中断正在等待速率令牌的 UDP 包；没有 `principal_key` 的入站默认限速仍按会话独立执行。面板生成新配置后，应先运行 `zero validate`，再通过受控部署流程替换节点配置并 reload。

## 3. 配置面板连接

将以下片段合入节点配置。示例使用同一个面板接收密钥处理心跳与事件，控制 API 使用独立密钥：

```json
{
  "api": {
    "control": {
      "enabled": true,
      "listen": { "address": "127.0.0.1", "port": 9090 },
      "api_key_env": "ZERO_NODE_CONTROL_KEY"
    },
    "event_sinks": [
      {
        "type": "webhook",
        "tag": "panel-billing",
        "url": "https://panel.example.com/api/zero/events",
        "events": ["flow.completed"],
        "source_id": "edge-shanghai-01",
        "api_key_env": "ZERO_PANEL_API_KEY"
      }
    ],
    "outbox_path": "state/zero-panel-outbox.jsonl",
    "dead_letter_path": "state/zero-panel-dead-letter.jsonl",
    "dispatcher": {
      "max_in_memory_deliveries": 4096,
      "replay_batch_size": 4096
    }
  },
  "push": {
    "url": "https://panel.example.com",
    "node_id": "edge-shanghai-01",
    "api_key_env": "ZERO_PANEL_API_KEY",
    "sync_interval_seconds": 10,
    "pull_commands": true,
    "sync_users": true,
    "user_sync_protocol": "vless",
    "user_sync_inbound_tag": "vless-in",
    "user_sync_state_path": "state/vless-users.json",
    "user_sync_interval_seconds": 15,
    "report_traffic": true,
    "traffic_outbox_path": "state/panel-traffic.jsonl",
    "report_alive": true
  }
}
```

Zero 原生 connector 使用 `/api/v1/nodes/{node_id}/config` + ETag 拉取 `zero.panel.node-config.v1` 单入站快照，只有 Zero 公共命令服务确认运行时重载成功才推进 cursor；使用 `/traffic` 投递带稳定 `event_id` 的完成流事实，并只清除管理端在 `accepted_event_ids` 中逐条确认的记录；`/alive` 使用整份替换语义。第三方面板应直接实现这些 Zero 语义或 Zero API/gRPC；不愿适配时，在面板侧部署独立兼容桥。

`api_key` 与 `api_key_env` 二选一，不能同时配置。生产环境应使用 HTTPS 和环境变量：

```bash
export ZERO_PANEL_API_KEY='replace-with-panel-key'
export ZERO_NODE_CONTROL_KEY='replace-with-node-control-key'
./target/release/zero validate config.json
./target/release/zero run config.json
```

PowerShell：

```powershell
$env:ZERO_PANEL_API_KEY = 'replace-with-panel-key'
$env:ZERO_NODE_CONTROL_KEY = 'replace-with-node-control-key'
./target/release/zero.exe validate config.json
./target/release/zero.exe run config.json
```

控制 API 示例只监听 localhost。如果面板必须主动访问节点，应使用内网、VPN 或反向代理，并限制来源地址；不要直接把无额外网络隔离的控制端口暴露到公网。

## 4. 实现面板端点

面板直接实现 Zero 原生合同；第三方方言不由节点内 connector 适配：

| Method | Path | 用途 | 成功响应 |
|--------|------|------|----------|
| `POST` | `/api/v1/nodes/{node_id}/register` | 幂等注册并鉴权节点 | 任意 `2xx` |
| `POST` | `/api/v1/nodes/{node_id}/sync` | 接收节点状态和已应用游标，返回命令与变更提示 | `{"schema_id":"zero.connector.sync.v1"}` |
| `GET` | `/api/v1/nodes/{node_id}/config` | 返回受限的托管 inbound 配置 | `304` 或带 ETag 的配置 |
| `GET` | `/api/v1/nodes/{node_id}/users?after_revision=N` | 返回用户全量或累积差量 | `204` 或同步信封 |
| `POST` | `/api/v1/nodes/{node_id}/users/ack` | 确认 revision 已应用并持久化 | 任意 `2xx` |
| `POST` | `/api/v1/nodes/{node_id}/traffic` | 按稳定 event ID 接收计费事实并精确 ACK | ACK 信封 |
| `POST` | `/api/v1/nodes/{node_id}/alive` | 替换当前在线 IP 快照 | 任意 `2xx` |
| `POST` | `/api/zero/events` | 接收 `ApiEvent` 事件信封 | 任意 `2xx` |

所有端点都应验证：

```http
Authorization: Bearer <ZERO_PANEL_API_KEY>
```

### 原生控制同步

节点发送：

```json
{
  "schema_id": "zero.connector.sync.v1",
  "node_id": "edge-shanghai-01",
  "build_id": "0.0.16-dev",
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

面板更新节点的 `last_seen`、构建版本和运行指标，然后返回：

```json
{
  "schema_id": "zero.connector.sync.v1",
  "user_revision": 109,
  "commands": [
    {
      "command_id": "cmd-001",
      "issued_at_unix_ms": 1784688000000,
      "expires_at_unix_ms": 1784688060000,
      "method": "policies.select",
      "params": { "policy_tag": "proxy", "target_tag": "server-b" }
    }
  ]
}
```

同步请求中的 `bytes_up` / `bytes_down` 是节点累计运行指标，可能因重启归零，也可能因重试重复上报。它适合监控，不应直接作为用户计费增量。

### 计费事件

Webhook 接收的是完整 `ApiEvent` 信封。计费核心字段如下：

```json
{
  "schema_id": "zero.event.v1",
  "event_id": "flow.completed:42:1760000005000",
  "event_type": "flow.completed",
  "source_id": "edge-shanghai-01",
  "sequence": 42,
  "principal_key": "account:10001",
  "payload": {
    "flow_id": "42",
    "auth": { "principal_key": "account:10001" },
    "traffic": { "bytes_up": 1024, "bytes_down": 4096 },
    "record": {
      "state": "completed",
      "traffic": { "bytes_up": 1024, "bytes_down": 4096 }
    }
  }
}
```

面板处理顺序：

1. 验证 Bearer token、`schema_id` 和 `event_type`。
2. 以 `event_id` 写入唯一索引；重复事件直接返回 `2xx`，不得重复计费。
3. 以 `principal_key` 定位账户；缺失或未知时进入人工核对队列。
4. 优先读取 `payload.record.traffic`，兼容旧内核时回退到 `payload.traffic`。
5. 在同一数据库事务中保存原始事件并累加 `bytes_up + bytes_down`。
6. 事务提交后才返回 `2xx`。

Webhook 返回 `429` 或 `5xx` 时会进入有界重试；其他 `4xx` 视为不可重试。配置 `outbox_path` 后，delivery 会在调用 Webhook 前同步写入 journal，成功后写 ACK；进程重启会恢复未 ACK delivery。`dispatcher.max_in_memory_deliveries` 只限制活跃内存页，超过上限的 backlog 仍已落盘并会在 ACK 后分页恢复；`/api/v1/sinks` 的 `pending` 统计完整磁盘 backlog。重试耗尽后事件写入 `dead_letter_path`。面板仍必须按 `event_id` 幂等，因为 ACK 落盘前崩溃会产生 at-least-once 重投。

如果 Sink 配置了事件白名单，`sequence` 会跳过未投递的其他事件类型，因此只能用于排序和诊断，不能要求每个相邻数值都连续。

## 5. 验收

1. 启动节点，确认面板在两个心跳周期内更新 `last_seen`。
2. 使用配置的用户凭据建立并关闭一条代理连接。
3. 确认 `/api/zero/events` 收到一次 `flow.completed`，且 `principal_key` 正确。
4. 用同一个 `event_id` 重放请求，确认账户流量没有再次增加。
5. 临时让 Webhook 返回 `500`，确认 Sink 失败计数增长并发生重试。
6. 恢复 `2xx` 后检查状态：

```bash
curl -H "Authorization: Bearer ${ZERO_NODE_CONTROL_KEY}" \
  http://127.0.0.1:9090/api/v1/sinks
```

7. 返回一条 `policies.select` 命令，确认节点日志记录执行结果。
8. 返回一个更高 revision 的 VLESS upsert，确认新凭据无需重绑监听即可连接，旧凭据被拒绝。
9. 删除一个在线主体，确认其现有 TCP/UDP flow 以 `principal_disabled` 结束；修改同一主体的凭据、限速或 `device_limit`，确认旧流和载体以 `principal_policy_changed` 退出。若使用 VLESS/VMess MUX 或 Hysteria2 QUIC，继续尝试在旧 carrier 上开流并确认连接已退出。
10. 为用户设置 `device_limit: 1`，从两个不同源 IP 建立连接：第二个 IP 必须在建立上游前被拒绝；同一 IP 的并发流应允许。关闭第一个 IP 的最后一个流/载体后，第二个 IP 应能接入。重启节点后确认不会重复应用旧 revision，并会重试尚未成功的 revision ACK。
11. 配置 `runtime.principal_quota_state_path`，再为用户设置很小的 `quota_remaining_bytes`。用并发 TCP/UDP 或 MUX 子流共同消耗部分余额，正常重启并确认从剩余值继续扣减；耗尽后所有流和载体应以 `quota_exhausted` 退出且同 revision 无法重连，更高 revision 下发新余额后恢复。破坏状态文件时节点必须拒绝启动，模拟运行中写盘失败时新限额连接必须 fail closed。
12. 使用 `api_key_file` 启动 connector，确认心跳成功后以同目录临时文件原子替换密钥，并同步切换面板接受的密钥；不重启节点，确认后续心跳、用户同步、计费与 alive 全部使用新密钥。把文件暂时替换为空值时请求必须失败且不能回退旧密钥，恢复有效密钥后应自动重连。
13. 拒绝一次原生 `/register`，确认拒绝期间没有心跳、命令、用户同步或计费请求；允许同一 `node_id` 幂等注册后，确认控制交换才开始。使用无权声明该节点 ID 的 token 时必须持续拒绝。
14. 修改托管节点端口或 WS/gRPC path，确认 `/api/v1/sinks` 中 `panel-config.pending` 回到 `0` 且新监听生效。占用候选端口后再次发布，确认绑定失败、ETag 不前进、旧监听恢复且本地完整配置文件未被改写。
15. 重复节点和用户同步，核对托管 listener 与用户 revision 已在运行时生效，同时比较进程启动前、运行中和退出后的配置文件 SHA-256；三次必须一致。

## 当前边界

- Zero 不提供机场用户、套餐、支付、订阅链接或节点库存 API。
- PushConnector 默认不消费 flow；`report_traffic=true` 时消费 `flow.completed` 并负责 adapter 原生批量计费，未 ACK 事实保留在独立 outbox；`report_alive=true` 时消费 flow 快照与生命周期增量维护在线 IP。
- PushConnector 不接受远程任意 `config.validate` / `config.apply`；`sync_node_config` 只开放经 Adapter 归一化和 fail-closed 校验的单入站配置。完整配置、路由和出站发布仍走独立部署流程。
- 远程命令执行结果当前写入节点日志，不回传命令结果端点。
- `flow.completed` 是计费最终事实；`flow.snapshot` 只用于实时客户端同步，不投递到 Webhook。

## 相关文档

- [Push Connector 协议](/projects/core/control-plane/push-connector)
- [事件目录与 flow.completed](/projects/core/control-plane/events#flow-completed)
- [控制面配置](/projects/core/control-plane/configuration)
- [HTTP 控制 API](/projects/core/control-plane/http-api)
- [兼容性与破坏性变更](/projects/core/control-plane/breaking-changes)
