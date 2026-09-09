# CLI 命令参考

命令中的 `CONFIG` 是完整 JSON 配置文件。运行 `zero help` 可查看当前二进制实际支持的命令。

## 启动与检查

```bash
zero run config.json
zero run --status-listen 127.0.0.1:9090 config.json
zero run --control-socket /run/zero/control.sock config.json

zero validate config.json
zero status config.json
zero status --json config.json
zero version
zero build-info
```

`validate` 不启动监听或 TUN，也不占用运行内核的 Fake-IP 租约或修复配额状态；完整边界见[配置校验](../guides/hot-reload#校验与运行状态隔离)。`build-info` 用于确认当前发行物包含的协议和可选能力。

| 参数 / 命令 | 取值与作用 |
| --- | --- |
| `run CONFIG` | 必填配置路径，启动前解析及验证 |
| `run --status-listen HOST:PORT` | 显式 HTTP 控制监听；不要与配置内已启用的控制监听同时指定 |
| `run --control-socket PATH` | 指定本地控制 IPC 地址 |
| `run --ipc-hook-socket PATH` | 可选外部 IPC hook socket，供已有 hook 接收端使用 |
| `status --json` | JSON 状态输出；可附配置路径或 `--socket` |
| `--socket PATH` | 客户端命令连接的 Unix socket / Windows 命名管道 |
| `validate CONFIG` | 校验完整配置，不启动监听、TUN 或业务连接 |
| `build-info` / `version` / `-V` / `--version` | 查看构建信息 |

不指定 socket 时，Unix 默认 `~/.zero/control.sock`，Windows 默认 `\\.\pipe\zero-control`。管理多个实例时始终明确指定地址。

## 连接运行中的进程

以下命令通过 IPC 控制运行中的 Zero。需要时使用 `--socket PATH` 指定 Unix socket 或 Windows 命名管道：

```bash
zero status --json --socket /run/zero/control.sock
zero flows --socket /run/zero/control.sock
zero policies --socket /run/zero/control.sock
zero events --socket /run/zero/control.sock
```

## 应用完整配置

```bash
zero reload candidate.json --socket /run/zero/control.sock
```

`reload` 会先解析、校验，再等待运行时完成协调。它不是只更新 route 的局部重载：

- 监听形状变化时重建对应监听器。
- 可热更新的协议状态使用热更新路径。
- 应用失败时返回错误，并尝试保留上一份可用配置和监听状态。

控制接口自身的监听地址或认证配置不能通过这个连接在线替换，需要重启进程。

## 切换模式

```bash
zero mode rule --socket /run/zero/control.sock
zero mode direct --socket /run/zero/control.sock
zero mode global proxy --socket /run/zero/control.sock
```

`global` 必须给出存在的出站或出站组 tag。

## 切换 selector

```bash
zero select proxy node-b --socket /run/zero/control.sock
```

第一个参数是 selector 组 tag，第二个参数是该组成员。

## Connector 状态

启用 Connector 的发行物可以读取持久投递状态：

```bash
zero connector state --json config.json
```

该命令只检查本地 sink、outbox 和投递状态，不注册中心地址，也不提供节点管理命令。

## TUN

```bash
zero tun start --addr 10.0.0.1 --tag my-tun
zero tun start --addr 10.0.0.1 --tag my-tun \
  --name tun0 --mask 255.255.255.0 --mtu 1500 \
  --exclude-cidr 192.168.50.0/24
zero tun status
zero tun stop
```

TUN 命令同样可以使用 `--socket PATH` 连接指定实例。

| 参数 | 默认值 | 说明 |
| --- | --- | --- |
| `--addr IP或CIDR` | 必填 | 主地址 |
| `--tag TAG` | 必填 | 流量入站标识；CLI 不自动补 `tun` |
| `--name NAME` | 系统选择 | 网卡名称 |
| `--mask MASK` | `255.255.255.0` | 主地址掩码 |
| `--secondary-addr CIDR` | 自动选择另一族地址 | 仅双栈使用 |
| `--mtu MTU` | `runtime.network.mtu` | `576–65535` |
| `--include-cidr CIDR` | 全量 | 可重复，指定接管范围 |
| `--exclude-cidr CIDR` | 无 | 可重复，从接管范围扣除 |
| `--no-auto-route` | 不传则自动路由 | 禁用自动路由后不可依赖 CIDR 参数安装路由 |
| `--single-stack` | 不传则双栈 | 单栈模式，不传第二地址 |
| `--no-strict-route` | 不传则严格路由 | 显式关闭严格路由策略 |
| `--no-dns-hijack` | 不传则劫持 | 没有有效 DNS 配置时显式关闭；不会接管加密应用 DNS |
| `--socket PATH` | 平台默认 | 目标内核实例 |

先启动 Zero 进程再执行 TUN 命令。默认启用 DNS 劫持，要求活动配置已有有效 DNS；完整示例及验证步骤见[运行 TUN 与 DNS](../guides/tun-and-dns)。命令超时后先查询状态，避免对未确认结果重复启停。

## 常见用法

部署前：

```bash
zero build-info
zero validate config.json
```

修改运行配置：

```bash
zero validate candidate.json
zero reload candidate.json
zero status --json
```

出现错误时先查看[故障排查](/projects/core/guides/troubleshooting)和[配置校验与错误处理](/projects/core/guides/config-failure-examples)。
