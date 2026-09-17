# 插件 SDK v1 使用指南

::: warning 开发版本文档
本页对应 ZNet Sink `develop@912d1dc`。Rust 与 TypeScript SDK 当前随源码仓库提供，尚未声明为 crates.io 或 npm 公共包。
:::

SDK v1 是插件调用客户端通用能力的固定契约。它不包含 Connect、ZBoard、账号、订阅或其他特定业务模型。

## 先理解调用模型

每次调用包含：

```json
{
  "version": 1,
  "request": {
    "capability": "plugin.storage.read",
    "scope": "self"
  },
  "method": "storage_get",
  "arguments": {
    "area": "state",
    "key": "profile"
  },
  "budget": {
    "timeout_ms": 30000,
    "max_result_bytes": 262144
  }
}
```

插件不能在请求中提交 `plugin_id`、`component_id`、宿主命令名或任意文件路径。客户端从已经验签的运行上下文绑定身份，并在每次调用时校验 capability、scope、授权、启用状态和预算。

- `arguments` 最大 256 KiB；
- `timeout_ms` 为 1–120000 毫秒；
- 返回结果最大 1 MiB；
- 停用、撤权、升级或卸载后，旧调用返回 `disabled`、`revoked`、`cancelled` 或 `expired`，晚到结果不会提交。

## 管理页面中使用

客户端会向已验签的管理页面注入 `globalThis.znetPlugin`。页面不需要也不能调用 Tauri 命令。

下面示例把普通 JSON 编码后写入当前插件的 `state` 区域：

```html
<script>
  const componentId = 'main'

  async function savePreferences(preferences) {
    await globalThis.znetPlugin.storage.putJson(
      componentId,
      'state',
      'preferences',
      preferences,
    )
    await globalThis.znetPlugin.notifications.post(
      componentId,
      '设置已保存',
      { kind: 'success' },
    )
  }

  async function loadPreferences() {
    return await globalThis.znetPlugin.storage.getJson(
      componentId,
      'state',
      'preferences',
    )
  }
</script>
```

插件仍需在 manifest 中声明 `plugin.storage.read`、`plugin.storage.write` 和 `notifications.post`。注入对象不会绕过权限审核。

## TypeScript SDK

源码位于仓库的 `sdk/typescript/index.ts`。`createSdk(transport)` 适合在插件工具链或测试中复用类型化 wire contract；客户端管理页面通常直接使用注入的 `znetPlugin`。

```ts
import { createSdk, type Call, type Reply } from './vendor/znet-sink-sdk/index'

const sdk = createSdk(async <T>(call: Call): Promise<Reply<T>> => {
  // transport 必须把完整 Call 交给受信宿主桥接层。
  // 不要在页面里拼接 Tauri 命令或插件身份。
  return await sendToHost<T>(call)
})

await sdk.storage.put('state', 'profile', base64Payload)
const stored = await sdk.storage.get('state', 'profile')

await sdk.notifications.post('同步完成', { kind: 'success' })
await sdk.tasks.put('refresh', 'refresh-subscriptions', 900)
```

`Transport` 返回 `Reply<T>`。SDK 在 `ok: false` 时抛出错误，并附加 `code` 与可选的 `retryAfterMs`。

## Rust SDK

Rust crate 位于 `sdk/rust`，包名为 `znet-sink-plugin-sdk`。在同一工作区开发时可以先使用路径依赖：

```toml
[dependencies]
znet-sink-plugin-sdk = { path = "../../sdk/rust" }
```

实现 `Transport` 后即可使用类型化 `Client`：

```rust
use znet_sink_plugin_sdk::{Call, Client, Reply, Transport};

struct HostTransport;

impl Transport for HostTransport {
    type Error = HostError;

    fn send(&self, call: Call) -> Result<Reply, Self::Error> {
        send_to_host(call)
    }
}

let client = Client::new(HostTransport);
client.storage_put("state", "profile", base64_payload)?;
client.notify("同步完成", "success")?;
client.schedule("refresh", "refresh-subscriptions", 900)?;
```

Rust SDK 只定义契约、校验和便捷方法，不依赖 Tauri 或客户端沙箱实现。

## 能力目录

| capability | scope | 用途 |
| --- | --- | --- |
| `plugin.self.read` | `self` | 读取当前插件安全摘要 |
| `records.summary.read` | `selection:<id>` | 读取用户已选择记录的摘要 |
| `network.get` / `network.request` | 精确 HTTP(S) origin | 经过宿主策略访问一个已批准来源 |
| `plugin.storage.read/write` | `self` | 访问当前插件的 state/cache 命名空间 |
| `notifications.post` | `self` | 发布带插件来源的客户端通知 |
| `tasks.schedule` | `self` | 保存受限的后台调度意图 |
| `browser.open` | 精确 HTTP(S) origin | 让系统浏览器打开获批来源下的 URL |
| `browser.callback` | `self` | 创建一次性本机回调，承接浏览器授权结果 |
| `files.selection.read/write` | `user` | 由用户选择输入文件或保存位置 |
| `materials.submit` | `configuration` | 把页面已有材料送入短期内存句柄 |
| `secrets.session.receive` | 精确 HTTP(S) origin | 由客户端接收远端敏感响应，不把正文返回页面 |
| `crypto.session.use` | `self` | 对短期句柄执行限定的校验或解密操作 |
| `runtime.protected.load` | `active-runtime` | 一次性把材料应用到当前运行时 |

网络相关 scope 必须是完整 origin，例如 `https://example.com`，不能包含用户名、密码、路径、查询或片段。`records.summary.read` 的 selection ID 只允许字母、数字、点、下划线和连字符。

## 常见流程

### 浏览器授权回调

```js
const session = await znetPlugin.browser.createCallback(componentId)
await znetPlugin.browser.open(componentId, approvedOrigin, authorizationUrl)

let result
do {
  result = await znetPlugin.browser.pollCallback(componentId, session.sessionId)
} while (result.state === 'pending')
```

回调绑定 `127.0.0.1` 的随机端口和随机路径，只能使用一次，5 分钟后到期。回调最多保留 32 个查询参数；插件应处理 `expired`、`failed` 和用户取消。

### 后台调度

```js
await znetPlugin.tasks.put(
  componentId,
  'periodic-refresh',
  'refresh',
  15 * 60,
)
```

间隔范围为 5 分钟至 7 天。宿主保存的是调度意图和动作名，不是任意业务载荷，也不保证精确时刻执行。到期执行前仍会检查组件是否启用、权限是否有效；停用、撤权和卸载会清理相关任务。

### 敏感响应与运行时应用

敏感响应不要先读入页面字符串。使用 `secrets.session.receive` 让客户端直接接收为短期句柄，再按需要调用 `crypto.session.use`，最后用 `runtime.protected.load` 一次性应用：

```js
const received = await znetPlugin.materials.receiveSecret(
  componentId,
  approvedOrigin,
  requestOptions,
)

const decoded = await znetPlugin.materials.crypto(
  componentId,
  { operation: 'chacha20poly1305_decrypt', /* 仅传句柄和必要参数 */ },
)

await znetPlugin.materials.loadRuntime(componentId, decoded.handle)
```

具体的认证协议、密钥派生和信封格式由插件与服务端定义。客户端只提供隔离、用途限制、过期、销毁和 runtime-only 应用。

## 错误处理

SDK v1 的稳定错误码如下：

| 错误码 | 处理建议 |
| --- | --- |
| `invalid_request` | 修正参数、method、scope 或预算 |
| `unsupported` | 当前宿主版本不支持该能力 |
| `permission_denied` | 引导用户到权限页审查，不要循环重试 |
| `disabled` / `revoked` | 停止业务流程，等待用户重新启用或授权 |
| `busy` | 根据 `retryAfterMs` 有界重试 |
| `expired` | 重新创建回调或短期材料 |
| `cancelled` | 视为用户取消，不显示系统故障 |
| `deadline` / `budget_exceeded` | 缩小工作量或调整合法预算 |
| `not_found` | 重新读取当前状态，不沿用旧句柄 |
| `transport` | 提示连接问题并允许用户重试 |
| `uncertain` | 外部副作用可能已经发生，先按业务幂等键查询状态 |

通知正文最多 240 个字符，每组件每分钟最多 3 条、每小时最多 20 条。通知属于用户提示，不应当用作日志流。

## 发布前检查

- manifest 只声明实际使用的 capability 和最小 scope；
- 新增权限或扩大 scope 作为显式升级变化；
- 管理页面不直接联网、不加载远端脚本、不调用 Tauri；
- 用户取消、超时、撤权和客户端重启均有恢复路径；
- 持久敏感内容是插件或服务端生成的密文/不透明信封；
- 自检结果在插件页面中以可操作信息展示，原始 JSON 只放在开发诊断中。

宿主分工、安装来源和包约束见[插件实现与宿主边界](./)。
