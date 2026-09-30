# 参与 ZNet Sink

ZNet Sink 是 Tauri 2/SvelteKit 桌面客户端；Zero Core 是单独维护的代理内核。客户端界面、订阅和桌面集成问题在 [ZNet Sink 仓库](https://github.com/zerodenet/znet-sink)处理。普通使用从[用户指南](../guides/)开始。

## 反馈问题

先搜索 [Issues](https://github.com/zerodenet/znet-sink/issues)，再附上客户端与内核版本、系统/架构、最小复现步骤、期望结果及第一条错误。说明使用的是正式版、候选版还是源码构建。

反馈界面问题时说明简约/专业模式；反馈网络问题时说明系统代理、TUN 和 DNS 状态。按[诊断指南](../guides/data-and-diagnostics)检查材料，不公开订阅 URL、密码、令牌或私人流量。

## 贡献代码

先阅读仓库的 [AGENTS.md](https://github.com/zerodenet/znet-sink/blob/main/AGENTS.md)和[提交规范](https://github.com/zerodenet/znet-sink/blob/main/COMMIT_CONVENTION.md)，按对应分支的 package.json、Cargo 配置和检查脚本准备环境；不要仅按旧 README 的最低版本推断当前依赖。

提交变更时说明用户可见变化、验证命令和未验证的平台。界面变更需检查简约/专业模式、窄窗口、重复操作和失败恢复；涉及代理、TUN、更新或退出清理时，自动化测试不能代替实际安装环境验证。

插件作者从源码仓库的[插件包格式](https://github.com/zerodenet/znet-sink/blob/main/docs/gui/plugin-package-v1.md)和[插件 SDK](https://github.com/zerodenet/znet-sink/blob/main/docs/gui/plugin-sdk.md)查阅当前契约。实现计划不等于已发布能力；以对应版本代码和实际校验结果为准。

## 修改文档

公开文档优先回答用户要做什么、在哪里操作、成功应看到什么以及失败后去哪里。字段或实现细节只在操作必需时展开，不复制内部开发进度作为使用教程。

核对客户端界面、Zero 内核及发布制品的版本差异；新增功能标明正式版、候选版或源码范围。截图需脱敏并注明演示数据，不能把构建成功写成跨平台安装验收完成。

返回 [ZNet Sink 文档](../)。
