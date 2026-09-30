# 安装、升级与回退 {#安装与构建}

<span id="下载发行包"></span>
<span id="确认可运行"></span>

首次安装请直接使用[第一次使用教程](./quickstart#下载发行包)，下载和解压后继续创建配置。本页用于已有安装的升级、回退和可选源码构建。

## 更新与回退 {#更新源码}

1. 保存当前二进制、完整配置和状态目录，并保留 `zero build-info` 输出。
2. 从 [Core Releases](https://github.com/zerodenet/core/releases) 下载新包及校验文件，校验后解压到另一目录。不要直接覆盖正在运行的唯一副本。
3. 用新二进制校验现有配置，再停止旧进程并切换到新程序。
4. 启动后重试实际代理请求；使用 TUN 时还要确认 DNS、出口和路由恢复。
5. 如需回退，停止新进程，恢复旧二进制及其匹配的配置和状态备份，再启动验证。

例如，在新二进制所在目录执行：

```bash
./zero build-info
./zero validate /path/to/config.json
```

Windows 使用 `.\zero.exe`，并将路径替换成实际配置位置。配置校验不占用旧进程的监听端口，不必先停服务才能检查。

二进制升级和配置热更新是不同操作：只改配置时使用[安全热更新](./hot-reload)。涉及凭证或协议语义的升级，先查[迁移与兼容说明](../control-plane/breaking-changes)。

## 可选：从源码构建

<span id="准备环境"></span>

普通使用者无需安装 Rust。需要裁剪能力或定制构建时，准备 Git、Rust stable 和平台原生构建工具；TLS 依赖还可能需要 CMake/Perl。

<span id="获取源码并构建"></span>

```bash
git clone https://github.com/zerodenet/core.git
cd core
git tag --list
```

用 `git checkout` 切换到发行页对应的 tag 后再构建，不要把仓库默认分支当作发行版：

```bash
cargo build --release --locked
```

产物为 `target/release/zero`，Windows 为 `target\release\zero.exe`。使用教程中的命令时，换成这个可执行文件的路径。

<span id="选择可选能力"></span>

默认构建是 `full,status-api`。Connector、gRPC、JSONL 和协议裁剪见[构建特性](../configuration/features)；实验协议需要额外核对发行物是否包含对应 feature。

<span id="继续"></span>

构建完成后继续[第一次使用](./quickstart#_1-创建配置)。修改源码前阅读[贡献指南](../contributing/)。
