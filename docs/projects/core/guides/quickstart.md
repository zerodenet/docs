# 启动第一个 Zero 节点

本页使用一个仅监听本机、直接出站的配置验证安装结果。它不需要准备远程服务器、UUID 或密码，因此可以先确认 Zero 本身工作正常，再添加真实代理节点。

先按[安装指南](./installation)下载并解压 Zero。以下命令在可执行文件所在目录运行；源码构建用户把 `./zero` 换成 `./target/release/zero`，Windows 对应使用 `.\target\release\zero.exe`。

## 1. 创建配置

在同一目录新建 `config.json`（不是 `config.json.txt`）：

```json
{
  "schema_version": 1,
  "inbounds": [
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
  ],
  "outbounds": [
    {
      "tag": "direct",
      "protocol": {
        "type": "direct"
      }
    },
    {
      "tag": "block",
      "protocol": {
        "type": "block"
      }
    }
  ],
  "route": {
    "rules": [
      {
        "condition": {
          "type": "domain",
          "values": ["blocked.example"]
        },
        "action": {
          "type": "route",
          "outbound": "block"
        }
      }
    ],
    "final": {
      "type": "route",
      "outbound": "direct"
    }
  }
}
```

这个 Mixed 入站同时接受 SOCKS5、HTTP CONNECT 和普通 HTTP 代理请求。它只监听 `127.0.0.1:7890`，不会向局域网公开代理端口。出口是本机直连，因此这一步验证代理入口，不会隐藏或改变你的公网出口。

## 2. 先校验

Linux/macOS：

```bash
./zero validate config.json
```

Windows PowerShell：

```powershell
.\zero.exe validate .\config.json
```

成功时会显示：

```text
config valid: 1 inbounds, 2 outbounds, 0 groups, 1 rules
```

如果校验失败，不要直接启动。根据错误中的字段路径修正配置，或查看[配置错误处理](./config-failure-examples)。

## 3. 启动

Linux/macOS：

```bash
./zero run config.json
```

Windows PowerShell：

```powershell
.\zero.exe run .\config.json
```

Zero 默认以前台进程运行。保持这个终端开启，再打开第二个终端进行验证。

## 4. 验证代理和状态

通过 Mixed 入站发起一次 SOCKS5 请求：

```bash
curl --proxy socks5h://127.0.0.1:7890 https://example.com/
```

看到目标网页内容即表示这一条请求已经过 Mixed 入站并成功直连。Windows PowerShell 请使用 `curl.exe` 运行相同参数。

也可以把应用的 HTTP 或 SOCKS5 代理设置为 `127.0.0.1:7890`。Zero 启动不会自动修改系统代理；未设置代理的应用仍走原来的网络。

查看运行状态：

```bash
./zero status
```

Windows：

```powershell
.\zero.exe status
```

CLI 会自动连接本地 IPC。Linux/macOS 默认使用可执行文件旁的 `control.sock`（无法定位可执行目录时才回退到 `~/.zero/control.sock`），Windows 默认使用 `\\.\pipe\zero-control`。

如果请求失败，先看运行终端的第一条错误：连接被拒绝通常需要检查 Zero 是否运行、端口是否相同；配置校验成功不代表外网目标一定可达。更多检查见[故障排查](./troubleshooting)。

## 5. 停止

如果为应用设置了代理，先关闭该应用的代理设置，再回到运行 Zero 的终端并按 `Ctrl+C`。生产环境应由 systemd、Windows 服务管理器或其他进程管理器负责启动、停止和崩溃重启。

## 下一步

- [配置基础](./configuration-basics)：加入真实代理出站和路由。
- [协议配置](/projects/core/protocols/)：选择 VLESS、VMess、Trojan、Shadowsocks、Hysteria2 等协议。
- [运行与观测](./operations)：查看 flow、事件、日志和策略状态。
- [使用控制 API](./control-api)：为脚本或外部服务启用 HTTP/gRPC。
