# 安装与构建

直接使用 Zero 不需要安装 Rust。先下载与你的操作系统和 CPU 匹配的发行包；只有需要定制构建或测试开发线时才从源码编译。

## 下载发行包

在 [Core Releases](https://github.com/zerodenet/core/releases) 选择一个明确的版本，再下载压缩包及同名 `.sha256` 文件。

截至 2026-09-30，[v0.0.1](https://github.com/zerodenet/core/releases/tag/v0.0.1) 是正式发行版，[v0.0.2-rc.202609290540](https://github.com/zerodenet/core/releases/tag/v0.0.2-rc.202609290540) 是候选版。本教程的配置和能力按上述已发布 RC 核对。带 `rc` 或 `dev` 的版本用于测试，不能按正式版理解。开发分支合入修复不代表已发布的压缩包也包含修复。

| 系统 | 文件 |
|------|------|
| Linux x86_64，GNU/glibc | `zero-linux-x86_64.tar.gz` |
| Linux x86_64，musl | `zero-linux-x86_64-musl.tar.gz` |
| macOS，Apple Silicon | `zero-darwin-aarch64.tar.gz` |
| macOS，Intel | `zero-darwin-x86_64.tar.gz` |
| Windows x86_64 | `zero-windows-x86_64.zip` |

校验压缩包的 SHA-256 与同名校验文件一致，再解压到一个固定目录。Windows 请保留包内的 `wintun.dll` 和许可证，不要只移动 `zero.exe`；普通本地代理不需要 TUN 权限。

## 确认可运行

在解压后的可执行文件所在目录打开终端。

Linux/macOS：

```bash
./zero build-info
```

Windows PowerShell：

```powershell
.\zero.exe build-info
```

应能看到构建标识、`features`、`git_hash` 和 `binary_sha256`。保存这份输出，排查问题时可以准确识别你运行的版本。接下来进入[启动第一个节点](./quickstart)。

后续指南用 `zero` 简写可执行文件；未加入 `PATH` 时，Linux/macOS 使用 `./zero`，Windows 使用 `.\zero.exe`，也可以填写它的绝对路径。

::: details 可选：从源码构建

## 准备环境

需要 Git、Rust stable 和平台的原生构建工具；TLS 依赖还可能需要 CMake/Perl。普通使用者可以直接使用发行包。

## 获取源码并构建

```bash
git clone https://github.com/zerodenet/core.git
cd core
git checkout v0.0.2-rc.202609290540
cargo build --release --locked
```

产物位于 `target/release/zero`（Windows 为 `zero.exe`）。要复现正式版，选择 `v0.0.1`；不要把仓库默认分支当成最新发行版。

## 选择可选能力

默认是 `full,status-api`。Connector、gRPC、JSONL 和裁剪方式见[构建特性](../configuration/features)。WireGuard 仅在已发布 dev `v0.0.3-dev.202609281319` 中提供，需选择该 tag 并增加 `--features wireguard`，仍是实验能力。

贡献代码时再阅读[参与 Core 开发](../contributing/)。
:::

## 更新与回退 {#更新源码}

本节的备份与验证步骤同样适用于下载新发行包升级。

升级前备份当前二进制、完整配置和状态目录，并保留原 `build-info`。下载或构建新版本后，先用新二进制校验旧配置：

```bash
zero build-info
zero validate config.json
```

确认通过后再停止旧进程、替换产物并启动。验证代理请求、运行状态和 TUN 清理/恢复；失败时使用保留的旧二进制及其匹配配置回退。不要在运行中的唯一副本上直接覆盖升级。

源码升级同样先 `git fetch --tags`，再选择明确的 tag 或提交，避免无意间从正式线切到开发线。

## 继续

[启动第一个节点](./quickstart)提供可以直接复制的完整配置，不需要准备远程服务器。
