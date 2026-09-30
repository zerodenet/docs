# 运行 TUN 与 DNS

TUN 用于接管应用的 IP 流量。先完成[本地代理测试](./quickstart)并确认需要的出站可用，再在本机终端启用 TUN；它会修改系统路由，首次尝试时保留可操作的本机终端，不要只依赖远程连接。

## 开始前

- `zero build-info` 应包含 DNS 和所需 UDP/协议能力，默认 `full` 构建满足基础 TUN 使用
- Linux 需要 TUN、接口、路由和防火墙权限，系统需提供 `ip`、`nft`
- macOS 需要对应系统权限及 `ifconfig`、`route`、`pfctl`，PF 主规则需执行 `com.apple/*` anchor
- Windows 使用管理员终端；官方发行包包含 Wintun，自行打包时需保留匹配组件

关闭其他正在接管全局路由的代理工具，避免无法判断请求到底走哪个实例。不同 VPN 是否能共存需要按实际路由检查。

## 启动一个直连 TUN

下面是完整配置。它接管流量后直连，用于验证 TUN、路由和 DNS，不包含远程代理节点。

```json
{
  "schema_version": 1,
  "inbounds": [],
  "outbounds": [],
  "route": { "final": { "type": "direct" } },
  "runtime": {
    "dns": {
      "servers": { "upstream": { "type": "udp", "host": "1.1.1.1", "port": 53 } },
      "default_server": "upstream",
      "answer": { "type": "real" },
      "policy": { "address_family": "prefer_ipv4" }
    },
    "tun": {
      "addr": "10.66.0.1/24",
      "tag": "tun",
      "auto_route": true,
      "dual_stack": true,
      "strict_route": true,
      "dns_hijack": true
    }
  }
}
```

示例使用公共 DNS `1.1.1.1`，请按部署网络替换成可达且获准使用的解析服务。它是直连出口，不会改变你的公网出口。

保存为 `tun.json`，先校验，再在具备上述权限的终端启动：

```bash
zero validate tun.json
zero run tun.json
```

另一个终端使用相同运行用户/访问权限和同一 IPC 地址读取状态；管理员实例的默认 socket 不一定是普通用户的默认 socket：

```bash
zero tun status
zero status --json
zero flows
```

需要远程代理时，增加协议出站并修改 `route.final`。使用 `system` DNS 后端时，严格模式必须能发现实际系统上游；只有本地 stub 而无法发现上游会启动失败，应配置显式 DNS。域名形式的 DNS 上游需要 bootstrap IP。参数和默认值见[配置参考](../configuration/)与 [DNS 参数](../configuration/dns)。

## 确认流量实际进入 TUN

1. 确认 TUN 状态为运行，查看接口地址、捕获网段及 IPv4/IPv6 出口可用性。
2. 发起一次新的域名解析和 TCP 请求，并用实际需要的应用验证 UDP。
3. 在 flow 详情核对 `inbound_tag`、原始目标、域名恢复信息、路由和最终出站。
4. 如同时开启系统代理，注意请求可能经 Mixed 入站进入内核；用 TUN 入站记录确认本次测试路径。

网页打开或节点测速成功，只能证明相应请求成功，不能单独证明 DNS、UDP 和 TUN 都已接管。探测也不替代实际业务连接的流量记录。

## 只接管部分网段

在 `runtime.tun` 增加以下片段：

```json
{
  "include_cidrs": ["10.0.0.0/8"],
  "exclude_cidrs": ["10.20.0.0/16"]
}
```

此例只接管 `10.0.0.0/8` 中除 `10.20.0.0/16` 外的目标；排除网段沿用系统路由。`include_cidrs` 留空表示全量接管，排除列表再从中扣除。两者配置在自动路由范围内，不能在 `auto_route: false` 时依赖其安装路由。

启用 Fake-IP 后还必须让合成地址池进入 TUN；只接管一个内网网段的示例不适合直接承载全局 Fake-IP。需要内网域名返回真实地址时配置 `answer.exclude_domains`；DNS 的 `reject_address_cidrs` 是拒绝上游结果，不是 TUN 绕过列表。

## 处理地址族与网络变化

内核会观察物理默认出口变化，协调 TUN 路由和受管出站。状态中的每个地址族可为 `available`、`unavailable` 或 `unknown`；`unknown` 不能当作已经可用。

只有 IPv4 物理出口时，双栈捕获可以处于降级状态；具有可信域名的部分连接可以重新解析到可用地址族。裸 IPv6、缺失映射的合成地址或没有可信域名的目标不会凭空获得 IPv4 地址。直接 UDP 不采用 TCP 的连接失败后猜测换目标逻辑。

网络变化后可以在同一实例上运行 `zero tun recover` 请求一次路由协调，然后再次查询 `zero tun status` 并重试应用请求。它不会重建整个代理，也不能补足当前发行版的防火墙规则完整性限制。

Windows strict route 包含 DHCP 客户端流量放行，用于地址续租和出口恢复。切换 Wi-Fi、网线或 VPN 后，仍需检查实际地址获取、出口状态、DNS 和 TCP/UDP 恢复。失败时保留首次路由错误及出口诊断，先处理物理网络或权限问题。

## 严格路由的保护范围

`strict_route` 除启动事务回滚外，也管理平台防漏规则。不能仅凭“已开启严格模式”判定防泄漏已通过，还要注意以下边界：

- Linux 检查受管 nftables 表是否存在，但不能保证表内单条规则被删改后恢复；macOS 在捕获/排除配置未变化时，也不能保证 PF 规则被清空后恢复
- 系统路由与出口有周期协调；检测和恢复存在窗口，不是持续防篡改或零泄漏保证
- macOS 的物理出口例外按 Zero 有效 UID 放行，同 UID 的其他程序也会受益，不能保证同用户浏览器/STUN 隔离
- 显式 `direct` 路由和排除网段本来就使用物理出口
- 双栈捕获不代表 IPv6 物理出口、应用加密 DNS或 NAT64 已可用

需要防泄漏时，按实际平台验证应用的 DNS、TCP、UDP/STUN 和网络切换，并查看 `healthy`、各地址族出口与 `last_error`，不能只看 `running`。不要通过清空防火墙来尝试修复代理。

## 更新与停止

修改完整候选配置后，先 `zero validate candidate.json`，再 `zero reload candidate.json`，等待协调完成。网卡和捕获参数变化可能重建 TUN 并中断既有连接；失败时查看错误和当前状态，不反复提交相同命令。

本页的 `runtime.tun` 由配置管理，不能用 `zero tun stop` 单独关闭。要关闭而保留代理进程，删除 `runtime.tun` 后校验并应用完整配置；要退出整个前台程序，按 `Ctrl+C`。

省略 `runtime.tun` 的运行实例才使用 `zero tun start` / `zero tun stop` 临时管理，命令参数见 [CLI](../control-plane/cli)。停止后确认 TUN 状态与系统原路由恢复。不要把 IPC 超时解释为“已经停止”。

DNS 劫持只覆盖经过 TUN 的 TCP/UDP 53。应用自带 DoH/DoT/DoQ、ECH 隐藏的主机名以及 NAT64 不因开启 TUN 自动获得支持。
