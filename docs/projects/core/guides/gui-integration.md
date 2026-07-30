# GUI 接入指南

GUI 是 Zero 通用控制面的客户端，不需要理解 Connector、面板协议或内核内部模块。桌面应用优先使用本地 IPC；远程控制按部署条件选择 HTTP 或 gRPC。

## 选择连接方式

| 场景 | 推荐入口 | 原因 |
|------|----------|------|
| GUI 与 Zero 同机 | IPC | 不占网络端口，可使用操作系统本地权限边界 |
| 受控局域网管理 | HTTP | 简单，便于调试和接入 |
| 跨主机强类型客户端 | gRPC | 原生 TLS/mTLS，可生成客户端 |

远程明文控制只适合已经由可信隧道保护的网络。Bearer token 只负责认证，不负责传输加密。

## 启动与连接

启动 Zero 并指定本地控制入口：

```bash
zero run --control-socket /run/zero/control.sock config.json
```

Windows 使用命名管道路径。HTTP 监听由配置或 `--status-listen` 指定：

```bash
zero run --status-listen 127.0.0.1:9090 config.json
```

具体地址和认证项见[控制面安全](/projects/core/guides/control-security)。

## 首次连接顺序

1. 查询 `health`，确认进程存活并记录 `engine_build_id`。
2. 查询 `capabilities`，按当前发行物实际能力启用界面。
3. 查询 `config`、`runtime`、`stats` 和 `policies`，建立初始视图。
4. 建立 `subscribe` 长连接，接收快照和后续事件。
5. 断线重连后重新拉取查询快照，不依赖本地增量状态猜测内核现状。

IPC 一行一个 JSON 请求：

```json
{"type":"query","id":1,"request":{"health":{}}}
```

响应：

```json
{
  "api_id": "zero.api.v1",
  "ok": true,
  "id": 1,
  "result": {
    "health": {
      "engine_build_id": "build-id",
      "healthy": true
    }
  }
}
```

`request` 是 externally tagged 对象，不是字符串。完整帧格式见[IPC 协议](/projects/core/control-plane/ipc-protocol)。

## 页面与数据源

| 页面 | 首次查询 | 后续事件 |
|------|----------|----------|
| 总览 | `health`、`runtime`、`stats` | `stats.sampled`、`engine.warning` |
| 活动连接 | `active_flows` | `flow.snapshot`、`flow.started`、`flow.updated`、`flow.completed` |
| 出站策略 | `policies` | `policy.selected`、`policy.probe.completed` |
| 配置 | `config` | `config.changed` |
| 事件投递 | `sinks` | `engine.warning` |
| TUN | `tun_status` | `engine.warning` |

未知事件类型应忽略或作为原始 JSON 保留，不要让新版内核事件导致旧 GUI 崩溃。

## 编辑配置

GUI 必须维护自己的完整配置草稿：

1. 用户编辑本地草稿。
2. 调用 `config.validate`。
3. 校验成功后启用“应用”操作。
4. 用户确认后调用 `config.apply`，提交相同的完整 JSON。
5. 成功后重新查询 `config` 和 `runtime`。

`config` 查询是摘要视图，不能反序列化后直接当作完整配置写回。节点本身也没有外部配置 revision/CAS；同一节点应只有一个配置写入协调者。

配置应用是运行时事务。监听形状变化会重建对应监听器；可热更新的凭证变化走协议热更新；失败会返回错误并尝试保留上一份可用状态。控制接口自身的地址和认证变化仍需重启。

## 切换模式和出站

运行模式与 selector 都有独立命令，不需要改写完整配置：

```json
{
  "type": "command",
  "id": 2,
  "method": "mode.set",
  "params": {
    "mode": "global",
    "outbound": "proxy"
  }
}
```

```json
{
  "type": "command",
  "id": 3,
  "method": "policies.select",
  "params": {
    "policy_tag": "proxy",
    "target_tag": "node-b"
  }
}
```

命令只影响之后建立的连接。界面应等待成功响应，再更新已选择状态。

## 错误与兼容

- 根据机器可读 `error.code` 分支，`message` 只用于展示。
- 先读取 `engine_build_id` 和 `capabilities`，不要假设所有发行物都有相同 feature。
- 不要把未知字段、事件或枚举直接当作致命错误。
- 配置失败时保留用户草稿和上一份已知可用配置。
- 对接多个内核版本时阅读[破坏性变更](/projects/core/control-plane/breaking-changes)。

HTTP、IPC 和 gRPC 最终使用同一套 `zero.api.v1` 命令与查询语义。Connector 不参与 GUI 到节点的管理链路。
