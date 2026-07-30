# 保护控制接口

控制接口可以读取运行状态、关闭连接并应用完整配置。默认应只监听 loopback；需要跨主机访问时，再明确选择传输加密和调用方认证。

## 三条基本规则

1. 不需要远程访问时，监听 `127.0.0.1` 或 `::1`。
2. API key 使用环境变量，不写入仓库。
3. Bearer 只负责认证，不加密网络内容。

## 本机 HTTP/IPC

推荐配置：

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

本地 CLI 使用 IPC，不需要把 HTTP 暴露到局域网。Unix socket 依赖文件权限，Windows Named Pipe 依赖当前系统访问控制。

## 远程 HTTP

Zero 的 HTTP JSON 接口本身不终止 TLS。需要远程 HTTP 时，应在同机反向代理、VPN 或其他受信通道后使用，并同时保留 Bearer：

```text
控制端
  -> HTTPS / VPN
  -> 同机代理或受信网络
  -> Zero HTTP :9090
```

只配置 Bearer 后直接在公网使用明文 HTTP 会暴露 token 和配置内容。

## gRPC 原生 TLS

构建时启用 `grpc-api`，然后在 `api.control.grpc` 中配置证书：

```json
{
  "api": {
    "control": {
      "enabled": true,
      "listen": {
        "address": "0.0.0.0",
        "port": 9090
      },
      "api_key_env": "ZERO_API_KEY",
      "grpc": {
        "bearer_auth": true,
        "tls": {
          "cert_path": "certs/server-cert.pem",
          "key_path": "certs/server-key.pem"
        }
      }
    }
  }
}
```

当 HTTP 监听 `9090` 时，gRPC 使用 `9091`。上述原生 TLS 只保护 gRPC 端口；HTTP `9090` 仍需由防火墙限制，或通过外部 TLS 代理保护。

相对证书路径以主配置文件所在目录为基准。

## gRPC mTLS

要求客户端证书时加入客户端 CA：

```json
{
  "grpc": {
    "bearer_auth": false,
    "tls": {
      "cert_path": "certs/server-cert.pem",
      "key_path": "certs/server-key.pem",
      "client_ca_cert_path": "certs/client-ca.pem"
    }
  }
}
```

`client_ca_cert_path` 启用 mTLS。可以单独使用 mTLS，也可以把 `bearer_auth` 保持为 `true`，同时要求客户端证书和 Bearer。

远程关闭 Bearer 时必须使用 mTLS，避免任何能够连接端口的客户端直接取得管理权限。

## 外部 TLS 终止或可信内网

如果 gRPC 加密由同机代理、服务网格或 VPN 提供，需要显式允许非 loopback 明文：

```json
{
  "grpc": {
    "allow_insecure_remote": true,
    "bearer_auth": true
  }
}
```

这个开关只表示“Zero 到外部终止器之间允许明文”，不是安全增强。原生 `grpc.tls` 与 `allow_insecure_remote: true` 不能同时配置。

## Connector Webhook

Connector 是出站 HTTP 客户端：

- 生产接收地址使用 `https://`；
- `allow_insecure: true` 仅用于明确的测试环境；
- header 中的 token 由接收方定义，Zero 不规定认证方案；
- 接收端仍应以 `event_id` 做幂等处理。

完整字段见[控制面配置](/projects/core/control-plane/configuration#api-control)。
