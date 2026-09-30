---
prev:
  text: 第一次使用
  link: /projects/core/guides/quickstart
next:
  text: 运行与观测
  link: /projects/core/guides/operations
---

# 接入远程节点与分流 {#配置基础}

完成[第一次使用](./quickstart)后，本页继续把本地直连测试改成远程代理，并加入一条内网直连规则。保持 `127.0.0.1:7890` 入口不变，应用无需重新配置代理地址。

## 配置由什么组成

第一次使用中的 `inbounds` 是应用连接的本地入口，`route` 决定请求去哪。现在增加 `outbounds`，把远程代理节点命名为 `proxy`，再让默认路由指向它。

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

如果第一次使用的实例仍占用 7890 端口，先在它的终端按 `Ctrl+C` 停止。后续用 `zero` 简写程序路径；未加入 `PATH` 时仍使用 `./zero` 或 `.\zero.exe`。校验成功后再启动：

```bash
zero validate proxy.json
zero run proxy.json
```

另开终端运行 `curl --proxy socks5h://127.0.0.1:7890 https://example.com/`（Windows 使用 `curl.exe`）。想核对实际出站，可以先运行 `zero events` 再重试请求；已结束的请求不会一直留在 `zero flows` 活动列表中。

对端使用 REALITY、WebSocket、Trojan 或其他协议时，保留这份配置的入口和路由结构，用[协议配置示例](../protocols/configuration)替换 `outbounds` 中的协议条目。不要把单个条目保存为完整配置。

## 选择流量去向

上面的配置已把请求全部交给 `proxy`。如果希望内网域名直连、其他目标仍走代理，用下面的顶层片段替换完整配置中的 `mode` 和 `route`，保留 `inbounds` 与 `outbounds`。将 `internal.example` 换成自己的内网域名：

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

## 修改配置的安全顺序

把加入分流规则后的完整配置另存为 `candidate.json`，保持刚才的代理进程运行，然后执行：

```bash
zero validate candidate.json
zero reload candidate.json
zero status --json
```

`reload` 提交完整候选配置，不是局部补丁。成功响应会等待监听器和相关应用服务完成重建；失败时会尝试恢复上一份运行配置。控制接口自身的监听地址和凭证不能在线自替换，需要显式重启。

修改后再发起新请求确认分流结果。更新失败时的检查顺序见[安全热更新配置](./hot-reload)。

::: details 配置涉及证书或其他文件时

## 路径如何解析

证书、规则文件、outbox 和日志等相对路径以主配置文件所在目录为基准。生产部署建议把配置和状态分开：

```text
/etc/zero/config.json
/etc/zero/certs/
/var/lib/zero/
/var/log/zero/
```

私钥、API key 和 Webhook header 不应进入公开仓库。控制 API key 优先使用 `api_key_env` 从环境变量读取。

:::

## 继续使用

接下来用[运行与观测](./operations)查看连接、切换节点和处理日志。只有需要接管未设置代理的应用时，才继续配置 [TUN](./tun-and-dns)。
