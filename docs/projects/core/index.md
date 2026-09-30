# Zero Core

<ProjectMeta project-id="core" />

Zero Core 是处理代理连接、分流和 DNS 的命令行程序。你可以把它运行在自己的电脑、网关或远程服务器上，用一个 JSON 文件决定流量从哪里进入、经过哪个代理、哪些目标直连。

如果你想通过界面导入订阅、切换节点和开关系统代理，请从[项目选择](/projects/)找到 ZNet Sink。下面的指南面向直接运行 `zero` 的用户。

## 第一次使用

1. [安装与构建](./guides/installation)：下载适合系统的发行包，确认可执行文件能运行。
2. [启动第一个节点](./guides/quickstart)：复制完整配置，让一次请求经过本地代理。
3. [配置基础](./guides/configuration-basics)：填入自己的服务器和凭证，把流量交给远程节点。
4. [运行与观测](./guides/operations)：查看当前连接、切换节点、更新配置与停止程序。

完成前两步不需要服务器或管理员权限。测试配置使用直连出口，不会改变系统代理或接管所有应用。

## 我想完成……

| 目标 | 从这里开始 |
|------|------------|
| 使用已有的远程节点 | [协议配置](./protocols/) |
| 让浏览器或命令行工具使用本地代理 | [HTTP / Mixed 代理入口](./guides/proxy-and-urltest) |
| 多个节点手动切换或自动测速 | [运行模式与出站组](./configuration/modes-and-groups) |
| 接管应用的 TCP、UDP 和普通 DNS 查询 | [运行 TUN 与 DNS](./guides/tun-and-dns) |
| 域名分流、指定 DNS 或使用 Fake-IP | [DNS 参数与示例](./configuration/dns) |
| 修改配置而不重启进程 | [安全热更新配置](./guides/hot-reload) |
| 无法启动、连不上或 TUN 断网 | [故障排查](./guides/troubleshooting) |

## DNS 与透明代理

先用本地代理确认节点可用，再开启 TUN。TUN 需要系统权限并会修改捕获路由；按 [TUN 使用指南](./guides/tun-and-dns)逐项验证 DNS、TCP 和 UDP，再用于日常运行。Fake-IP、双栈和严格路由各有独立配置，开启其中一个不代表其他能力已生效。

## 查字段和协议

- [完整配置字段](./configuration/)
- [协议配置示例](./protocols/configuration)
- [协议能力与限制](./reference/protocol-capabilities)
- [CLI 命令](./control-plane/cli)
- [按需裁剪构建](./configuration/features)

## 接口怎么选

只运行代理时不必阅读 API 契约。需要让脚本、GUI 或外部服务管理 Zero 时，再选择对应接口：

| 场景 | 入口 |
|------|------|
| 同机人工操作 | CLI，通过本地 IPC 连接 |
| 同机 GUI | [IPC 与 GUI 接入](./guides/gui-integration) |
| 运维脚本、控制服务 | [HTTP / gRPC 控制 API](./guides/control-api) |
| 节点主动投递事件 | [Connector Webhook](./guides/connector-integration) |

跨主机访问前先阅读[控制接口安全](./guides/control-security)。完整字段、事件和格式契约保留在[控制接口参考](./control-plane/)与[技术参考](./reference/)，无需作为入门前置知识。

::: info 文档对应版本
本轮核对日期为 2026-09-30：正式发行版为 [v0.0.1](https://github.com/zerodenet/core/releases/tag/v0.0.1)，最新候选版为 [v0.0.2-rc.202609290540](https://github.com/zerodenet/core/releases/tag/v0.0.2-rc.202609290540)。使用教程以已对外发布的候选版及其 [2d75265 源码](https://github.com/zerodenet/core/tree/2d7526596e91ea1259c3692501a02672ca826cfd)为核对基线；WireGuard 单独标记为已发布开发版 [v0.0.3-dev.202609281319](https://github.com/zerodenet/core/releases/tag/v0.0.3-dev.202609281319) 的实验能力。未发布的 develop 提交不作为安装包能力。安装后以 `zero build-info` 和实际配置校验为准。
:::
