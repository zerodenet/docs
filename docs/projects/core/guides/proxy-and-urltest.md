# HTTP / Mixed 代理入口与 URLTest

本页说明 HTTP、Mixed、QUIC 出站和 URLTest 的当前运行行为。升级内核后，客户端和控制器应按这些语义处理请求、测速结果和配置切换。

## HTTP 与 Mixed 入站

| 入站类型 | 接受的请求 |
|----------|------------|
| `http` | HTTP CONNECT、标准 HTTP forward-proxy 请求 |
| `mixed` | SOCKS5 TCP、SOCKS5 UDP ASSOCIATE、HTTP CONNECT、标准 HTTP forward-proxy 请求 |

标准 HTTP forward-proxy 请求使用绝对形式的目标地址，例如：

```http
GET http://example.com/status HTTP/1.1
Host: example.com
```

Zero 会解析目标地址，按正常路由规则选择出站，再将请求头转换为目标服务器可接受的 origin-form 后转发。请求体和其他头字段会继续沿所选出站传输。

HTTPS 仍通过 CONNECT 建立隧道。Zero 不会在本地代理入口解密 HTTPS 内容。

可用以下命令验证：

```bash
curl -x http://127.0.0.1:8080 http://example.com/
curl -x http://127.0.0.1:7890 https://example.com/
```

如果使用 `mixed`，同一个端口也可以被 SOCKS5 客户端使用。

## 路由语义

HTTP forward-proxy 请求与 CONNECT、SOCKS5 请求使用同一套路由模型：

- 域名目标可以命中域名规则；
- 已解析或直接提供的 IP 目标可以命中 IP/CIDR 规则；
- 未命中规则时执行 `route.final`；
- 拒绝动作会在建立上游连接前终止请求。

不要为普通 HTTP 请求另建一套旁路转发规则。

## QUIC 出站地址与 SNI

Hysteria2 和 VLESS QUIC 出站的 `server` 可以填写域名。连接时会解析 A/AAAA 记录，去重后依次尝试可用地址，并根据目标地址族创建 IPv4 或 IPv6 UDP endpoint。

对于 VLESS QUIC：

- `server` 决定实际连接的网络端点；
- QUIC/TLS 的 `server_name` 决定证书校验和 SNI；
- 两者可以不同，例如连接一个接入域名，同时使用证书对应的服务名。

当日志出现 `quic resolve` 时检查 DNS；出现 `quic connection` 时继续检查 UDP 可达性、端口、SNI、证书和服务端协议配置。域名不应再被当作 `SocketAddr` 直接解析。

## URLTest 探测模型

一个 URLTest 组会并发探测成员，而不是逐个串行等待。当前行为包括：

- 全进程最多同时运行 8 个真实探测；
- 不同 URLTest 组和单节点诊断共享同一个并发上限；
- 同一份活动配置中，相同目标和相同 URL 的并发请求会合并为一次真实探测；
- 一轮探测运行期间再次触发同一组，不会在后面重复排队一整轮；
- 手动探测完成后会重新计算下一次周期时间；
- 结果快照保持配置中的成员顺序，不受实际完成顺序影响。

并发上限用于避免大量节点同时建立真实连接造成资源尖峰；它不代表一个组最多只能包含 8 个成员。

## 控制器与 GUI 接入建议

触发策略组测速时，直接请求该 URLTest 组，不要先展开成员并逐一重复测速。一个 URLTest 组作为另一个 selector 的成员时，也应把它视为一个策略目标。

界面等待结果时建议：

1. 记录触发时间和当前配置身份；
2. 等待新的 `policy.probe.completed` 事件；
3. 如果事件丢失，可接受触发时间之后的新鲜策略快照；
4. 配置切换后立即结束旧配置的等待状态；
5. 不要仅依靠固定短超时判断整组失败。

成员较多时，整组完成时间取决于共享并发上限、单次网络超时和其他同时运行的探测。

## 常见问题

### 普通 HTTP 请求仍失败

先确认客户端确实把代理配置为 HTTP 代理，并检查请求是否使用绝对形式。然后查看路由最终动作、目标解析和上游连接错误。

### QUIC 域名可解析但连接失败

分别检查解析结果中的 IPv4/IPv6 地址、UDP 防火墙、端口、服务端监听和 TLS `server_name`。解析成功不代表每个返回地址都可用。

### URLTest 重复消耗流量

不要同时对父组、URLTest 组和其全部成员发起独立请求。Zero 会合并同一目标的同时请求，但跨时间或不同探测 URL 仍会产生新的真实连接。

相关配置见[运行模式与出站组](/projects/core/configuration/modes-and-groups)和[协议配置示例](/projects/core/protocols/configuration)。
