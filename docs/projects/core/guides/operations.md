# 运行与观测

本页给出节点日常检查顺序。先看进程和配置，再看流量与策略，最后检查事件投递。

## 启动前

```bash
zero build-info
zero validate config.json
```

记录 `git_hash`、`features`、`build_profile` 和 `binary_sha256`，它们用于确认当前实际运行的产物。

## 基础健康检查

同机 CLI：

```bash
zero status
zero status --json
```

HTTP：

```bash
curl \
  -H "Authorization: Bearer $ZERO_API_KEY" \
  http://127.0.0.1:9090/api/v1/health
```

健康检查只能证明进程和控制面可响应。继续检查实际 listener、出站和事件状态。

## 查看连接和流量

```bash
zero flows
zero events
```

- `flows` 返回当前活动流；
- `events` 先发送活动流快照，再输出生命周期增量；
- `flow.completed` 是单个流的最终完成事实，适合外部统计和计费。

HTTP 对应端点：

- `GET /api/v1/runtime`
- `GET /api/v1/stats`
- `GET /api/v1/flows`
- `GET /api/v1/flows/{flow_id}`

## 查看和切换策略

```bash
zero policies
zero select proxy direct
zero mode rule
zero mode global proxy
```

`select` 只接受 selector 的直接成员 tag。选择一个 `url_test` 组时，不要把它提前展开为最终节点；组内选择仍由 Zero 的探测状态决定。

## 查看 Connector 和事件 sink

运行中查询：

```bash
curl \
  -H "Authorization: Bearer $ZERO_API_KEY" \
  http://127.0.0.1:9090/api/v1/sinks
```

离线检查配置引用的 Connector 状态：

```bash
zero connector state --json config.json
```

重点字段：

| 字段 | 含义 |
|------|------|
| `pending` | 尚未持久确认的积压 |
| `total_delivered` | 成功投递数量 |
| `total_failed` | 失败尝试数量 |
| `replay_gaps` | 已检测到的事件序列断档 |
| `last_error` | 最近一次投递错误 |
| `outbox_storage.write_blocked` | 磁盘保护是否暂停新的 outbox 写入 |

`pending` 恢复为零不代表 `replay_gaps` 自动消失。出现断档时，外部控制端应使用自己的业务账本对账。

## 日志

开发或首次部署使用 `info`；只在短时间诊断时提高到 `debug` 或 `trace`。日志和事件中不应出现 API key、Webhook token、私钥正文或完整受管材料。

查看当前日志级别和文件位置：

```bash
zero status --json
```

HTTP `GET /api/v1/runtime` 也返回 `log_level` 和 `log_files`。

## 停止与重启

前台运行时使用 `Ctrl+C`。生产环境由进程管理器负责：

- 启动参数和配置路径固定；
- 崩溃后重启；
- 保存 stdout/stderr 和结构化日志；
- 升级前归档旧二进制、配置和状态目录；
- 启动后重新检查 build-info、health、listener 和 sink。

配置热更新与二进制升级是两件事。配置使用[安全热更新](./hot-reload)，二进制升级由部署系统执行。
