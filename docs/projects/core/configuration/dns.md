# DNS 参数参考

DNS 位于 `runtime.dns`。省略或为 `null` 时使用系统解析器；显式配置后，使用命名服务器和按顺序匹配的分流规则。先用真实 DNS 验证，再按需要启用 Fake-IP。

## 可运行的 Real DNS 示例

保存为 `dns.json`，先运行 `zero validate dns.json`，再运行 `zero run dns.json`。此例提供本地 Mixed 代理并直连目标，不自动启用 TUN。

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
  "outbounds": [],
  "route": { "final": { "type": "direct" } },
  "runtime": {
    "dns": {
      "servers": {
        "system": { "type": "system" },
        "secure": {
          "type": "doh",
          "host": "cloudflare-dns.com",
          "bootstrap": ["1.1.1.1", "1.0.0.1"]
        }
      },
      "default_server": "secure",
      "cache": { "max_entries": 1024, "max_ttl_seconds": 300 },
      "answer": { "type": "real" },
      "policy": {
        "timeout_ms": 5000,
        "fallback_servers": ["system"],
        "node_server": "system",
        "address_family": "prefer_ipv4"
      }
    }
  }
}
```

示例中的公共上游需要从部署网络可达；可替换为自己的解析服务。TUN DNS 劫持处理经过 TUN 的 53 端口查询，配置 DNS 不会自动启动一个供整个局域网使用的 UDP 53 服务。

## `runtime.dns`

| 参数 | 类型 | 默认值 | 作用 |
| --- | --- | --- | --- |
| `servers` | 名称到服务器对象的映射 | 必填 | 至少一台服务器，名称供其他字段引用 |
| `default_server` | string | 必填 | 未命中分流规则时使用的服务器名称 |
| `dispatch` | array | `[]` | 首次命中生效的 DNS 分流规则 |
| `cache` | object / null | `null` | 可选普通 DNS 缓存 |
| `reverse_mapping` | object / null | `null` | 可选真实 IP 到域名的有界索引 |
| `answer` | object | `{"type":"real"}` | 真实地址或 Fake-IP 应答 |
| `policy` | object | 见下表 | 超时、回退、角色解析链及地址族策略 |

## `servers.<名称>`

| `type` | 默认端口 | 支持的其他参数 | 使用限制 |
| --- | --- | --- | --- |
| `system` | 无 | 无 | 使用系统解析，TUN 路由准备时发现系统 DNS 地址 |
| `udp` | `53` | `host`、`port`、`bootstrap`、`detour` | 设置 detour 时通过该出站承载 DNS-over-TCP |
| `doh` | `443` | `host`、`port`、`path`、`bootstrap`、`server_name`、`detour` | `path` 默认 `/dns-query` |
| `dot` | `853` | `host`、`port`、`bootstrap`、`server_name`、`detour` | TLS 解析连接 |
| `doq` | `853` | `host`、`port`、`bootstrap`、`server_name` | 当前拒绝 `detour` |

网络服务器的 `host` 必填，可为 IP 或域名。域名主机必须提供非空 `bootstrap` IP 列表，用来建立到 DNS 服务器本身的连接；它不是另一个待递归解析的域名列表。`server_name` 可覆盖 TLS 校验名称，省略时使用主机名。

`detour` 是已定义的出站或出站组 tag；省略时直接连接上游。只要配置了任一 detour，就必须配置 `policy.node_server`，并保证节点解析主服务器和回退服务器均不使用 detour。客户端界面的“跟随默认出站”是客户端选项，不能直接把 `$route_final` 写成内核出站 tag。

## `policy`

| 参数 | 类型 / 范围 | 默认值 | 作用 |
| --- | --- | --- | --- |
| `timeout_ms` | integer，`1–120000` | `5000` | 每个上游的查询期限，毫秒 |
| `server_timeout_ms` | 名称到毫秒值的映射 | `{}` | 单台服务器覆盖，同样为 `1–120000` |
| `fallback_servers` | string[] | `[]` | 普通查询失败后的有序回退链 |
| `node_server` | string / null | `null` | 代理节点和传输端点的解析服务器；省略时按普通分流 |
| `node_fallback_servers` | string[] | `[]` | 节点解析专用回退链，需同时指定 `node_server` |
| `direct_server` | string / null | `null` | 直连目标解析服务器；省略时按普通分流 |
| `direct_fallback_servers` | string[] | `[]` | 直连解析专用回退链，需同时指定 `direct_server` |
| `reject_address_cidrs` | CIDR[] | `[]` | 拒绝含这些真实应答地址的结果，继续回退且不缓存 |
| `address_family` | enum | `prefer_ipv4` | `ipv4_only`、`ipv6_only`、`prefer_ipv4`、`prefer_ipv6` |

服务器引用必须存在；回退链不能重复引用同一服务器。地址族策略同时约束劫持 DNS 可公布的地址族及内核自行解析时的偏好。它不创建 IPv6 出口，也不提供 NAT64。

## `dispatch`

每条规则由 `condition` 和目标 `server` 组成，按顺序首次命中；不要混用路由动作 `action`。

```json
{
  "condition": { "type": "domain", "values": ["internal.example"] },
  "server": "system"
}
```

`domain` 同时匹配域名本身及其子域。还支持 `domain_keyword`、`domain_regex`、适用的 `rule_set` 以及 `and` / `or` 组合；引用规则集时需在 `route.rule_sets` 定义对应 tag。DNS 分流不接受 `inbound`、`ip`、`geoip`、`sni` 或纯 CIDR 规则集，因为解析前缺少这些事实。

## 缓存与真实地址反向映射

| 参数 | 启用对象后的默认值 | 作用 |
| --- | --- | --- |
| `cache.max_entries` | `256` | 普通 DNS 缓存容量，必须大于零 |
| `cache.max_ttl_seconds` | 省略，遵循记录 TTL | 可选 TTL 上限，秒 |
| `reverse_mapping.max_entries` | `1024` | 保留的真实 IP 数量 |
| `reverse_mapping.max_domains_per_address` | `8` | 单个真实 IP 的候选域名上限 |
| `reverse_mapping.max_ttl_seconds` | `300` | 反向映射保留 TTL 上限，秒 |

省略整个对象表示不启用，不等同于传空对象 `{}`。反向映射容量和 TTL 必须大于零，`max_domains_per_address` 至少为 `2`；同一 IP 对应多个有效域名时属于歧义，不能据此猜测目标域名。缓存中的 wire DNS 应答会随时间递减 TTL。

## `answer` 与 Fake-IP

将 `answer` 改成以下对象，并按 [TUN 使用指南](../guides/tun-and-dns)保证 DNS 和合成地址都进入同一内核：

```json
{
  "type": "fake_ip",
  "cidr": "198.18.0.0/15",
  "ipv6_cidr": "fd00::/96",
  "ttl_seconds": 86400,
  "max_entries": 65536,
  "exclude_domains": ["internal.example"]
}
```

| 参数 | 默认值 | 作用 |
| --- | --- | --- |
| `type` | `real` | 设为 `fake_ip` 启用合成应答 |
| `cidr` | `198.18.0.0/15` | IPv4 合成池 |
| `ipv6_cidr` | 无 | 可选 IPv6 合成池，用于 AAAA |
| `ttl_seconds` | `86400` | 映射生存期，秒，必须大于零 |
| `max_entries` | 池容量与 `65536` 的较小值 | 活跃映射上限，设置时必须大于零 |
| `exclude_domains` | `[]` | 返回真实 DNS 结果的域名 |

IPv4 池前缀长度不得大于 `/30`，IPv6 不得大于 `/126`；显式 `max_entries` 不得超过可用池容量，双栈取两池可用容量的较小值。合成池不得与 TUN 自有地址冲突。丢失映射的合成地址会被拒绝，不会直接发往公网；内核也会隔离退役地址，避免旧连接命中新域名。

当前内核支持 Fake-IP 持久化和配置回滚时的映射恢复。保留运行用户的状态目录；改运行用户、配置目录或清理状态后，应让应用重新解析 DNS。对普通解析缓存、Fake-IP 映射和客户端自身 DNS 缓存分别排查，不把三者混为一体。

`ZERO_DNS_STATE_DIR` 可覆盖 Fake-IP 状态目录。Windows 默认 `%LOCALAPPDATA%\Zero\state`；Unix 优先 `$XDG_STATE_HOME/zero`，否则使用 `~/.local/state/zero`。文件名按配置来源目录身份生成，服务运行用户需有写入权限。它不是 `runtime.dns` 中的 JSON 参数。
