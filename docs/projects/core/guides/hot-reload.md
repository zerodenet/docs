# 安全热更新配置

Zero 可以在进程运行期间应用完整配置，包括监听器、协议凭证、路由、出站、策略组、事件 sink 和部分应用服务。更新采用“校验、重建、确认、失败回滚”的事务路径。

## CLI 流程

准备完整候选文件 `candidate.json`：

```bash
zero validate candidate.json
zero reload candidate.json
zero status --json
```

`reload` 会读取候选文件并通过本地 IPC 执行 `config.apply`。成功时输出：

```text
config applied
```

这表示 Zero 已等待 listener 和相关应用服务完成 reconciliation，不只是接受了请求。

## HTTP/gRPC 流程

控制端使用同一个完整配置依次调用：

1. `config.validate`
2. `config.apply`
3. 查询 `/api/v1/runtime`、`/api/v1/policies` 和 `/api/v1/sinks`

`config.apply` 会持久化到运行实例的源配置文件。只需要临时运行覆盖时使用 `config.apply_runtime`；进程重启后仍以源配置为准。

## 哪些变更可以在线应用

- 新增、删除或修改 inbound；
- listener 地址、端口、协议形状变化；
- 协议凭证列表变化；
- outbound、路由、mode 和策略组变化；
- DNS 与通用运行参数；
- FlowHook；
- Connector/JSONL sink、outbox 和 dispatcher 策略。

同 tag listener 的形状变化会重启该 listener。只改变协议认证条目时，支持该能力的协议会走自己的热更新路径。

## 不能在线自替换的内容

`api.control` 的监听地址、API key 来源和 gRPC 安全配置不能通过承载该命令的控制面自替换。否则响应通道和权限可能在事务中途消失。

修改这些字段时：

1. 生成并校验新配置；
2. 保留旧配置和二进制；
3. 由 systemd、Windows 服务管理器或部署平台重启；
4. 从新控制端点检查健康；
5. 失败时恢复旧配置并重新启动。

程序二进制升级也不属于 `config.apply`，由部署系统负责。

## 失败时会发生什么

如果新 listener 无法绑定，或 EventDispatcher、FlowHook 等应用服务重建失败，Zero 会尝试恢复上一份运行配置和对应服务。错误响应会说明应用失败以及回滚是否成功。

常见失败原因：

- 新端口已被其他进程占用；
- 配置引用了未编译的协议；
- 证书、规则文件或状态目录不可读写；
- Connector 配置存在，但二进制没有 `event-dispatcher`/`connector`；
- 候选配置试图修改 `api.control`。

失败后不要只重试同一请求。先确认旧 listener、策略和 sink 状态仍然正常，再修正候选配置。

## 多个写入者

`config.apply` 接收整份配置。当前外部合同没有 revision/CAS 字段，因此一个旧副本可能在业务层覆盖另一个控制端的更新。

生产部署应保证一个节点只有一个配置写入所有者。其他系统通过该所有者提交变更，或只执行不会替换整份配置的通用命令。
