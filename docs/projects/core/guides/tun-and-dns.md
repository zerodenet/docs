# 运行 TUN 与 DNS

先确认 `zero build-info` 包含所需能力，并具备创建 TUN 和修改路由的权限。Windows 官方发行包包含 Wintun；自行打包时需要保留匹配的运行组件。

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
      "servers": { "system": { "type": "system" } },
      "default_server": "system",
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

保存为 `tun.json`，先校验，再以所需权限启动：

```bash
zero validate tun.json
zero run tun.json
```

另一个终端使用同一 IPC 地址读取状态：

```bash
zero tun status
zero status --json
zero flows
```

需要远程代理时，增加协议出站并修改 `route.final`。参数和默认值见[配置参考](../configuration/)与 [DNS 参数](../configuration/dns)。

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

Windows strict route 包含 DHCP 客户端流量放行，用于地址续租和出口恢复。切换 Wi-Fi、网线或 VPN 后，仍需检查实际地址获取、出口状态、DNS 和 TCP/UDP 恢复。失败时保留首次路由错误及出口诊断，先处理物理网络或权限问题。

## 更新与停止

修改完整候选配置后，先 `zero validate candidate.json`，再 `zero reload candidate.json`，等待协调完成。网卡和捕获参数变化可能重建 TUN 并中断既有连接；失败时查看错误和当前状态，不反复提交相同命令。

省略 `runtime.tun` 的运行实例可用 `zero tun start` / `zero tun stop` 显式管理，命令参数见 [CLI](../control-plane/cli)。停止后用 `zero tun status` 确认，检查系统原路由恢复。不要把 IPC 超时解释为“已经停止”。

DNS 劫持只覆盖经过 TUN 的 TCP/UDP 53。应用自带 DoH/DoT/DoQ、ECH 隐藏的主机名以及 NAT64 不因开启 TUN 自动获得支持。
