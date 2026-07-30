# 使用控制 API

Zero 的 CLI、IPC、HTTP 和 gRPC 使用同一组查询与命令。区别主要是连接方式，不是四套不同的管理模型。

## 先选择入口

| 场景 | 推荐入口 |
|------|----------|
| 同机人工操作 | CLI |
| 同机 GUI 或守护程序 | IPC |
| Shell、运维平台、中心控制服务 | HTTP JSON |
| 需要强类型客户端和流式 RPC | gRPC |

Connector 不在这张表中。它是 Zero 主动向外发送事件的能力，不接收管理命令。

## 启用 HTTP 控制接口

在完整配置的 `api` 中加入：

```json
{
  "api": {
    "control": {
      "enabled": true,
      "listen": {
        "address": "127.0.0.1",
        "port": 9090
      },
      "api_key_env": "ZERO_API_KEY"
    }
  }
}
```

启动前设置密钥。

Linux/macOS：

```bash
export ZERO_API_KEY='replace-with-a-long-random-value'
./target/release/zero run config.json
```

Windows PowerShell：

```powershell
$env:ZERO_API_KEY = 'replace-with-a-long-random-value'
.\target\release\zero.exe run .\config.json
```

## 查询状态

```bash
curl \
  -H "Authorization: Bearer $ZERO_API_KEY" \
  http://127.0.0.1:9090/api/v1/runtime
```

常用查询：

| 端点 | 用途 |
|------|------|
| `GET /api/v1/health` | 进程健康 |
| `GET /api/v1/capabilities` | 当前二进制和运行时能力 |
| `GET /api/v1/runtime` | 完整运行状态 |
| `GET /api/v1/stats` | 轻量统计 |
| `GET /api/v1/flows` | 活动流 |
| `GET /api/v1/policies` | selector、url_test 等策略 |
| `GET /api/v1/sinks` | Connector/事件 sink 积压和错误 |
| `GET /api/v1/config` | 面向观测的配置摘要 |

`GET /api/v1/config` 返回的是运行配置摘要，不是可以直接修改后提交的完整 `RuntimeConfig`。需要管理配置的外部系统必须保存自己的完整期望配置，或读取节点受控的配置文件；不要把摘要误当作配置回读接口。

## 执行命令

所有 HTTP 命令发送到 `POST /api/v1/commands`：

```bash
curl \
  -X POST \
  -H "Authorization: Bearer $ZERO_API_KEY" \
  -H "Content-Type: application/json" \
  --data '{
    "method": "mode.set",
    "params": {
      "mode": "direct"
    }
  }' \
  http://127.0.0.1:9090/api/v1/commands
```

常用方法：

- `policies.select`
- `policies.probe`
- `flows.close`
- `mode.set`
- `config.validate`
- `config.apply`
- `config.apply_runtime`
- `diagnostics.probe_target`
- `diagnostics.probe_outbound`

字段和响应见[HTTP API 参考](/projects/core/control-plane/http-api)。

## 应用完整配置

`config.apply` 接收完整配置，不接收局部 patch：

```json
{
  "method": "config.apply",
  "params": {
    "config": {
      "inbounds": [],
      "outbounds": [],
      "route": {
        "rules": [],
        "final": {
          "type": "direct"
        }
      }
    }
  }
}
```

生产控制端应：

1. 在自身存储中维护完整期望配置；
2. 先调用 `config.validate`；
3. 再调用 `config.apply`；
4. 等待 `reconciled: true`；
5. 查询运行状态确认预期 listener、policy 和 sink 已生效。

不要由多个独立写入者各自基于旧副本修改整份配置。Zero 会串行执行本地 apply 并在重建失败时回滚，但当前命令合同没有对外提供 revision/CAS 字段；写入协调属于控制端职责。

## 使用 CLI 和 IPC

同机操作通常不需要开放 HTTP：

```bash
zero status --json
zero flows
zero policies
zero mode rule
zero reload candidate.json
```

CLI 自动连接本地 IPC。GUI 可直接实现 [IPC 帧协议](/projects/core/control-plane/ipc-protocol)。

## 使用 gRPC

构建时加入 `grpc-api`。gRPC 使用 HTTP 控制端口的下一个端口，例如 HTTP 为 `9090` 时 gRPC 为 `9091`。查询与命令语义仍来自 `zero-api`；`Control.Execute` 承载与 HTTP 命令相同的 payload。

跨主机使用前先完成[控制接口安全配置](./control-security)。
