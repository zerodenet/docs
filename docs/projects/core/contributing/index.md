# 参与 Core 开发

使用代理不需要阅读本页。如果要修复 Core、增加协议能力或贡献文档，请先在 [Core 仓库](https://github.com/zerodenet/core)说明问题、预期行为和可复现步骤。

## 提交到哪里

- 内核、协议、测试和源码示例：`zerodenet/core`
- 面向使用者的教程、配置说明和本网站：`zerodenet/docs`
- 新功能与一般修复面向 `develop`；涉及正式线回补或发布时，先与维护者确认目标分支

提交 PR 时写清影响的配置/平台、验证命令与结果，以及仍未执行的测试。协议、配置或行为变化应同时更新示例和用户文档；不要把设计计划写成已发布能力。

## 代码边界

Core 是 Rust workspace。新增实现遵守现有职责划分：

- `protocols/`：协议认证、握手、帧格式和协议状态
- `crates/config`：配置结构、引用和验证；协议私有校验委托给协议模块
- `crates/engine` / `crates/router`：路由决策、策略和运行状态
- `crates/proxy`：连接生命周期、协议能力调度、重载与转发编排
- `crates/transport`：共享载体；`crates/traits` 保持运行时中立

不要在命令行入口或通用运行时增加按协议特判的第二套执行流程。协议参考版本固定到已选上游版本与提交，不能用版本号相同推断完整兼容。

## 提交前检查

在 Core 仓库执行：

```bash
cargo fmt --all -- --check
cargo check --workspace
cargo clippy --workspace --all-targets --all-features -- -D warnings
RUST_MIN_STACK=16777216 cargo test --workspace --all-features
cargo build --release --locked
```

Windows PowerShell 先设置 `$env:RUST_MIN_STACK = "16777216"`，再执行测试命令。行为变更增加对应回归；涉及协议、配置解析、路由或运行时接线时执行工作区测试。特权 TUN、外部协议互操作和平台专用场景需在相应环境验证，跳过测试不能写成通过。

纯网站文档修改在 docs 仓库执行 `pnpm check:build`，并检查页面、链接、锚点和示例配置。

本页仅概括协作入口。详细分层约束见 [Core 仓库规范](https://github.com/zerodenet/core/blob/2d7526596e91ea1259c3692501a02672ca826cfd/AGENTS.md)，当前自动检查见 [CI 工作流](https://github.com/zerodenet/core/blob/2d7526596e91ea1259c3692501a02672ca826cfd/.github/workflows/ci.yml)。
