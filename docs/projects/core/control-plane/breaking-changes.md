# 控制面兼容性与版本约定

Zero Core、ZNet Sink 和 Zboard 的产品版本统一为 **0.0.1**，Git Release tag 使用 `v0.0.1`。本页以 0.0.1 为当前基线，说明 GUI、SDK、面板、事件 Sink 和进程内 Rust 集成需要遵守的契约。

## 0.0.1 配置与能力基线

- 配置支持 `schema_version: 1`；未知版本拒绝，缺省按 V1。
- DNS 使用命名 `servers`、`default_server`、`dispatch`、`policy` 和 `answer`；Fake-IP 位于 `answer.type: "fake_ip"`。配置方式见 [DNS 参数](../configuration/dns)。
- 能力响应通过 `contracts` 报告独立兼容范围，权限不足使用 `insufficient_os_privilege` 错误码，见[通用契约](./contract)。
- TUN 状态报告实际捕获范围、地址族出口及配置归属；IPC 失败不能解释为关闭。详见 [HTTP TUN 状态](./http-api#get-api-v1-tun-status)。
- Connector 状态区分投递和 ACK 重试阶段，见[投递调度](./connector#查看投递调度与恢复状态)。
- `route.bypass` 写入前检查 `route_bypass_v1`；[直连例外](../configuration/modes-and-groups#直连例外-route-bypass)优先于全局和规则模式。
- Direct 入站支持 UDP，部署时检查对应构建能力；仅需 TCP 时显式设置 `udp.enabled: false`。

这些能力统一归入 0.0.1，不沿用编号重置前的发布矩阵或最低版本门槛。源码与安装验收范围见[实现进度](/progress)。

## 消费者如何判断兼容性

连接内核后依次检查：

1. `health.engine_build_id`，确认实际运行的构建；
2. `capabilities.api_id` 和 `capabilities.schema_id`，确认请求与事件信封；
3. `contracts` 中的兼容区间，以及 `features`、构建特性和协议能力矩阵；
4. 实际使用的协议方向、传输、权限和 `limitations`。

同为 0.0.1 的构建仍可能裁剪不同能力，不能仅凭产品版本号启用功能。

| 标识 | 当前含义 | 与产品版本的关系 |
| --- | --- | --- |
| `api_id: zero.api.v1` | 控制面请求与响应信封 | 独立契约版本 |
| `schema_id: zero.event.v1` | 事件信封 | 独立契约版本 |
| `schema_version: 1` | 配置结构版本 | 独立配置版本 |
| `engine_build_id` | 实际内核构建标识 | 用于定位运行构建，结合能力响应判断兼容性 |

新增可选字段、事件类型和 capability 通常保持向前兼容；消费者应容忍未知可选字段与事件。产品版本重置不改变这些协议标识。

## 事件订阅与恢复

包含 flow 生命周期事件的实时订阅，在订阅确认后先用 `flow.snapshot` 建立活动连接基线：

1. 用 `payload.records` 替换当前活动连接集合并记录 `watermark`；
2. 按 `flow_id + revision` 合并 `flow.started`、`flow.routed`、`flow.updated`；
3. 收到 `flow.completed` 后移除活动连接，使用其自包含的 `payload.record` 记录完成事实；
4. 发现事件缺口时，通过快照或 Query 重建状态，不直接继续套用增量。

`flow.snapshot` 不进入事件环，也不投递到 JSONL/Webhook；`recent_flows` 不替代断线重建或长期历史数据库。完整字段与通道行为见[事件目录](./events)。

进程内 `EventSource::subscribe()` 返回实现 `EventStream` 的实时订阅；`latest()` 用于近期历史，`since()` 用于游标恢复。`has_gap = true` 时应重新建立基线。

引擎生成的事件 ID 使用启动时随机 epoch 保持跨启动唯一；重放保持原 ID。外部消费者把 `event_id` 当作不透明字符串进行幂等去重，使用正式字段读取事件类型、flow ID 和时间，不解析 ID 的内部拼接格式。

## Connector 与控制端边界

0.0.1 使用通用 Webhook 事件投递。控制器通过 Zero API/gRPC 管理节点，并通过 `config.apply` 注册 `api.event_sinks`；Connector 向完整 URL 发送 `zero.event.v1`，按 HTTP 确认规则处理重试和恢复。

Connector 不提供节点注册、套餐、支付、订阅或中心私有命令 API。配置不能使用开发期的顶层 `push` 或固定中心协议。

事实事件使用有界工作集，配置 outbox 时持久化并按空位恢复；`flow.updated`、`stats.sampled` 是可丢弃采样，不作为可靠账务事实。重试和背压参数以当前 [Connector 配置](./connector)为准。

## 构建与主体策略

公开 Cargo feature 使用 `status-api`、`event-dispatcher`、`sink-jsonl`、`connector`、`grpc-api` 等名称。Rust 函数和模块仍使用 `snake_case`；完整选项见[构建特性](../configuration/features)。

同一主体策略下的并发 TCP/UDP 会话共享双向速率控制；不能把主体限速理解为每条连接都各自获得完整额度。没有 `principal_key` 的入站默认限速仍按会话执行。验收主体限速时应覆盖并发连接。

## 后续文档维护

后续兼容性变更应根据实际发布记录注明产品版本、影响的通道、契约标识、可检测条件和操作步骤，并附实现与测试依据。未发布实现使用提交标识说明范围，不推测发行编号；功能可用性始终结合实际构建能力判断。
