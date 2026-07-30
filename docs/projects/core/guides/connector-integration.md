# 接入 Connector Webhook

Connector 让 Zero 主动把内核事件投递到外部系统。它不接收管理命令，也不要求接收方实现 Zero 指定的 URL 路径。

## 1. 构建能力

```bash
cargo build --release --features connector
zero build-info
```

确认 `features` 包含 `connector`。它会同时启用事件分发；需要本地 JSONL 文件时再加入 `sink-jsonl`。

## 2. 选择要接收的事件

常见选择：

| 目的 | 事件 |
|------|------|
| 每条连接的最终流量与结果 | `flow.completed` |
| 周期统计 | `stats.sampled` |
| 节点告警 | `engine.warning` |
| 配置变化 | `config.changed` |
| 策略选择与探测 | `policy.selected`、`policy.probe.completed` |

完整字段见[事件目录](/projects/core/control-plane/events)。

## 3. 实现接收端

接收端接受 `POST` 和 `zero.event.v1` JSON：

```json
{
  "schema_id": "zero.event.v1",
  "event_id": "1730000000000-42",
  "event_type": "flow.completed",
  "occurred_at_unix_ms": 1730000000000,
  "source_id": "edge-west",
  "sequence": 42,
  "principal_key": "credential-value",
  "labels": {},
  "payload": {}
}
```

处理顺序：

1. 使用 `event_id` 去重；
2. 持久化事件或确认此前已经持久化；
3. 返回 HTTP 状态。

| 返回状态 | Zero 行为 |
|----------|-----------|
| 任意 `2xx` | 确认成功 |
| `429` 或 `5xx` | 按配置退避重试 |
| 其他状态 | 不可重试拒绝 |

Connector 提供至少一次投递，因此接收端必须幂等。

## 4. 在完整配置中注册

把下面的 `api` 片段合入节点的完整配置：

```json
{
  "api": {
    "event_sinks": [
      {
        "type": "webhook",
        "tag": "traffic-delivery",
        "url": "https://central.example/receivers/traffic",
        "events": ["flow.completed", "stats.sampled"],
        "source_id": "edge-west",
        "headers": {
          "x-central-token": "receiver-defined-secret"
        }
      },
      {
        "type": "webhook",
        "tag": "operations-delivery",
        "url": "https://operations.example/receivers/zero",
        "events": ["engine.warning", "config.changed"],
        "source_id": "edge-west"
      }
    ],
    "outbox_path": "state/event-outbox.jsonl",
    "dispatcher": {
      "webhook_timeout_ms": 10000,
      "max_retry_attempts": 3,
      "retry_initial_delay_ms": 4000,
      "retry_max_delay_ms": 64000,
      "outbox_min_free_bytes": 1073741824,
      "outbox_min_free_percent": 5,
      "exhausted_delivery_policy": "retry_forever"
    }
  }
}
```

关键语义：

- `url` 是接收方提供的完整地址，Zero 不追加 `/register`、`/sync`、`/traffic` 或其他路径；
- `tag` 只是节点本地的 sink、状态和 outbox 标识；
- `events` 是这个注册的事件过滤条件，空数组表示全部；
- `source_id` 只是 envelope 元数据；
- 一个节点可以注册多个 URL，多个节点也可以复用同一个 URL；
- URL 不绑定节点身份、inbound、凭证或代理协议。

## 5. 校验并应用

同机管理：

```bash
zero validate config.json
zero reload config.json
```

外部控制端通过 HTTP `config.validate` 和 `config.apply`，或 gRPC `Control.Execute` 提交同一份完整配置。外部控制端必须拥有自己的完整期望配置；`GET /api/v1/config` 只是观测摘要，不能作为可回写的完整配置读取接口。

当前合同没有 revision/CAS 字段，因此同一节点应只有一个配置写入所有者，避免旧副本覆盖较新的修改。

## 6. 检查投递

```bash
zero connector state --json config.json
```

或查询运行状态：

```bash
curl \
  -H "Authorization: Bearer $ZERO_API_KEY" \
  http://127.0.0.1:9090/api/v1/sinks
```

关注：

- `pending`
- `last_error`
- `replay_gaps`
- `outbox_storage.write_blocked`
- 最近成功和失败时间

每个 sink 使用独立投递工作单元，一个 URL 超时不应阻塞其他 URL。

## 7. 故障和磁盘边界

默认 `retry_forever` 会保留并持续重试可恢复故障。只有明确选择 `dead_letter` 或 `discard`，才会在达到重试阈值后结束 delivery。

outbox 使用实时磁盘保留水位。达到水位时会停止新的 PUT，但会尽可能继续投递和 ACK 已有积压。长期低水位可能形成 `replay_gaps`；外部系统仍需以自己的业务账本做最终对账。

## Connector 不负责什么

限流、停用、套餐、计费、通知和升级工作流由外部系统决定。需要改变 Zero 运行状态时，外部系统调用通用 HTTP/IPC/gRPC 方法或应用完整配置；程序升级由部署系统执行。

Connector 只转换、过滤和可靠投递事件。完整 wire 合同见[Connector 投递合同](/projects/core/control-plane/connector)。
