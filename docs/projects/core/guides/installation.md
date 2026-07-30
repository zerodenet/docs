# 安装与构建

Zero 当前以 Rust 工程和发布二进制的形式交付。本页说明如何从源码得到一个可运行、可核验能力的本地二进制。

## 准备环境

需要：

- Git
- Rust stable 工具链
- Cargo

确认环境：

```bash
git --version
rustc --version
cargo --version
```

## 获取源码并构建

```bash
git clone https://github.com/zerodenet/core.git
cd core
cargo build --release
```

默认构建包含全部代理协议和 HTTP 状态/控制接口。产物位置：

- Linux/macOS：`target/release/zero`
- Windows：`target\release\zero.exe`

查看这个二进制实际包含的能力：

```bash
./target/release/zero build-info
```

不要只根据文档或文件名判断 feature；`build-info` 输出的 `features`、`git_hash`、`build_profile` 和 `binary_sha256` 才描述当前产物。

## 选择可选能力

Connector 和 gRPC 不属于默认构建，需要显式加入：

| 用途 | 构建命令 |
|------|----------|
| 默认代理协议 + HTTP/IPC | `cargo build --release` |
| 增加 Connector Webhook | `cargo build --release --features connector` |
| 增加 gRPC 控制接口 | `cargo build --release --features grpc-api` |
| 同时增加 Connector 和 gRPC | `cargo build --release --features connector,grpc-api` |
| 增加本地 JSONL 事件文件 | `cargo build --release --features sink-jsonl` |

`connector` 只启用 Webhook 事件投递，不会隐式启用 gRPC；`grpc-api` 也不会启用 Connector。

需要极小构建时，可以从 `--no-default-features` 开始逐项选择协议和控制能力。引用未编译协议的配置会在启动前明确失败。完整列表见[构建特性](/projects/core/configuration/features)。

## 更新源码

更新前先保存当前二进制、配置文件和 `build-info`：

```bash
git pull --ff-only
cargo build --release
./target/release/zero build-info
./target/release/zero validate config.json
```

先验证新二进制和现有配置，再由进程管理器替换运行实例。不要在没有回滚副本的情况下覆盖唯一可执行文件。

## 继续

构建成功后进入[启动第一个节点](./quickstart)。
