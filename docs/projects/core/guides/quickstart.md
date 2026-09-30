---
prev:
  text: Zero Core
  link: /projects/core/
next:
  text: 接入远程节点与分流
  link: /projects/core/guides/configuration-basics
---

# 第一次使用 Zero Core {#启动第一个-zero-节点}

这份教程会让一条请求经过你本机的 Zero。你不需要远程服务器或管理员权限；先用直连出口验证程序，再接入自己的代理节点。

## 1. 下载并解压 {#下载发行包}

打开 [Core Releases](https://github.com/zerodenet/core/releases)，在所选发行页下载与你的系统和 CPU 匹配的压缩包，以及同名 `.sha256` 校验文件。发行页会标明是否为预发布版本。

| 系统 | 压缩包 |
|------|--------|
| Linux x86_64，GNU/glibc | `zero-linux-x86_64.tar.gz` |
| Linux x86_64，musl | `zero-linux-x86_64-musl.tar.gz` |
| macOS，Apple Silicon | `zero-darwin-aarch64.tar.gz` |
| macOS，Intel | `zero-darwin-x86_64.tar.gz` |
| Windows x86_64 | `zero-windows-x86_64.zip` |

确认压缩包的 SHA-256 与校验文件一致，然后用系统解压工具解压到自己可写的固定目录。Windows 可右键选择“全部解压”，并保留整个包内的文件，包括 `wintun.dll` 和许可证。

::: details 如何查看 SHA-256

将下列文件名换成你下载的包，并与同名 `.sha256` 文件中的值比较：

- Linux：`sha256sum zero-linux-x86_64.tar.gz`
- macOS：`shasum -a 256 zero-darwin-aarch64.tar.gz`
- Windows PowerShell：`Get-FileHash .\zero-windows-x86_64.zip -Algorithm SHA256`

不一致时不要运行该包，重新从发行页下载。
:::

在 `zero` 或 `zero.exe` 所在目录打开终端，确认程序能运行：

- Linux/macOS：`./zero build-info`
- Windows PowerShell：`.\zero.exe build-info`

能看到构建信息即可继续。后续命令都在这个目录执行，不必先把程序加入 `PATH`。

## 2. 创建配置 {#_1-创建配置}

在同一目录新建 `config.json`，复制下面的完整内容。Windows 注意文件名不要变成 `config.json.txt`。

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
  "route": { "final": { "type": "direct" } }
}
```

这份配置在本机 `127.0.0.1:7890` 提供 SOCKS5 和 HTTP 代理入口，并由本机直接连接目标。它不会改变你的公网出口，也不会自动修改系统代理或接管其他应用。

## 3. 校验并启动 {#_2-先校验}

先校验配置：

```bash
./zero validate config.json
```

Windows PowerShell 使用：

```powershell
.\zero.exe validate .\config.json
```

看到下面的成功信息后再启动；有错误时，先按提示修正文件：

```text
config valid: 1 inbounds, 0 outbounds, 0 groups, 0 rules
```

<span id="_3-启动"></span>

Linux/macOS 启动命令：

```bash
./zero run config.json
```

Windows PowerShell：

```powershell
.\zero.exe run .\config.json
```

保持这个终端开启。Zero 在前台运行不是卡住了；下面的测试请另开一个终端。

## 4. 发出第一条请求 {#_4-验证代理和状态}

Linux/macOS：

```bash
curl --proxy socks5h://127.0.0.1:7890 https://example.com/
```

Windows PowerShell：

```powershell
curl.exe --proxy socks5h://127.0.0.1:7890 https://example.com/
```

看到目标网页内容，就说明这条请求已通过 Zero 的本地入口并成功直连。若提示连接被拒绝，检查运行终端是否退出、端口是否为 7890；若目标超时，检查本机能否访问该网站及 Zero 的错误日志。

你也可以把应用的 HTTP 或 SOCKS5 代理设为 `127.0.0.1:7890`。未设置代理的应用仍使用原来的网络。想接管系统流量，需要另外配置 TUN，先不要为这次测试修改系统路由。

需要确认实例状态时，在另一终端运行 `./zero status`；Windows 使用 `.\zero.exe status`。其他常见问题见[故障排查](./troubleshooting)。

## 5. 停止 {#_5-停止}

如果为应用设置了代理，先关闭该应用的代理设置，再回到运行 `zero run` 的终端按 `Ctrl+C`。否则应用可能继续连接已经停止的本地代理。

## 下一步

继续[接入自己的远程节点](./configuration-basics)：保留本地入口，填入服务端提供的地址、协议和凭证，再把默认路由指向该节点。该教程提供完整配置，并接着说明如何让内网目标直连。
