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

`validate` 无副作用。`build-info` 用于确认当前发行物包含的协议和可选能力。

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
  --name tun0 --mask 255.255.255.0 --mtu 1500
zero tun status
zero tun stop
```

TUN 命令同样可以使用 `--socket PATH` 连接指定实例。

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
