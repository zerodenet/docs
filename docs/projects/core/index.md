# Zero Core

<ProjectMeta project-id="core" />

Zero Core 是使用 Rust 编写的网络代理内核。这里优先记录可以验证的技术参数、协议能力、配置模型、运行时行为和控制面契约。

## 技术参数入口

| 关注点 | 文档入口 |
| --- | --- |
| 运行形态、构建预设、协议与控制接口 | [技术参数总览](./reference/technical-specifications) |
| TCP、UDP、MUX、传输方式和互操作状态 | [协议能力矩阵](./reference/protocol-capabilities) |
| Cargo features 与能力裁剪 | [构建特性](./configuration/features) |
| 入站、出站、路由、DNS 和运行时配置 | [配置参考](./configuration/) |
| HTTP、gRPC、IPC、CLI 和事件 | [控制面](./control-plane/) |
| API、事件信封和错误语义 | [控制面契约](./control-plane/contract) |

## 运行与接入

- 第一次运行：阅读[快速开始](./guides/quickstart)。
- 开发 GUI 或本地控制端：阅读[GUI 接入 Core](./guides/gui-integration)。
- 开发控制端或节点管理系统：阅读[Connector 接入](./guides/connector-integration)和[Connector 通信边界](./architecture/connector)。
- 理解模块和请求路径：进入[总体架构](./architecture/)。

## 文档边界

这里维护 Core 对外稳定的使用、配置、协议和控制面文档。历史设计方案、专项测试记录和仅服务于仓库维护者的工程计划仍保留在 Core 代码仓库中。

运行时集成方应以 Core 返回的能力信息和当前控制面契约为准，不根据页面存在与否推断某个构建一定包含对应 feature。

## 项目入口

- [快速开始](./guides/quickstart)
- [技术参数总览](./reference/technical-specifications)
- [控制面契约](./control-plane/contract)
- [兼容性与破坏性变更](./control-plane/breaking-changes)
- [参与 Zero Core](./contributing/)
