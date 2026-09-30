---
prev:
  text: 接入远程节点与分流
  link: /projects/core/guides/configuration-basics
next:
  text: 故障排查
  link: /projects/core/guides/troubleshooting
---

# 运行与观测

代理启动后，日常最常做的是确认请求经过哪里、切换出站、更新配置以及安全停止。本页使用同机 CLI，不要求开放 HTTP API。

## 连接运行中的实例 {#启动前}

以下命令在代理运行时的另一个终端执行。还没有运行实例时，先完成[第一次使用](./quickstart)。未加入 `PATH` 时用 `./zero`、`.\zero.exe` 或可执行文件的完整路径替代 `zero`；自定义 IPC 的实例在查询命令后附加相同的 `--socket PATH`。

## 基础健康检查

```bash
zero status
zero status --json
```

先确认这是预期实例：核对构建、当前模式、入站监听和错误。能返回状态只代表进程和控制接口能响应；还要从实际应用发起一次请求。

使用 TUN 时另查 `zero tun status`，同时看 `running`、`healthy`、地址族出口与 `last_error`。详见[TUN 使用指南](./tun-and-dns)。

## 查看连接和流量

先开启事件输出，再复现请求：

```bash
zero events
```

在另一个终端或应用中请求目标。核对 `flow.routed` 的目标、入站标签和最终出站；失败时看对应完成事件的错误。按 `Ctrl+C` 只结束这个事件查看命令，不会停止另一个终端里的 Zero。

查看仍在进行的连接：

```bash
zero flows
```

很快结束的请求可能已经不在活动列表中，所以“列表为空”不能单独证明请求没经过 Zero。事件订阅先给出当前活动流快照，再输出后续变化。

## 查看和切换策略

```bash
zero policies
```

只有配置中存在 `selector` 组时才能手动选它的成员。例如已有 `proxy` 组，且 `node-b` 是其直接成员：

```bash
zero select proxy node-b
```

不要照抄不存在的 tag，也不要把普通出站当作 selector。完整组配置见[运行模式与出站组](../configuration/modes-and-groups)。

切换运行模式时，用已经配置的出站或组 tag：

```bash
zero mode rule
zero mode global proxy
```

`rule` 按规则分流，`global proxy` 将未命中直连例外的新连接交给 `proxy`。切换后发起新请求确认；现有连接不会自动迁移。若选择的成员本身是 URLTest 组，组内节点仍由内核决定。

## 日志

通常保持 `info`；仅在短时间排查时提高到 `debug` 或 `trace`。`zero status --json` 可查看当前日志级别和文件位置；前台运行的第一条错误也应保留。

共享诊断信息前删除 API key、Webhook token、协议凭证和私钥。报告问题需要的材料见[故障排查](./troubleshooting#仍无法定位)。

## 停止与重启

先关闭仍指向 Zero 的应用/系统代理设置，再在运行 `zero run` 的终端按 `Ctrl+C`。使用 TUN 时检查原路由恢复；不要通过删除系统路由或清空防火墙代替正常停止。

修改配置通常不必重启：

```bash
zero validate candidate.json
zero reload candidate.json
zero status --json
```

`candidate.json` 必须是完整配置。成功后重试实际请求；失败后先确认旧状态是否保留，见[安全热更新](./hot-reload)。

长时间运行时由合适的进程管理器固定启动参数、保存日志并处理崩溃重启。二进制升级仍需备份并替换程序，不属于配置热更新，见[安装与升级](./installation#更新源码)。

## 查看 Connector 和事件 sink

::: details 仅配置了外部事件投递时需要

运行中可通过已启用的 HTTP API 查询：

```bash
curl -H "Authorization: Bearer $ZERO_API_KEY" \
  http://127.0.0.1:9090/api/v1/sinks
```

离线检查配置引用的本地持久投递状态：

```bash
zero connector state --json config.json
```

关注 `pending`、`last_error`、`outbox_storage.write_blocked` 和 `replay_gaps`。积压变为零不代表历史断档已经补齐；处理方式见[Connector Webhook 接入](./connector-integration)。
:::
