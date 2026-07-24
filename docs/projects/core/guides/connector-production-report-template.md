# Connector 生产就绪报告模板

本模板用于阶段 9 签字验收。未填写的项目均视为未通过，外部兼容测试不能替代 Zero 自有能力门槛。

## 构建与环境

- Zero 版本/commit：
- 工作树是否干净：
- 证据等级（development prequalification / release candidate）：
- manifest v4 `production_gate.passed`：
- 候选二进制 SHA-256 / `git_hash`：
- 候选 `build_profile` / feature 集：
- 候选原生合同 ID / SHA-256：
- 运维批准的峰值 RSS 上限：
- 构建 feature：
- 操作系统、CPU、内存、磁盘：
- 配置 SHA-256：
- 资格测试 manifest：
- 升级预检 manifest v2 / `production_gate.passed`：
- 旧版本升级前 `connector state` 报告：
- 候选版本升级前 `connector state` 报告：
- 候选运行后由旧版本生成的 `connector state` 报告：
- 正式升级/回滚报告 `zero.connector.production-upgrade-report.v1`：
- 三方批准报告 `zero.connector.production-approval.v1`：
- 候选自产的聚合门禁报告 `zero.connector.production-gate.v1`：

签字版报告只接受 manifest v4 中 `evidence_grade=release_candidate` 且 `production_gate.passed=true` 的结果；其中的候选 SHA-256、`git_hash` 和原生合同哈希必须与实际部署产物一致。开发态预资格结果用于提前发现问题，不能替代最终发布候选验收。外部面板或客户端的兼容结果只作为独立适配器/黑盒证据，不参与 Zero 原生能力门禁的定义。

## Zero 自有能力验收

| 能力 | 证据 | 结果 |
| --- | --- | --- |
| Adapter SPI 与 fail-closed 投影 | | |
| 用户 revision/cursor 与确认式 ACK | | |
| TCP/UDP/MUX/QUIC 主体清退 | | |
| device/rate/quota 执行与恢复 | | |
| `flow.completed` 计费与持久 outbox | | |
| 命令防重放与凭据轮换 | | |
| 背压、重启、响应丢失和状态损坏 | | |
| listener 失败回滚与 last-known-good | | |

## 容量结果

- 事件总数：
- 配置最短持续时间/实际持续时间：
- 平均/最低 events/s：
- 重启次数：
- 峰值 RSS / `rss_supported`：
- 峰值 outbox：
- 最终 pending/dead letter：
- 丢失/重复（按 `event_id`）：

## 面板适配器验收

| Adapter | 面板版本/commit | 专用测试节点 | 支持子集 | 已知限制 | 结果 |
| --- | --- | --- | --- | --- | --- |
| Reference | | | | | |
| 独立兼容桥（如有） | | | | 不进入 Zero 原生产物门禁 | |

## 黑盒线协议验收

记录客户端/服务端二进制版本、TCP、UDP、认证失败、在线用户变更、关闭与重连结果。该表只验证外部可用性，不改变 Zero 核心模型。

## 故障与恢复演练

- 面板断网/恢复：
- 请求到达但响应丢失：
- 节点重启：
- outbox/state 损坏：
- 配额写盘失败：
- 升级：
- 回滚：
- 候选运行后旧版本能否读取全部 connector/quota 状态：
- 升级窗口账务对账：

## 剩余风险与回退

- 未支持字段/组合：
- 外部协议限制：
- 数据丢失或重复风险：
- 触发回滚的指标：
- last-known-good 版本与恢复时间目标：

## 签字

- 开发负责人：
- 运维负责人：
- 账务/业务负责人：
- 验收日期：
- 结论：通过 / 有条件通过 / 不通过

只有候选执行 `zero connector production-gate` 并输出 `passed=true` 后，结论才允许填写“通过”。聚合器输入格式见[正式升级报告模板](/projects/core/guides/connector-production-upgrade-report.template.json)和[三方批准模板](/projects/core/guides/connector-production-approval.template.json)。
