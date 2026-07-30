# 配置基础

Zero 使用 JSON 配置。推荐从一个能够通过 `zero validate` 的完整文件开始，每次只修改一个部分并重新校验。

## 配置由什么组成

最常用的顶层字段：

| 字段 | 用途 |
|------|------|
| `inbounds` | Zero 在哪里接收连接，以及使用什么入站协议 |
| `outbounds` | 直连、阻断或远程代理节点 |
| `outbound_groups` | selector、url_test、fallback、relay 和负载均衡 |
| `mode` | direct、global 或 rule |
| `route` | 匹配条件与最终去向 |
| `runtime` | 日志、DNS、超时和网络参数 |
| `api` | 控制接口、事件 sink、outbox 和 hooks |

字段名和嵌套层级必须准确。未知字段通常会被拒绝，而不是静默忽略。

## 加入一个代理出站

下面是 VLESS TLS 出站片段。把服务器、端口、UUID 和 SNI 换成实际值后加入 `outbounds`：

```json
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
```

VLESS、VMess、Trojan 等协议只使用各自实际线协议接受的凭证字段，不需要额外创建一套 Connector 用户标识。

其他协议的字段和示例见[协议配置](/projects/core/protocols/)。

## 选择流量去向

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
