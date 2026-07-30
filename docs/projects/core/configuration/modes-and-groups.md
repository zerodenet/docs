# 运行模式与出站组

运行模式决定流量按什么方式选择出站，出站组则把多个出站组合成一个可引用目标。

## 三种运行模式

### rule

按 `route.rules` 顺序匹配，未命中时执行 `route.final`：

```json
{ "mode": { "type": "rule" } }
```

### direct

所有新连接直接访问目标：

```json
{ "mode": { "type": "direct" } }
```

### global

所有新连接使用指定出站或出站组：

```json
{
  "mode": {
    "type": "global",
    "outbound": "proxy"
  }
}
```

运行中可以通过控制面切换模式：

```bash
zero mode rule
zero mode direct
zero mode global proxy
```

切换影响之后建立的连接，现有连接不会被强行中断。

## selector：手动选择

```json
{
  "tag": "proxy",
  "type": "selector",
  "outbounds": ["node-a", "node-b", "direct"],
  "selected": "node-a"
}
```

运行中切换：

```bash
zero select proxy node-b
```

初始成员按 `selected`、`default`、`outbounds` 第一项的顺序确定。选择值必须属于该组。

## url_test：自动测速

```json
{
  "tag": "auto",
  "type": "url_test",
  "outbounds": ["node-a", "node-b"],
  "url": "http://cp.cloudflare.com/",
  "interval_seconds": 300
}
```

探测 URL 目前使用 `http://`。省略 `url` 时继承 `runtime.latency_test_url`。

## fallback：按顺序故障切换

```json
{
  "tag": "fallback-proxy",
  "type": "fallback",
  "outbounds": ["node-a", "node-b", "direct"]
}
```

建立连接失败时按成员顺序尝试下一个出站。

## relay：链式代理

```json
{
  "tag": "relay-proxy",
  "type": "relay",
  "proxies": ["entry-node", "exit-node"]
}
```

`relay` 至少需要两个成员。链中协议和传输必须支持所在位置的 relay 能力，部署前应结合[协议能力矩阵](/projects/core/reference/protocol-capabilities)检查。

## load_balance：负载均衡

```json
{
  "tag": "balanced",
  "type": "load_balance",
  "outbounds": ["node-a", "node-b"],
  "strategy": "round_robin"
}
```

`strategy` 支持 `round_robin` 和 `random`。可以用 `default` 指定初始成员。

## 组可以引用组

普通组成员可以引用另一个组，配置校验会检查不存在的目标和循环引用：

```json
[
  {
    "tag": "fallback-proxy",
    "type": "fallback",
    "outbounds": ["node-a", "direct"]
  },
  {
    "tag": "proxy",
    "type": "selector",
    "outbounds": ["fallback-proxy", "direct"],
    "selected": "fallback-proxy"
  }
]
```

## 与热更新的关系

不要依赖旧文档中“入站/出站变更必须重启”的说法。当前 `config.apply`/`zero reload` 会把完整候选配置交给运行时事务处理：

- 监听形状变化时重建对应监听器。
- 仅凭证等可热更新内容变化时使用协议热更新路径。
- 应用失败时返回错误，并尝试恢复上一份可用配置与监听状态。

控制接口本身的监听地址或认证配置不会自修改；这类变化仍需重启进程。完整步骤见[安全热更新配置](/projects/core/guides/hot-reload)。
