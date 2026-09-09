# API 契约

本文档描述面向外部消费者的当前控制面契约。

版本之间的行为、时序和恢复语义变化记录在[控制面兼容性与破坏性变更](/projects/core/control-plane/breaking-changes)。即使 `api_id` / `schema_id` 未变化，消费者也应根据 `health.engine_build_id` 检查登记的语义边界。

## 命名规范

所有对外 JSON 字段名、枚举值、功能名称、适配器名称、sink
名称、命令方法、查询变体和错误码均使用 `snake_case`。

示例：

```json
{
  "error": { "code": "permission_denied" },
  "features": ["status-api", "config_snapshot", "runtime_snapshot"],
  "adapters": [{ "kind": "in_process", "enabled": true }]
}
```

命令方法使用点分隔的命名空间，因为它们命名的是内核能力：

```json
{
  "method": "policies.select",
  "params": {
    "policy_tag": "proxy",
    "target_tag": "direct"
  }
}
```

## 响应信封

HTTP 和 IPC 响应使用 `zero_api::ApiResponse`。

| 字段 | 含义 |
|------|------|
| `api_id` | 协议标识；当前值为 `"zero.api.v1"` |
| `id` | 请求关联 ID，主要由 IPC 多路复用时使用 |
| `ok` | 请求是否成功 |
| `result` | 成功的响应负载 |
| `error` | 结构化的错误负载 |

消费者应先判断 `ok`，再解析 `result` 或 `error`。

## 事件信封

事件使用 `zero_api::ApiEvent`。

| 字段 | 含义 |
|------|------|
| `schema_id` | 事件模式标识；当前值为 `"zero.event.v1"` |
| `event_id` | 跨引擎启动唯一、重放稳定的不透明事件标识，用于去重；不得解析内部格式 |
| `event_type` | 机器可读的事件名称 |
| `sequence` | 事件源内的单调递增序号 |
| `occurred_at_unix_ms` | 事件时间戳 |
| `source_id` | 可选的节点/源标识 |
| `principal_key` | 可选的流量归因键 |
| `labels` | 可选的外部标签 |
| `payload` | 事件特定的负载 |

消费者应按 `event_type` 字符串路由。未知的事件类型应被忽略，除非消费者明确需要严格拒绝。

## 能力发现

使用 `GET /api/v1/capabilities` 或 IPC 的 `capabilities` 查询来发现当前构建和运行时能力。

响应报告：

- 已启用的适配器
- 已配置的事件 sink
- 已编译或已启用的功能
- 当前调用者被授予的权限
- 协议和事件模式标识

能力发现是描述性的。它不授予额外权限，也不暴露外部系统特定的业务概念。

### V1 契约版本

当前能力响应增加 `contracts`，分别报告 `capabilities`、`control_api`、`config_schema` 和 `error_codes` 的 `current` 与 `minimum_supported`。客户端支持区间与内核区间相交时才启用对应能力；旧响应没有此字段时视为版本未知，不能默认当作 V1。

完整配置顶层 `schema_version` 默认为 `1`，内核导出时显式携带。未知版本在构造运行资源前拒绝，不通过删除字段静默降级。

`features` 提供正向能力，`global_limitations` 提供跨协议限制，协议局部限制在 `protocols[].limitations`。未知能力和限制条目可忽略；已知限制消失也应结合正向能力判断。TUN 双栈、系统 DNS 自动发现、Fake-IP 持久化及 DNS 地址族策略均应按实际能力启用。

V1 是公开契约版本，与发行编号独立。当前已公开 v0.0.1，具体构建与安装验收范围见[实现进度](/progress)。DNS/TUN 的使用及限制见[运行 TUN 与 DNS](../guides/tun-and-dns)。

## 错误处理

错误码是 `snake_case` 的稳定机器字符串。

| 错误码 | 含义 |
|------|------|
| `not_found` | 请求的资源不存在 |
| `invalid_argument` | 请求格式或字段值无效 |
| `permission_denied` | 调用者缺少所需权限 |
| `insufficient_os_privilege` | 操作系统权限不足，例如创建 TUN 或修改路由 |
| `feature_disabled` | 功能在当前构建/运行时中未启用 |
| `conflict` | 当前状态拒绝该操作 |
| `unsupported` | 操作不在当前控制面范围内 |
| `internal` | 内核侧错误 |

不要解析 `error.message` 用于控制流。它是人类可读的上下文信息。

## 消费者形态

外部 GUI 和其他系统应将其自身的业务状态保留在内核之外：

- 用户账户、套餐、配额、计费、租户和审计策略保留在外部系统中
- 内核归因使用 `principal_key`、`source_id` 和 `labels`
- 运行时决策通过查询快照、事件和命令进行
- 直接修改引擎内部结构不属于控制面范畴
