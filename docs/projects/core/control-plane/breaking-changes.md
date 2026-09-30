# 控制面兼容性与版本约定

本页供控制端集成与升级使用。Core 的正式版、候选版和开发线独立核对，不能把其他项目的版本号作为内核能力依据。当前下载入口与渠道说明见[版本与使用限制](/progress)。

## 0.0.1 配置与能力基线

以下记录 V1 配置与能力发现约定，不表示后续所有修复都进入了 v0.0.1 下载包。

- 配置支持 `schema_version: 1`；未知版本拒绝，缺省按 V1。
- DNS 使用命名 `servers`、`default_server`、`dispatch`、`policy` 和 `answer`；Fake-IP 位于 `answer.type: "fake_ip"`。配置方式见 [DNS 参数](../configuration/dns)。
- 能力响应通过 `contracts` 报告独立兼容范围，权限不足使用 `insufficient_os_privilege` 错误码，见[通用契约](./contract)。
- TUN 状态报告实际捕获范围、地址族出口及配置归属；IPC 失败不能解释为关闭。详见 [HTTP TUN 状态](./http-api#get-api-v1-tun-status)。
- Connector 状态区分投递和 ACK 重试阶段，见[投递调度](./connector#查看投递调度与恢复状态)。
- `route.bypass` 写入前检查 `route_bypass_v1`；[直连例外](../configuration/modes-and-groups#直连例外-route-bypass)优先于全局和规则模式。
- Direct 入站支持 UDP，部署时检查对应构建能力；仅需 TCP 时显式设置 `udp.enabled: false`。

升级时同时核对发行 tag、提交和实际 capability。产品版本、配置 `schema_version`、API V1 和事件 V1 是不同标识。

## 已发布版本的升级注意事项

截至 2026-09-30，通用使用说明按已发布 RC [v0.0.2-rc.202609290540 / 2d75265](https://github.com/zerodenet/core/tree/2d7526596e91ea1259c3692501a02672ca826cfd)核对；[v0.0.1](https://github.com/zerodenet/core/releases/tag/v0.0.1)仍是正式发行版。

- RC 的 VMess 历史私有 `cipher: zero` 需迁移为 `zero-plus`；当前 `zero` 为 Xray 标准 NONE 无分块语义，升级前协调两端
- RC 的 VLESS Vision 不再只有早期 REALITY TCP 路径，UDP/443 策略和传输限制见[能力参考](../reference/protocol-capabilities#vless-组合边界)
- RC 的 URLTest 测速成功不等于业务隔离已解除；单节点诊断不修改策略，见[探测语义](../guides/proxy-and-urltest#自动策略与单节点诊断)
- WireGuard 仅在已发布 dev `v0.0.3-dev.202609281319` 中提供实验能力，RC 没有该 feature；配置 V1 未变不代表两者支持相同协议

以目标发行物的配置校验和[RC 发布兼容记录](https://github.com/zerodenet/core/blob/2d7526596e91ea1259c3692501a02672ca826cfd/release/breaking-changes.md)为准。未发布 develop 修复不能计入下载包的升级结果。

## 消费者如何判断兼容性

连接内核后依次检查：

1. `health.engine_build_id`，确认实际运行的构建；
2. `capabilities.api_id` 和 `capabilities.schema_id`，确认请求与事件信封；
3. `contracts` 中的兼容区间，以及 `features`、构建特性和协议能力矩阵；
4. 实际使用的协议方向、传输、权限和 `limitations`。

同一产品版本的构建仍可能裁剪不同能力，不能仅凭产品版本号启用功能。

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

Connector 使用通用 Webhook 事件投递。控制器通过 Zero API/gRPC 管理节点，并通过 `config.apply` 注册 `api.event_sinks`；Connector 向完整 URL 发送 `zero.event.v1`，按 HTTP 确认规则处理重试和恢复。

Connector 不提供节点注册、套餐、支付、订阅或中心私有命令 API。配置不能使用开发期的顶层 `push` 或固定中心协议。

事实事件使用有界工作集，配置 outbox 时持久化并按空位恢复；`flow.updated`、`stats.sampled` 是可丢弃采样，不作为可靠账务事实。重试和背压参数以当前 [Connector 配置](./connector)为准。

## 构建与主体策略

公开 Cargo feature 使用 `status-api`、`event-dispatcher`、`sink-jsonl`、`connector`、`grpc-api` 等名称。Rust 函数和模块仍使用 `snake_case`；完整选项见[构建特性](../configuration/features)。

同一主体策略下的并发 TCP/UDP 会话共享双向速率控制；不能把主体限速理解为每条连接都各自获得完整额度。没有 `principal_key` 的入站默认限速仍按会话执行。验收主体限速时应覆盖并发连接。

## 后续文档维护

后续兼容性变更应根据实际发布记录注明产品版本、影响的通道、契约标识、可检测条件和操作步骤，并附实现与测试依据。未发布实现使用提交标识说明范围，不推测发行编号；功能可用性始终结合实际构建能力判断。
