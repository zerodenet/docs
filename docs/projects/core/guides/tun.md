# TUN 接管与路由生命周期

Zero 可以通过 TUN 把系统网络流量送入与普通代理入站相同的路由、出站和策略体系。`v0.0.16-dev.202608180928` 进一步完善了 Linux、macOS 和 Windows 的 TUN 路由生命周期、出口接口重协调和 Windows 发布产物。

## 启动 TUN

TUN 由运行中的 Zero 通过本地控制接口管理。最小命令：

```bash
zero tun start --addr 10.0.0.1 --tag tun-in
```

常用参数：

```text
zero tun start \
  --addr 10.0.0.1 \
  --tag tun-in \
  [--name NAME] \
  [--mask 255.255.255.0] \
  [--secondary-addr CIDR] \
  [--mtu MTU] \
  [--no-auto-route] \
  [--single-stack] \
  [--no-strict-route] \
  [--no-dns-hijack] \
  [--socket PATH]
```

默认行为是：

- 自动管理 TUN 路由；
- 启用双栈接管；
- 启用严格路由；
- 请求启用 DNS 劫持；
- 未提供掩码时使用 `255.255.255.0`。

`tag` 是流量进入 Zero 后使用的 inbound tag。路由规则仍按正常的 `mode`、`route.rules` 和 `route.final` 执行，不需要为 TUN 建立另一套代理语义。

DNS 劫持开关只决定 TUN 是否接管对应 DNS 流量，不会自动替代完整的 DNS 配置。启用前仍应确认当前运行配置已经准备好需要的 DNS 能力。

## 查看状态

```bash
zero tun status
```

运行时状态会包含：

- 是否正在运行以及是否健康；
- 是否由活动配置管理；
- TUN 名称、地址、MTU 和 inbound tag；
- `auto_route`、`dual_stack`、`strict_route`、`dns_hijack`；
- 当前识别到的底层出口接口，以及 IPv4 / IPv6 出口接口。

自定义控制 socket 时，`start`、`status` 和 `stop` 都应传入同一个 `--socket`。

## 路由与底层出口

启用自动路由后，Zero 不只在 TUN 启动时写入一次系统路由。当前实现会持续维护 TUN 所需的路由状态，并在物理网络或默认出口发生变化后重新协调。

这对以下场景尤其重要：

- Wi-Fi 与有线网络切换；
- VPN、默认路由或网关发生变化；
- 笔记本休眠恢复；
- macOS `utun` 接口重建；
- Windows 网络接口重新排序。

TCP、UDP 和 QUIC 的底层连接会使用当前识别到的 underlay egress，避免代理自身的上游连接重新进入 TUN 形成回环。macOS 会保留物理出口的 scoped route 语义；Windows 和 Linux 也会在接口变化后重新协调托管路由。

## 停止 TUN

```bash
zero tun stop
```

停止操作会关闭当前 TUN，并撤销由本次 TUN 生命周期管理的路由状态。不要通过手工删除部分托管路由来代替 `tun stop`；这样容易让运行时状态与操作系统路由表不一致。

停止后再次运行：

```bash
zero tun status
```

确认状态已经变为未运行，再进行网络环境或配置调整。

## 平台权限

创建 TUN、修改系统路由和绑定底层接口通常需要操作系统授予相应网络管理权限。如果启动失败，Zero 会保留可读的 `last_error`，Windows 上的权限不足也会作为明确错误返回，而不是只表现为 TUN 无流量。

官方 Windows 发布流程会随发布产物准备所需的 Wintun 组件。自行从源码构建或重新打包时，不应假设发布工作流已经替你准备运行依赖。

## GUI 与控制器接入

GUI 不应通过修改系统路由来模拟 Zero 的 TUN 生命周期。推荐顺序是：

1. 确认 Zero 已启动且本地控制接口可用；
2. 调用 `tun.start` 或等价 CLI；
3. 查询 TUN 状态确认运行参数和健康状态；
4. 网络环境变化时继续以 Zero 返回的状态为准；
5. 退出或切换所有权时调用 `tun.stop`。

如果活动配置本身管理 TUN，控制器还应尊重 `managed_by_config`，避免同时由配置和外部命令争用同一个 TUN。

## 常见问题

### TUN 已启动但上游也被送回 TUN

先查看 `zero tun status` 中的 egress 信息，再检查系统默认路由是否正在频繁变化。当前版本会把代理上游 socket 绑定到识别到的底层出口；如果状态中的出口为空或错误，应先排查物理网络与路由发现，而不是增加更多代理规则。

### 网络切换后失去连接

确认 TUN 仍然健康，并检查网络切换后的出口接口是否更新。自动路由开启时，Zero 会重新协调托管路由；如果系统权限不足或外部程序持续改写路由，状态中会留下错误线索。

### Windows 启动失败

确认当前发布包完整、Wintun 组件存在，并以具备修改网络接口和路由权限的上下文运行。优先保留 `zero tun status` 的 `last_error` 和应用日志，而不是只截取系统“无法联网”的结果。

相关内容：

- [配置基础](./configuration-basics)
- [运行与观测](./operations)
- [故障排查](./troubleshooting)
- [CLI 命令](/projects/core/control-plane/cli)
