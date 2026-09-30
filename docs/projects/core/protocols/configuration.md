# 协议配置示例

下面的 JSON 都是单个 inbound 或 outbound 条目，需要放入完整配置的对应数组。替换示例地址、端口和凭证后，始终运行 `zero validate`。

## 本地入站

### Mixed

```json
{
  "tag": "mixed-in",
  "listen": {
    "address": "127.0.0.1",
    "port": 7890
  },
  "protocol": {
    "type": "mixed"
  }
}
```

Mixed 同时接受 SOCKS5 TCP、SOCKS5 UDP ASSOCIATE、HTTP CONNECT 和标准 HTTP forward-proxy 请求。

### SOCKS5

```json
{
  "tag": "socks-in",
  "listen": {
    "address": "127.0.0.1",
    "port": 1080
  },
  "protocol": {
    "type": "socks5",
    "users": [
      {
        "username": "alice",
        "password": "replace-me"
      }
    ]
  }
}
```

省略 `users` 时使用 SOCKS5 no-auth。只在 loopback 或其他受信边界内使用无认证入口。

### HTTP CONNECT

```json
{
  "tag": "http-in",
  "listen": {
    "address": "127.0.0.1",
    "port": 8080
  },
  "protocol": {
    "type": "http"
  }
}
```

## 服务端协议入站

### VLESS TLS

```json
{
  "tag": "vless-in",
  "listen": {
    "address": "0.0.0.0",
    "port": 443
  },
  "protocol": {
    "type": "vless",
    "users": [
      {
        "id": "11111111-2222-3333-4444-555555555555"
      }
    ],
    "tls": {
      "cert_path": "certs/fullchain.pem",
      "key_path": "certs/privkey.pem"
    }
  }
}
```

### VMess TLS

```json
{
  "tag": "vmess-in",
  "listen": {
    "address": "0.0.0.0",
    "port": 443
  },
  "protocol": {
    "type": "vmess",
    "users": [
      {
        "id": "11111111-2222-3333-4444-555555555555",
        "cipher": "aes-128-gcm"
      }
    ],
    "tls": {
      "cert_path": "certs/fullchain.pem",
      "key_path": "certs/privkey.pem"
    }
  }
}
```

### Trojan

```json
{
  "tag": "trojan-in",
  "listen": {
    "address": "0.0.0.0",
    "port": 443
  },
  "protocol": {
    "type": "trojan",
    "users": [
      {
        "password": "replace-me"
      }
    ],
    "tls": {
      "cert_path": "certs/fullchain.pem",
      "key_path": "certs/privkey.pem"
    }
  }
}
```

### Shadowsocks

```json
{
  "tag": "ss-in",
  "listen": {
    "address": "0.0.0.0",
    "port": 8388
  },
  "protocol": {
    "type": "shadowsocks",
    "cipher": "chacha20-ietf-poly1305",
    "users": [
      {
        "password": "replace-me"
      }
    ]
  }
}
```

### Hysteria2

```json
{
  "tag": "hy2-in",
  "listen": {
    "address": "0.0.0.0",
    "port": 8443
  },
  "protocol": {
    "type": "hysteria2",
    "users": [
      {
        "password": "replace-me"
      }
    ],
    "cert_path": "certs/fullchain.pem",
    "key_path": "certs/privkey.pem"
  }
}
```

### Mieru

```json
{
  "tag": "mieru-in",
  "listen": {
    "address": "0.0.0.0",
    "port": 2999
  },
  "protocol": {
    "type": "mieru",
    "users": [
      {
        "username": "alice",
        "password": "replace-me"
      }
    ]
  }
}
```

## 客户端代理出站

### VLESS TLS

```json
{
  "tag": "vless-out",
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

### VLESS REALITY + Vision

```json
{
  "tag": "vless-reality-vision-out",
  "protocol": {
    "type": "vless",
    "server": "edge.example.com",
    "port": 443,
    "id": "11111111-2222-3333-4444-555555555555",
    "flow": "xtls-rprx-vision",
    "reality": {
      "public_key": "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA",
      "short_id": "0123456789abcdef",
      "server_name": "www.cloudflare.com",
      "client_fingerprint": "chrome"
    }
  }
}
```

此示例要求对端开启对应 REALITY/Vision 服务，并替换服务器、UUID、公钥、short ID 和服务名。示例公钥仅用于展示字段，不能用于连接真实节点。

配置 Vision 时注意：

- Vision 可以使用原始 TLS 1.3、REALITY 或 VLESS Encryption 提供的可切换承载；TLS 1.2 不提供 Vision 直通；
- 不能与普通 TCP `mux_concurrency` 组合；
- UDP 使用 XUDP，标准 Vision 默认拒绝 UDP/443；出站 `flow: "xtls-rprx-vision-udp443"` 可允许该端口，线上仍使用标准 Vision flow；
- `reality.client_fingerprint` 默认 `chrome`，也有其他家族和版本化选项；
- `zero-aead-v1` 是 Zero 私有迁移格式，不与 Xray Vision 互通。

这些行为不能反推到早期二进制。先查[当前能力与限制](../reference/protocol-capabilities)，再用实际版本执行配置校验和对端测试。

### VMess

对第三方 VMess 节点使用双方支持的标准 cipher。`zero` 为 Xray 标准无分块 NONE 语义；历史 Zero 私有格式已命名为 `zero-plus`，升级旧 Zero 对端时必须协调两端，不能直接混用。

```json
{
  "tag": "vmess-out",
  "protocol": {
    "type": "vmess",
    "server": "node.example.com",
    "port": 443,
    "id": "11111111-2222-3333-4444-555555555555",
    "cipher": "aes-128-gcm",
    "mux_concurrency": 8
  }
}
```

### Trojan

```json
{
  "tag": "trojan-out",
  "protocol": {
    "type": "trojan",
    "server": "node.example.com",
    "port": 443,
    "password": "replace-me",
    "sni": "node.example.com",
    "insecure": false
  }
}
```

### Shadowsocks

```json
{
  "tag": "ss-out",
  "protocol": {
    "type": "shadowsocks",
    "server": "node.example.com",
    "port": 8388,
    "cipher": "chacha20-ietf-poly1305",
    "password": "replace-me"
  }
}
```

### Hysteria2

```json
{
  "tag": "hy2-out",
  "protocol": {
    "type": "hysteria2",
    "server": "node.example.com",
    "port": 443,
    "password": "replace-me",
    "insecure": false
  }
}
```

### Mieru

```json
{
  "tag": "mieru-out",
  "protocol": {
    "type": "mieru",
    "server": "node.example.com",
    "port": 2999,
    "username": "alice",
    "password": "replace-me"
  }
}
```

### 上游 SOCKS5

```json
{
  "tag": "socks-out",
  "protocol": {
    "type": "socks5",
    "server": "127.0.0.1",
    "port": 1081,
    "username": "upstream",
    "password": "replace-me"
  }
}
```

## 内置出站

```json
{
  "tag": "direct",
  "protocol": {
    "type": "direct"
  }
}
```

```json
{
  "tag": "block",
  "protocol": {
    "type": "block"
  }
}
```

`direct` 和 `block` 是 Zero 内置动作，不是外部代理协议。

## Direct 固定目标转发

Direct 入站支持原始 TCP，以及具备 `managed-datagram-runtime` 构建能力时的 UDP 转发。它不执行落地代理协议的认证，适合把入口端口转发到既有服务：

```json
{
  "tag": "entry",
  "listen": { "address": "127.0.0.1", "port": 10000 },
  "udp": { "enabled": true },
  "protocol": { "type": "direct", "target": "landing.example.com", "port": 443 }
}
```

转发经过既有路由、出站策略和流量生命周期。启用 UDP 时同时绑定该端口的 TCP/UDP；UDP 端口被占用会使绑定失败，不会静默降级。只需 TCP 时显式设置 `udp.enabled: false`。UDP 还受 `runtime.udp.enabled` 全局开关约束；部署前通过 `zero build-info` 确认 `direct.inbound.udp.supported`，仅能解析该字段不代表二进制具备转发能力。

## 传输和高级字段

VLESS、VMess 等协议还支持 TLS、REALITY、WebSocket、gRPC、H2、QUIC、HTTP Upgrade、XHTTP、MUX 和 UDP 相关组合。不要仅凭字段存在就任意叠加；组合限制见[完整配置字段](/projects/core/configuration/)和[协议能力矩阵](/projects/core/reference/protocol-capabilities)。

完成配置后：

```bash
zero validate config.json
zero run config.json
```
