# 故障排查

按“配置 → 构建能力 → 监听器 → 控制面 → 出站 → 事件投递”的顺序检查，可以避免只盯着最后一条错误。

## 配置无法通过校验

```bash
zero validate config.json
```

重点看错误中的字段路径：

- 未知字段：检查拼写和当前版本文档；
- 引用不存在：检查 outbound、group、rule set 和 tag；
- 协议私有值无效：检查 UUID、密码、cipher、密钥和证书；
- 文件路径失败：相对路径以主配置目录为基准；
- 端口冲突：同一配置内重复监听会在启动前被拒绝。

更多例子见[配置错误处理](./config-failure-examples)。

## 提示协议或能力未编译

查看二进制：

```bash
zero build-info
```

如果 `features` 中没有配置引用的协议或能力，重新构建。例如：

```bash
cargo build --release --features connector,grpc-api
```

不要因为源码目录里存在某个协议，就假定当前二进制已经包含它。

## listener 启动或热更新失败

检查：

1. 地址是否属于当前主机；
2. 端口是否被其他进程占用；
3. 当前用户是否有绑定端口的权限；
4. 证书、规则文件和状态目录是否可访问；
5. 热更新错误是否明确表示已恢复上一份配置。

`config.apply` 失败后先查询状态，确认旧 listener 是否恢复，再提交新的候选配置。

## CLI 找不到运行中的 Zero

CLI 默认连接：

- Linux/macOS：`~/.zero/control.sock`
- Windows：`\\.\pipe\zero-control`

如果运行时使用了自定义路径，CLI 也要传同一个路径：

```bash
zero status --socket /run/zero/control.sock
```

还应确认 Zero 进程仍在运行，以及当前用户有权限访问 socket 或 Named Pipe。

## HTTP 返回 401 或 403

- 确认环境变量已经在 Zero 进程启动前设置；
- 使用 `Authorization: Bearer <token>` 或 `X-Zero-Api-Key: <token>`；
- 不要把 shell 变量名当成实际 token 发送；
- 检查反向代理是否保留认证 header。

远程明文 HTTP 即使认证成功也不会加密 token，必须使用 TLS 代理、VPN 或可信通道。

## gRPC 无法跨主机启动

非 loopback 明文 gRPC 默认 fail-closed。选择一种方案：

- 配置 Zero 原生 TLS；
- 配置 mTLS；
- 在可信代理/VPN 后显式设置 `allow_insecure_remote: true`。

如果关闭 `bearer_auth`，远程访问必须由 mTLS 认证。详见[保护控制接口](./control-security)。

## 代理可以连接但目标不可用

按层检查：

1. `zero flows` 是否出现请求；
2. `zero events` 是否出现 `flow.routed` 和失败事件；
3. 当前 mode、selector 和 route.final 指向哪里；
4. 域名、SNI、证书和协议凭证是否匹配；
5. UDP 请求是否使用了当前协议支持的路径；
6. 中继链中的每一跳是否可达。

先使用[快速开始](./quickstart)的本地 direct 配置确认入站正常，再逐步加入真实代理出站。

## Connector 一直积压

查询：

```bash
zero connector state --json config.json
```

或：

```bash
curl \
  -H "Authorization: Bearer $ZERO_API_KEY" \
  http://127.0.0.1:9090/api/v1/sinks
```

检查：

- URL 是否是接收端提供的完整地址；
- HTTPS 证书是否有效；
- 接收端是否在持久化后返回 `2xx`；
- `429`/`5xx` 是否持续；
- outbox 目录是否可写；
- `write_blocked` 是否因磁盘保留水位触发；
- `replay_gaps` 是否需要外部账本对账。

一个 sink 故障不应阻塞其他 sink。如果健康 sink 也停止，检查 EventDispatcher 是否启动以及二进制是否包含 `connector`。

## 仍无法定位

保存以下信息再报告问题：

- `zero build-info`
- `zero status --json`
- `zero validate config.json` 的完整错误
- 相关日志时间段
- 已脱敏的配置
- 重现步骤和预期结果

不要提交 API key、Webhook header、协议密码、UUID、私钥或证书私钥正文。
