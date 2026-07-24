# Connector 生产运维手册

本文只覆盖 Zero 自有 connector 的生产运行、计费事实保护和恢复，不描述某个面板产品的内部部署。connector 仅实现 `zero.panel.v1`；不采用原生合同的面板方言由面板侧独立兼容桥处理。

稳定版 tag 只会自动生成 GitHub Release 草稿。发布负责人核对本文全部 Zero 原生证据、正式升级/回滚记录、账务对账和三方签字后才能人工公开草稿并设置 latest；不得用 CI fixture、开发态预资格 manifest 或 Xboard 黑盒结果代替签字材料。带后缀的候选版本可自动发布为 prerelease，但不代表机场生产就绪。

## 1. 生产目录与所有权

推荐将程序、配置、密钥和运行状态分开：

```text
/opt/zero/releases/<version>/zero       只读版本化二进制
/opt/zero/current                      当前版本链接
/etc/zero/config.json                  本地所有的完整配置
/etc/zero/secrets/                     仅服务账号可读的 token/TLS 私钥
/var/lib/zero/connector/               connector 持久状态
/var/log/zero/                         服务日志和资格测试记录
```

以下文件必须放在持久磁盘，并由同一个 Zero 实例独占：

- event dispatcher `outbox_path` 与 `dead_letter_path`
- panel traffic `traffic_outbox_path`
- user/node-config revision 与 ETag state
- command replay state
- alive checkpoint
- `runtime.principal_quota_state_path`

不要把这些文件放入临时目录、容器可写层或多实例共享目录。配置和状态目录权限建议为服务账号 `0700`，密钥文件为 `0600`。

每个文件还必须只有一个逻辑所有者：JSONL event sink、event outbox、dead letter、traffic outbox、command replay、user/node cursor、主体配额和 `api_key_file` 不得复用同一路径。`zero validate` 会在相对配置目录解析并规范化路径后拒绝冲突，Windows 同时拒绝只改变大小写的别名。

JSONL event sink、dead letter 与可恢复状态会在相邻的 `<state>.zero.lock` 上持有跨进程 lease。相同配置的第二个 Zero 进程会 fail fast，而不是交错写入、并发消费或覆盖状态；服务退出或进程崩溃后 lease 由 OS 释放。不要手工删除正在运行实例的锁文件；停机后留下的锁文件可保留，接管进程会重新取得并复用它。

## 2. 启动前检查

每次部署都执行：

```bash
/opt/zero/releases/<version>/zero validate /etc/zero/config.json
/opt/zero/releases/<version>/zero build-info
/opt/zero/releases/<version>/zero connector state --json /etc/zero/config.json \
  > /var/log/zero/connector-state-<version>.json
```

确认：

- connector 与所用协议 feature 已编译；
- 候选使用 `build_profile: release`；
- `build-info` 的 `git_hash` 与获批源码 commit 一致；
- 控制 API 默认只监听 localhost、内网或受保护的 Unix socket；
- 面板 URL 使用 HTTPS，HTTP 仅限隔离测试并显式 `allow_insecure`；
- token 使用环境变量或原子替换的 `api_key_file`，不写入日志和命令行；
- 所有 state/outbox 路径可写，所在磁盘有足够空间；
- `connector state` 返回 `compatible: true`；`incompatible` 必须中止升级，`recoverable_partial_tail` 表示 outbox 尾部存在启动时可安全截断的未完成帧；
- `node_id`、sink `source_id` 和面板登记一致；
- 只有声明的 managed inbound 允许被 connector 更新。

## 3. 启动与健康门槛

启动后至少观察两个心跳周期。生产放量前应同时满足：

1. 进程健康，托管入站可建立真实 TCP/UDP 会话。
2. `panel-control` 已完成节点注册，最近一次请求成功。
3. 启用节点配置同步时，`panel-config.pending == 0`。
4. 所有计费 sink 的 `pending` 能收敛到 `0`，`last_error` 为空。
5. 用户同步 revision 已落盘；面板 ACK 不早于运行时 reconcile。
6. quota、command replay、traffic outbox 和 event outbox 均可读取。

通过受保护的控制 API 查看 sink：

```bash
curl -H "Authorization: Bearer ${ZERO_NODE_CONTROL_KEY}" \
  http://127.0.0.1:9090/api/v1/sinks
```

首次接入机场自有面板时，必须使用隔离的专用节点运行 Zero 原生合同验收。该命令会重复注册节点、确认用户 revision、写入一条零字节计费事实，并以空集合替换该节点的在线快照，因此必须显式确认写操作，禁止指向承载生产用户的节点：

```powershell
zero connector contract > zero-panel-v1.openapi.json

zero connector conformance `
  --allow-writes `
  --principal-key account:conformance `
  --json `
  C:\zero\conformance-config.json
```

验收配置必须同时启用 command、node config、user、traffic 和 alive 全部原生能力。成功报告的 `schema_id` 为 `zero.panel.conformance-report.v2`、`contract_id` 为 `zero.panel.v1`，内嵌执行候选的 build ID、`git_hash`、profile、feature 集和由进程自算的二进制 SHA-256，且 registration、heartbeat、commands、node_config、users、traffic、alive 七项均为 `passed`。命令在验收结束后再次哈希当前可执行文件，执行期间字节发生变化就拒绝出报告。报告与同一 SHA-256 候选二进制及面板侧请求/事务日志一起归档。

## 4. 告警建议

至少建立下列告警：

| 信号 | 建议触发条件 | 处置 |
| --- | --- | --- |
| connector 注册失败 | 连续 2 分钟未成功 | 检查凭据、节点身份、DNS/TLS 和面板可用性 |
| sink `pending` | 持续 5 分钟增长或不下降 | 检查面板响应、outbox 磁盘和重试错误 |
| `total_failed` | 5 分钟窗口有增量 | 按 `last_error` 区分 4xx 配置错误、429 背压和 5xx 故障 |
| dead letter | 文件出现新记录 | 暂停账单结算并人工核对，不能直接删除 |
| outbox/状态磁盘 | 剩余空间低于 20% | 扩容或迁移；不得以删除未 ACK 记录释放空间 |
| panel config | `pending != 0` 或 `last_error` 非空 | 保持 last-known-good，检查候选端口和字段支持 |
| 配额状态 | 启动失败或写盘失败 | 保持 fail closed，先恢复状态存储 |
| 流量对账 | Zero 完成流与面板入账持续不一致 | 以 `event_id` 去重并核对原始完成流 |

## 5. 备份与恢复

一致性备份顺序：

1. 暂停新流量或停止 Zero 服务。
2. 记录当前二进制版本、配置哈希和 Git/release 标识。
3. 备份完整 `/etc/zero` 与 `/var/lib/zero/connector`。
4. 对备份生成 SHA-256 清单。
5. 恢复演练时先恢复状态和配置，再启动相同版本二进制。

禁止只备份配置而遗漏 outbox、revision、command replay 或 quota 状态。损坏的换行终止 journal 会令服务 fail closed；不要手工跳过中段记录。保留原件，在隔离副本上分析和修复。

## 6. 计费对账

`flow.completed` 是 Zero 的最终计费事实。面板必须以 `event_id` 建唯一索引，在同一数据库事务中保存原始事件并累计字节。

每日对账至少比较：

- Zero outbox 的 put/ack 与 pending 数；
- 面板按 `source_id` 接收的唯一 `event_id` 数；
- `principal_key` 为空或未知的隔离记录；
- Zero 完成流字节和面板入账字节；
- dead letter 与长期 pending 记录。

请求到达面板但响应丢失会导致 at-least-once 重投；重复事件不能重复计费。

## 7. 升级

1. 运行 connector 资格测试并归档 manifest。
2. 备份配置、密钥引用和全部持久状态。
3. 把新二进制安装到新的版本目录，不覆盖旧版本。
4. 使用旧、新二进制分别执行 `validate`、`build-info` 和 `connector state --json`，两者都必须能只读解析当前状态。
5. 排空或停止旧进程，原子切换 `current` 链接后启动新进程。
6. 执行第 3 节健康门槛，并验证一条带 `principal_key` 的完成流能够入账。
7. 候选版本至少完成一次 user/node revision、command replay、quota checkpoint 和计费 ACK 后，停止候选版本，再用旧二进制运行 `connector state --json`；旧版本无法读取时必须在变更窗口内按第 8 节恢复一致性备份。
8. 观察至少两个心跳周期和一个计费批次后再结束变更窗口。

升级期间不得同时运行两个实例消费同一 state/outbox 目录；候选若误指向旧实例仍持有的状态，会因 `.zero.lock` lease 冲突而拒绝启动。

仓库提供双二进制只读预检与证据归档：

```powershell
./scripts/connector-upgrade-preflight.ps1 `
  -PreviousBinary C:\zero\releases\0.0.14\zero.exe `
  -CandidateBinary C:\zero\releases\0.0.15\zero.exe `
  -ConfigPath C:\zero\config.json `
  -ProductionGate
```

脚本记录两个二进制与配置的 SHA-256、`build-info`、`validate`、状态报告和 stderr，并拒绝相同二进制、状态格式降级或任一非兼容结果。升级预检 manifest v2 只有在显式 `-ProductionGate` 下才标记为 `release_candidate`；此时会拒绝 `-AllowSameBinary`、相同 build ID、非 release 候选、缺失机场 feature、候选自报 SHA 与外部哈希不一致，或候选未输出 `zero.panel.v1` 原生合同。未指定生产门禁时结果固定为 `development_prequalification`；`-AllowSameBinary` 仅用于验证脚本自身。

仓库还提供默认忽略的 Zero 原生黑盒升级演练。它启动仓库内置的原生 panel fixture 与 echo 服务，让旧版写入 command、node cursor、user revision、quota 和逐事件计费状态，再依次执行候选接管、旧版只读复查和旧版回滚开流：

```powershell
$env:ZERO_UPGRADE_PREVIOUS_BINARY = 'C:\zero\releases\0.0.14\zero.exe'
$env:ZERO_UPGRADE_CANDIDATE_BINARY = 'C:\zero\releases\0.0.15\zero.exe'
$env:ZERO_UPGRADE_OUTPUT_DIRECTORY = 'C:\zero\evidence\upgrade-20260723'

cargo test --all-features --test connector_upgrade_drill -- --ignored --nocapture
```

演练拒绝字节相同的二进制，要求注册版本呈现“旧版 → 候选 → 旧版”，三代进程各自产生一条获得精确 ACK 的 `flow.completed` 计费事实，并要求三个事件具有不同的 128 位引擎启动 epoch。manifest、两版状态报告和每代进程日志写入指定输出目录。

这个自动化用例通过强制进程替换验证崩溃恢复边界，证据等级固定为 `development_prequalification`。生产签字仍必须使用两个正式发布产物，按本节流程完成排空或优雅停止、备份、实际服务切换和人工对账；不能把 fixture 演练升级为生产证据。

## 8. 回滚

触发条件包括：监听器无法恢复、用户同步无法推进、计费 pending 持续增长、状态格式读取失败或核心流量回归。

1. 停止新版本，不删除任何状态文件。
2. 保存失败版本日志、配置、outbox 和状态副本。
3. 先用旧版本执行 `connector state --json`。只有报告兼容时才原子切回旧二进制并启动。
4. 如果状态格式不兼容，恢复升级前的一致性备份；把升级后新增完成流单独保留并人工对账，不能丢弃。
5. 重跑健康门槛，确认 last-known-good 入站、用户 revision 和计费 pending。

回滚成功不等于账务闭环；必须核对升级窗口内的所有 `event_id`。

`connector state` 是纯只读检查，不启动 connector、不联系面板、不截断 outbox。它使用各状态所有者的真实反序列化器检查 event/traffic outbox、dead letter、命令防重放账本、node ETag、user revision、文件凭据和 engine quota v1。中段 journal 损坏、未知 JSON 字段、未知 quota 版本、同一主体重复 quota 余额或不可读文件均返回非零；报告不会输出凭据内容。

## 9. 长稳资格测试

仓库提供与面板实现无关的 Zero connector 资格测试。它持续写入 `flow.completed`，在有界内存与持久 outbox 下重复重启 dispatcher，最后验证零丢失和已 ACK 事实不重投。

PowerShell：

```powershell
./scripts/connector-qualification.ps1 `
  -EventCount 100000 `
  -RestartCycles 10 `
  -OutageEventCount 10000 `
  -TimeoutSeconds 900 `
  -MinimumDurationSeconds 3600 `
  -ProductionGate `
  -MaxPeakRssBytes <运维批准的字节上限> `
  -CandidateBinary C:\zero\releases\0.0.15\zero.exe
```

`release_candidate` 不是由“当前恰好干净”自动推断，而是显式的 `-ProductionGate` 结果。门禁在运行前拒绝脏工作树、低于上述生产最小负载、未提供 RSS 上限或未提供候选二进制的请求。候选必须通过自身的 `build-info` 暴露与当前源码 commit 一致的 `git_hash`、与外部哈希一致的 `binary_sha256`、`release` profile，以及 `panel_connector`、计费事件和五个机场主流协议所需 feature，并输出 Zero 原生 `zero.panel.v1` 合同。生产资格测试本身也固定使用 Cargo release profile。运行后再次核对 commit、工作树、测试摘要、实际持续时间、峰值 RSS、候选 SHA-256、build identity 和合同哈希均未变化。未指定 `-ProductionGate` 的短测或开发态长测始终标记为 `development_prequalification`，即使工作树干净也不能用于签字。

隔离构建环境可以追加 `-Offline`，并通过可重复的 `-CargoConfig <cargo --config 值>` 覆盖依赖源；这些选项会进入 manifest。生产运行使用的本地源必须与候选构建的依赖锁定证据一起归档。

直接运行：

```bash
ZERO_CONNECTOR_SOAK_EVENTS=100000 \
ZERO_CONNECTOR_SOAK_RESTARTS=10 \
ZERO_CONNECTOR_SOAK_TIMEOUT_SECONDS=900 \
ZERO_CONNECTOR_SOAK_MIN_SECONDS=3600 \
cargo test -p zero-connector --all-features \
  --test qualification_soak \
  --test qualification_outage \
  -- --ignored --nocapture
```

长稳事件源按时间水位惰性生成，不预先持有完整事件集；实时订阅与 `since` 可靠回放看到同一水位。独立采样线程每 50ms 覆盖生成、持久化、重启与最终恢复窗口。manifest v4 记录运行前后 source 快照、候选产物身份、Zero 原生合同哈希、生产门禁结论、配置的最短时长、实际 elapsed、events/s、进程峰值 RSS、峰值 outbox 和 sink 大小。当前 Windows 与 Linux 支持 RSS 采样；不支持的平台会明确写 `rss_supported=false`，生产门禁会拒绝该结果，不能把 `0` 当作内存通过。

第二个资格用例会先让 webhook 完全不可用，确认全部 backlog 已持久化且产生失败计数，再启动面板端点并要求 pending 收敛、所有 `event_id` 唯一到达、无 dead letter，最后重启验证不重投。

归档日志、manifest、二进制版本、主机规格、磁盘类型、峰值 outbox 大小和 events/s。一次短 smoke 不能替代生产规格下的长稳运行。

## 10. 聚合生产证据并签字

实际服务切换与回滚完成后，按[正式升级报告模板](/projects/core/guides/connector-production-upgrade-report.template.json)记录两个正式二进制、状态备份、revision/ACK、command replay、quota checkpoint、逐事件计费 ACK、旧版重读候选状态、回滚和账务对账。每个 `checks` 字段都必须由真实操作记录支持；自动化 fixture 使用强制进程替换，因此不能生成这份报告。附件使用相对报告目录的路径，至少包含 `previous_binary`、`previous_state_after_candidate` 和 `billing_reconciliation`；聚合器会读取真实文件并复算 SHA-256，绝对路径、`..` 逃逸、缺失文件或仅填写摘要都会被拒绝。

开发、运维、账务/业务负责人分别按[批准模板](/projects/core/guides/connector-production-approval.template.json)填写姓名、时间与 `approved` 决策。模板中的版本、commit、SHA-256、时间和证据摘要全部必须替换，不允许保留占位值。

最后必须由正在验收的候选二进制执行：

```powershell
C:\zero\releases\0.0.15\zero.exe connector production-gate `
  --qualification C:\zero\evidence\qualification.json `
  --conformance C:\zero\evidence\reference-conformance.json `
  --upgrade-preflight C:\zero\evidence\upgrade-preflight.json `
  --live-upgrade C:\zero\evidence\production-upgrade-report.json `
  --approval C:\zero\evidence\production-approval.json `
  --json | Set-Content -Encoding utf8 C:\zero\evidence\production-gate.json
```

聚合器复算自身 SHA-256，并要求五份材料都绑定当前 release 候选与同一 `zero.panel.v1` 原生合同。它重新检查 10 万事件、10 次重启、1 万断供事件、至少 1 小时、RSS 上限、七项 Reference conformance、正式双版本差异、优雅停机、回滚、账务对账和三个唯一批准角色。任意开发态 manifest、脏源码资格结果、候选哈希错配、缺项/重复签字或外部适配器报告都会返回非零。

成功输出的 `zero.connector.production-gate.v1` 报告包含五份输入文件的 SHA-256；将它与原始证据一起归档后，才可以人工公开稳定版 Release 草稿。面板侧独立兼容桥的验收另行归档，不进入 Zero 原生产物门禁。
