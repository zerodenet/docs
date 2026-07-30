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

Mixed 同时接受 SOCKS5 TCP、SOCKS5 UDP ASSOCIATE 和 HTTP CONNECT。

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

### VMess

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

## 传输和高级字段

VLESS、VMess 等协议还支持 TLS、REALITY、WebSocket、gRPC、H2、HTTP Upgrade、XHTTP、MUX 和 UDP 相关组合。不要仅凭字段存在就任意叠加；组合限制见[完整配置字段](/projects/core/configuration/)和[协议能力矩阵](/projects/core/reference/protocol-capabilities)。

完成配置后：

```bash
zero validate config.json
zero run config.json
```
