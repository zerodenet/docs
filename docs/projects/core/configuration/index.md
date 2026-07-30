# 配置参考

Zero 使用一个完整 JSON 文件描述入站、出站、路由、运行参数和可选管理能力。这里提供面向使用者的字段地图；具体协议字段请从[协议配置示例](/projects/core/protocols/configuration)开始。

## 顶层结构

```json
{
  "inbounds": [],
  "outbounds": [
    {
      "tag": "direct",
      "protocol": { "type": "direct" }
    },
    {
      "tag": "block",
      "protocol": { "type": "block" }
    }
  ],
  "outbound_groups": [],
  "runtime": {},
  "api": {},
  "mode": { "type": "rule" },
  "route": {
    "rule_sets": [],
    "rules": [],
    "url_rewrite": [],
    "final": { "type": "direct" }
  }
}
```

| 字段 | 是否必需 | 用途 |
|------|----------|------|
| `inbounds` | 是 | 监听地址与入站协议 |
| `outbounds` | 是 | 直连、阻断或代理出站 |
| `outbound_groups` | 否 | 手动选择、自动测速、故障切换、链式代理或负载均衡 |
| `mode` | 否 | `rule`、`direct` 或 `global`；默认 `rule` |
| `route` | 否 | 规则集、匹配规则、URL 改写与默认去向 |
| `runtime` | 否 | DNS、超时、事件日志、网络和状态持久化 |
| `api` | 否 | 控制接口、事件投递、outbox 和 hooks |

未知字段会被拒绝。修改后先运行：

```bash
zero validate config.json
```

## 入站与出站

每个入站和出站都必须有唯一 `tag`。其他配置通过 tag 引用它们：

```json
{
  "inbounds": [
    {
      "tag": "mixed-in",
      "listen": { "address": "127.0.0.1", "port": 7890 },
      "protocol": { "type": "mixed" }
    }
  ],
  "outbounds": [
    {
      "tag": "direct",
      "protocol": { "type": "direct" }
    }
  ]
}
```

协议凭证写在对应协议的原生字段中，例如 VLESS/VMess 的 `id`、Trojan 的 `password`。Connector 不引入另一套用户或凭证模型。

## 模式与路由

`rule` 模式先匹配 `route.rules`，未命中时执行 `route.final`：

```json
{
  "mode": { "type": "rule" },
  "route": {
    "rules": [
      {
        "condition": {
          "type": "domain",
          "values": ["internal.example"]
        },
        "action": { "type": "direct" }
      }
    ],
    "final": {
      "type": "route",
      "outbound": "proxy"
    }
  }
}
```

`global` 模式需要指定出站或出站组：

```json
{
  "mode": {
    "type": "global",
    "outbound": "proxy"
  }
}
```

可用规则、规则集与 ZRS 语法见[规则能力参考](/projects/core/reference/zero-rule-ir-v1)。

## runtime

多数部署可以先省略 `runtime`。常用项包括：

| 字段 | 用途 |
|------|------|
| `event_log_capacity` | 内存中保留的事件条数 |
| `udp_upstream_idle_timeout_seconds` | UDP 上游空闲超时 |
| `latency_test_url` | 通用出站延迟探测地址 |
| `dns` | DNS 服务器、缓存、路由与 Fake IP |
| `network.mtu` | 用户态网络栈 MTU |

涉及路径的字段以主配置文件所在目录为基准。配置、证书、运行状态和日志建议分开存放。

## api

`api` 中的能力彼此独立：

- `control`：HTTP/IPC 控制面的监听与认证。
- `event_sinks`：零到多个事件投递目标；Webhook 地址是接收方提供的完整 URL。
- `outbox`：Connector 可靠投递、积压与磁盘保护策略。
- `hooks`：事件触发的本地命令。

启用某个 Cargo feature 只代表二进制包含该能力；是否运行仍由配置决定。管理节点时使用 Zero API、IPC 或 gRPC；Connector 只投递事件，不是第二套管理 API。

## 安全修改配置

控制面提交的是完整候选配置，不是局部补丁：

```bash
zero validate candidate.json
zero reload candidate.json
zero status --json
```

成功表示候选配置已经完成运行时应用；应用失败会返回错误并尝试保留上一份可用状态。外部控制器应保存自己的完整 desired state，并避免多个写入方并发覆盖。

继续阅读：

- [配置基础](/projects/core/guides/configuration-basics)
- [安全热更新配置](/projects/core/guides/hot-reload)
- [运行模式与出站组](./modes-and-groups)
- [控制面配置合同](/projects/core/control-plane/configuration)
