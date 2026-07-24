# 控制面兼容性与破坏性变更

本文记录会影响 GUI、SDK、面板、事件 Sink 或进程内 Rust 集成的控制面语义变化。当前事实仍以同目录下的接口与事件文档为准；本文只维护版本边界和迁移要求。

## 消费者如何判断兼容性

外部消费者连接内核后应依次检查：

1. `health.engine_build_id`，确定实际运行的内核版本；
2. `capabilities.api_id` 和 `capabilities.schema_id`，确定请求与事件信封版本；
3. `capabilities.features`、`build_features` 和协议矩阵，确定当前构建实际启用的能力；
4. 本文对应版本的语义变更，再决定是否启用兼容分支。

兼容性标识的含义：

| 标识 | 当前值 | 何时必须变化 |
|------|--------|--------------|
| `api_id` | `zero.api.v1` | 请求、响应信封或既有字段出现不兼容 wire 变化 |
| `schema_id` | `zero.event.v1` | 事件信封或既有事件字段出现不兼容 wire 变化 |
| `engine_build_id` | Cargo 包版本 | wire 兼容但行为、时序或恢复语义发生变化 |

新增可选字段、未知事件类型和新增 capability 通常保持向前兼容；消费者必须忽略不认识的可选字段和事件。改变 ACK 时序、快照含义、增量合并规则、重放范围或既有字段含义，即使 JSON 形状不变，也必须在本文登记。

## 版本矩阵

| 版本 | 影响面 | 迁移结论 |
|------|--------|----------|
| `Unreleased` | 事件消费者、计费/Sink 去重、Zero 原生面板 | 引擎生成的 `event_id` 增加每次启动唯一的随机 epoch；原生面板响应与远程命令改为版本化、有限大小和 fail-closed；用户速率改为 Zero 主体策略聚合 <!-- version-contract:unreleased-row --> |
| `0.0.15-rc.1` | 进程内 Rust `EventSource`、事件 Sink | Rust 实现者必须迁移到实时 `EventStream`；IPC/HTTP/gRPC GUI wire 无变化 |
| `0.0.15-rc` | GUI flow 生命周期 | 订阅 ACK 后以 `flow.snapshot` 建立活动连接基线，再合并 flow 增量 |

## Unreleased

### 引擎生成事件使用跨启动唯一 ID

旧事件 ID 仅由事件类型、进程内 flow ID/序号和毫秒时间戳组成。进程快速重启后这些值可能复用，使原生面板或 Sink 把新事实误判为已处理事件。

新语义：

- 每个 `EngineEventLog` 创建时生成一个 128 位随机 epoch；
- 所有引擎内部生成的事件 ID 均以前述 epoch 限定，在同一进程内重放时保持不变；
- 通过进程内 `emit()` 注入、由调用者拥有 ID 的外部事件保持原 ID；
- `event_id` 的内部拼接形式不是公共契约，消费者只能比较完整字符串并用于幂等去重。

该变化不修改 `zero.event.v1` 的 JSON 字段形状，但修正了跨进程启动的唯一性语义。任何依赖旧 `{type}:{flow_id}:{timestamp}` 格式解析的消费者必须删除该解析逻辑，改用 `event_type`、`payload.record.flow_id` 和 `occurred_at_unix_ms` 等正式字段。

### Zero 原生面板合同正式版本化

Zero 原生机场面板合同标识固定为 `zero.panel.v1`，并提供 OpenAPI 3.1 产物和 `zero connector contract` 导出命令。原生同步、节点配置、用户更新和计费 ACK 不再忽略未知字段；无效远程命令也不会先进入防重放账本再被静默跳过。

节点控制交换已收敛为 `POST /api/v1/nodes/{node_id}/sync`，schema 为 `zero.connector.sync.v1`。原 `/heartbeat` 与 `/commands` 端点已删除；配置中的 `heartbeat_interval_seconds`、`command_poll_interval_seconds` 也已由单一 `sync_interval_seconds` 取代，旧字段会被明确拒绝。connector 不再公开进程内 adapter/peer 注入 SPI，第三方方言必须在 Zero 之外适配。

响应大小限制：

- heartbeat、node config、traffic ACK：1 MiB；
- commands、user update：16 MiB。

面板迁移要求：

1. 删除未在 OpenAPI 中声明的响应扩展字段；
2. 只下发受支持且参数完整的命令；
3. 大用户快照应使用 revision 增量，不能依赖无限响应；
4. 在专用节点运行 `zero connector conformance --allow-writes` 并归档完整报告。

原生验收报告升级为 `zero.panel.conformance-report.v2`：原先顶层的单一 `build_id` 被 `candidate` 对象替代，并同时记录 `build_id`、`git_hash`、`build_profile`、编译 feature 和执行二进制自算的 `binary_sha256`。消费验收报告的工具必须先按 `schema_id` 分支，不能继续把只含版本号的 v1 报告当成完整候选证据。

### 用户速率改为 Zero 主体策略聚合

开发态预资格期间，`up_bps` / `down_bps` 曾被描述并执行为单条 TCP/UDP flow 的限制。该语义允许同一用户通过增加并发连接绕过带宽策略，不满足 Zero 自有机场控制面的主体策略定义。

新语义：

- 同一 `principal_key`、`policy_revision` 和双向速率组成一个 Zero 主体策略身份；
- 该身份下的并发 TCP/UDP 会话共享上传、下载 GCRA 时间线；
- revision 或速率变化建立新时间线，旧会话在确认式清退前继续持有旧策略；
- 没有 `principal_key` 的入站默认限速仍按会话独立执行。

JSON 字段形状和 `zero.panel.v1` schema ID 不变。该修正发生在首个清洁 release candidate 和正式生产签字之前；历史开发态 manifest 只能证明当时的每流实现，不得继续作为当前候选产物证据。面板无需修改 wire payload，但容量规划和限速验收必须改为并发 TCP/UDP 聚合测试。

## 0.0.15-rc.1

### `EventSource` 统一为实时订阅

旧语义存在两个不同实现：

- `Engine::subscribe()` 返回一次性的 `Vec<RawApiEvent>` 历史快照；
- `EngineHandle::subscribe()` 返回实时 `EventSubscriber`。

新语义：

- 所有 `EventSource::subscribe()` 都返回实现 `EventStream` 的实时订阅；
- `latest(limit, filter)` 只用于读取近期历史；
- `since(sequence, limit, filter)` 用于按事件序号恢复，返回 `requested_after`、`actual_from` 和 `has_gap`；
- `has_gap = true` 时，消费者不得直接继续套用增量，必须先通过快照或 Query 重建状态；
- 包含 flow 生命周期的实时订阅仍可在增量前发送合成的 `flow.snapshot`。

进程内 Rust 实现者需要：

1. 将 `type Stream = Vec<RawApiEvent>` 替换为实现 `EventStream` 的实时流；
2. 实现阻塞 `recv()` 和非阻塞 `try_recv()`；
3. 实现新的 `EventSource::since()` 游标恢复方法；
4. 不再把 `subscribe()` 当作历史查询使用。

### EventDispatcher 投递时序

EventDispatcher 从周期性事件环扫描改为持有一个实时订阅：

- dispatcher 不再反复把历史快照当作新事件扫描；实时订阅仍按配置的轮询间隔排空并投递到 Sink；
- `flow.snapshot` 仍只用于实时客户端同步，不投递到 JSONL/Webhook；
- Webhook、重试、死信和 Sink 过滤语义保持不变；
- 外部 Sink 应继续使用 `event_id` 去重，并按 `source_id + sequence` 检测缺口。

### 对外 GUI 影响

IPC、HTTP SSE 和 gRPC 的 wire 格式保持 `zero.api.v1` / `zero.event.v1`，现有 GUI 不需要因本次待发布变更修改帧解析。GUI 仍需遵守 `0.0.15-rc` 建立的快照与增量合并规则。

## `0.0.15-rc`

### Flow 订阅改为“基线 + 增量”

包含任一 flow 生命周期事件的 IPC/SSE/CLI 实时订阅，在订阅确认后先收到 `flow.snapshot`：

1. 使用 `payload.records` **替换**当前活动连接集合；
2. 记录快照 `watermark`；
3. 按 `flow_id + revision` 合并后续 `flow.started`、`flow.routed`、`flow.updated`；
4. 收到 `flow.completed` 后从活动集合移除，并由 GUI 自行保存需要展示的历史；
5. 不把 `recent_flows` 当作断线重建或长期历史数据库。

`flow.snapshot` 是同步基线，不进入事件环，也不会投递到 JSONL/Webhook。`flow.completed.payload.record` 是自包含完成事实，新客户端应优先解析 `record`，同时容忍旧内核没有该字段。

### GUI 兼容分支建议

| 内核版本 | GUI 行为 |
|----------|----------|
| `< 0.0.15-rc` | 使用 `active_flows` 查询作为活动连接基线，并兼容旧 flow payload |
| `>= 0.0.15-rc` | 等待 subscribe ACK 和 `flow.snapshot`，之后按 revision 合并增量 |

## 新增条目的要求

后续每个破坏性或语义性变更必须在发布前补充：

- 首个受影响版本；
- 影响的通道和消费者；
- 旧语义与新语义；
- wire 标识是否变化；
- 兼容窗口和可检测条件；
- GUI/SDK/面板的明确迁移步骤；
- 对应回归测试位置。

开发期间只在版本矩阵和 `## Unreleased` 下登记，不预判最终发布版本，也不写入 Cargo 的 `-dev` 构建号。完整测试通过后，由 `scripts/release.ps1` 或 `scripts/release.sh` 将矩阵行、章节标题和 workspace 版本一起封板；禁止手工分别修改这些位置。
