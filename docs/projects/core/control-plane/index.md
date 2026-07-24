# 控制与集成

Zero 通过 HTTP JSON API、gRPC、Unix Domain Socket / Windows Named Pipe、CLI 和事件 Sink 提供统一的查询、命令、事件与诊断能力。本节是 GUI、CLI、面板和外部服务对接 Zero 的正式契约入口。

## 快速导航

| 文档 | 说明 |
|------|------|
| [configuration.md](/projects/core/control-plane/configuration) | `api.*` 配置模型完整参考 |
| [http-api.md](/projects/core/control-plane/http-api) | HTTP JSON 端点规范 |
| [ipc-protocol.md](/projects/core/control-plane/ipc-protocol) | UDS / Named Pipe 帧协议 |
| [events.md](/projects/core/control-plane/events) | 事件目录和 payload 规范 |
| [hooks.md](/projects/core/control-plane/hooks) | FlowHook 扩展点 |
| [push-connector.md](/projects/core/control-plane/push-connector) | 节点主动上报与远程命令 |
| [zero-panel-v1.openapi.json](/projects/core/control-plane/zero-panel-v1.openapi.json) | Zero 原生机场面板 OpenAPI 3.1 合同 |
| [cli.md](/projects/core/control-plane/cli) | CLI 控制命令 |
| [contract.md](/projects/core/control-plane/contract) | API 契约和外部命名规则 |
| [breaking-changes.md](/projects/core/control-plane/breaking-changes) | 版本语义、破坏性变更和 GUI 迁移要求 |
| [GUI 接入指南](/projects/core/guides/gui-integration) | 本地 GUI 的 IPC/HTTP 接入流程、状态模型和短期补齐建议 |
| [机场面板接入指南](/projects/core/guides/panel-integration) | 节点心跳、用户归因、流量计费、Webhook 与远程运维闭环 |
| [Connector 生产运维手册](/projects/core/guides/connector-operations) | 生产目录、告警、备份恢复、对账、升级回滚和长稳资格测试 |

## 架构概览

```
┌─────────────────────────────────────────────────────┐
│                    GUI / CLI / 面板                    │
├──────────┬──────────┬──────────┬──────────┬─────────┐
│  HTTP    │  gRPC    │   UDS    │   CLI    │  Panel  │
│  :9090   │  :9091   │ .sock    │  zero    │Connector│
├──────────┴──────────┴──────────┴──────────┴─────────┤
│                   EngineHandle                       │
│  ┌──────────┐ ┌──────────┐ ┌──────────────────────┐ │
│  │  Query   │ │ Command  │ │     EventSource      │ │
│  │ Service  │ │ Service  │ │  (SSE / IPC / Sink)  │ │
│  └──────────┘ └──────────┘ └──────────────────────┘ │
├─────────────────────────────────────────────────────┤
│                      Engine                          │
│  ┌──────────┐ ┌──────────────┐ ┌─────────────────┐  │
│  │  Router  │ │ Session Reg  │ │   Event Log     │  │
│  └──────────┘ └──────────────┘ └─────────────────┘  │
└─────────────────────────────────────────────────────┘
```

图中的通道共享控制面数据模型，但适配职责不同：GUI 通过 IPC/HTTP/gRPC 直接使用查询、命令和实时事件；EventDispatcher 订阅 `EventSource` 后向 JSONL/Webhook Sink 做过滤、序列化和可靠投递；Panel Connector 读取心跳汇总、通过 `CommandService` 接收远程命令，并可单独消费 flow 事件生成面板原生计费批次和在线 IP 快照。详见 [Push Connector 的职责边界](/projects/core/control-plane/push-connector#与-gui-和事件-sink-的职责边界)。

## 四种通道对比

| 维度 | HTTP | gRPC | IPC (UDS/Pipe) | CLI |
|------|------|------|----------------|-----|
| 传输 | TCP | HTTP/2 | Unix Domain Socket / Named Pipe | UDS / Named Pipe |
| 认证 | Bearer token | Bearer token | 文件系统权限 (0600) | 文件系统权限 |
| 查询 | `GET /api/v1/*` | proto RPC | `{"type":"query","id":1,...}` | `zero status/flows/policies` |
| 命令 | `POST /api/v1/commands` | proto RPC | `{"type":"command","id":1,...}` | `zero select <p> <t>` |
| 事件流 | SSE (`text/event-stream`) | server streaming | JSON-line 推送 | `zero events` |
| 适用场景 | 远程调试、Web 面板 | 服务端集成、SDK | 本地 GUI 进程 | 终端管理 |
| 默认端口/路径 | 127.0.0.1:9090 | 127.0.0.1:9091 | `~/.zero/control.sock` / `\\.\pipe\zero-control` | 自动发现 |

## 核心设计原则

1. **内核通用** — API 不绑定任何特定面板或平台，所有消费者平等
2. **能力原语** — 暴露原子能力（查询、切换、关闭），业务逻辑在外部
3. **多通道一致** — HTTP、gRPC、IPC、CLI 四种通道共享相同的语义和数据模型
4. **安全后置** — 本地默认无认证（文件权限隔离），远程使用 Bearer token，mTLS 可选
5. **事件驱动** — 所有状态变更以归一化事件推送，支持 SSE、IPC 流、Sink 投递三种消费方式

## GUI 对接重点

本地 GUI 优先使用 IPC，HTTP 作为浏览器 WebView 或远程调试备选。GUI 首屏应先查询 `health`、`capabilities`、`config`、`runtime`，再建立事件订阅；重连后用 `runtime` / `stats` 重建界面状态。配置编辑应先走 `config.validate`，成功后再调用 `config.apply`。

短期对 GUI 最有价值的内核能力是机器可读契约、配置影响预检、结构化校验诊断、DNS/路由解释、日志流和更完整的 flow/policy 事件。这些能力应作为 Zero 内核通用控制面原语设计，不引入面板业务概念。

## 最小可用配置

```text
{
  "inbounds": [...],
  "outbounds": [...],
  "route": {...},
  "api": {
    "control": {
      "enabled": true,
      "listen": { "address": "127.0.0.1", "port": 9090 }
    }
  }
}
```

启动后即可通过 HTTP 或 IPC 访问控制平面：

```bash
# HTTP
curl http://127.0.0.1:9090/api/v1/runtime

# CLI (自动连接 ~/.zero/control.sock)
zero status
zero select proxy direct
zero events
```
