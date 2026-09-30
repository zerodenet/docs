# 配置基础

Zero 使用 JSON 配置。推荐从一个能够通过 `zero validate` 的完整文件开始，每次只修改一个部分并重新校验。

## 配置由什么组成

最常用的顶层字段：

| 字段 | 用途 |
|------|------|
| `schema_version` | 配置契约版本；省略按 `1`，未知版本会拒绝 |
| `inbounds` | Zero 在哪里接收连接，以及使用什么入站协议 |
| `outbounds` | 直连、阻断或远程代理节点 |
| `outbound_groups` | selector、url_test、fallback、relay 和负载均衡 |
| `mode` | direct、global 或 rule |
| `route` | 匹配条件与最终去向 |
| `runtime` | 日志、DNS、超时和网络参数 |
| `api` | 控制接口、事件 sink、outbox 和 hooks |

字段名和嵌套层级必须准确。未知字段通常会被拒绝，而不是静默忽略。

## 加入一个代理出站

下面是一份完整的 VLESS TLS 客户端配置。先向你的服务提供方确认服务器、端口、UUID、传输方式和服务名；不能把其他协议的订阅地址当成 `server` 填入。

把实际参数替换进去，保存为 `proxy.json`：

```json
{
  "schema_version": 1,
  "inbounds": [
    {
      "tag": "mixed-in",
      "listen": { "address": "127.0.0.1", "port": 7890 },
      "protocol": { "type": "mixed" }
    }
  ],
  "outbounds": [
    {
      "tag": "proxy",
      "protocol": {
        "type": "vless",
        "server": "node.example.com",
        "port": 443,
        "id": "11111111-2222-3333-4444-555555555555",
        "tls": {
          "server_name": "node.example.com",
          "insecure": false
        }
      }
    }
  ],
  "route": { "final": { "type": "route", "outbound": "proxy" } }
}
```

这里 `mixed-in` 是应用连接的本地入口，`proxy` 是 Zero 要连接的远程服务器，`route.final` 把未匹配其他规则的流量交给它。示例地址和 UUID 不能用于真实连接，也不要通过关闭证书校验来掩盖服务名错误。

```bash
zero validate proxy.json
zero run proxy.json
```

如果快速开始的实例仍在使用 7890 端口，先停止旧实例，或按[热更新流程](./hot-reload)将完整配置应用给旧实例。另开终端运行 `curl --proxy socks5h://127.0.0.1:7890 https://example.com/`，并用 `zero flows` / `zero events` 确认使用了 `proxy` 出站。

对端使用 REALITY、WebSocket、Trojan 或其他协议时，保留这份配置的入口和路由结构，用[协议配置示例](../protocols/configuration)替换 `outbounds` 中的协议条目。不要把单个条目保存为完整配置。

## 选择流量去向

以下是需要合并到完整配置的顶层片段。先保留上一步的 `inbounds` 和 `outbounds`，再替换对应字段。

全部走某个出站：

```json
{
  "mode": {
    "type": "global",
    "outbound": "proxy"
  }
}
```

按规则分流：

```json
{
  "mode": {
    "type": "rule"
  },
  "route": {
    "rules": [
      {
        "condition": {
          "type": "domain",
          "values": ["internal.example"]
        },
        "action": {
          "type": "direct"
        }
      }
    ],
    "final": {
      "type": "route",
      "outbound": "proxy"
    }
  }
}
```

`route.final` 必须明确表达未命中规则时的行为。引用的出站 tag 必须存在。

## 路径如何解析

证书、规则文件、outbox 和日志等相对路径以主配置文件所在目录为基准。生产部署建议把配置和状态分开：

```text
/etc/zero/config.json
/etc/zero/certs/
/var/lib/zero/
/var/log/zero/
```

私钥、API key 和 Webhook header 不应进入公开仓库。控制 API key 优先使用 `api_key_env` 从环境变量读取。

## 修改配置的安全顺序

```bash
zero validate candidate.json
zero reload candidate.json
zero status --json
```

`reload` 提交完整候选配置，不是局部补丁。成功响应会等待监听器和相关应用服务完成重建；失败时会尝试恢复上一份运行配置。控制接口自身的监听地址和凭证不能在线自替换，需要显式重启。

详细流程见[安全热更新配置](./hot-reload)，所有字段见[配置参考](/projects/core/configuration/)。

需要 DNS 分流或 Fake-IP 时使用[命名服务器参数](../configuration/dns)，不要沿用旧的 `runtime.dns.fake_ip` 形状；应配置 `runtime.dns.answer.type: "fake_ip"`。透明代理的安装、网段接管与验证见[运行 TUN 与 DNS](./tun-and-dns)。
