# 参与 Zero Core

本页只说明如何参与 Zero Core 项目。问题、代码评审、发布、兼容性和控制面契约均由 Zero Core 项目维护。

## 反馈问题

提交问题前，请先搜索 [Zero Core Issues](https://github.com/zerodenet/core/issues)，并准备以下信息：

- `zero` 版本或构建标识、平台和启用的构建特性；
- 最小配置与可重复的启动或请求步骤；
- 首个错误、相关日志和实际返回的能力信息；
- 预期行为以及是否属于已登记的破坏性变更。

请删除配置中的密码、密钥、令牌、真实节点地址和私人流量信息。

## 贡献代码

代码变更从 [Zero Core 仓库](https://github.com/zerodenet/core) 发起。提交拉取请求时，请说明受影响的协议或运行路径、验证命令、互操作范围和已知限制。

控制面行为发生变化时，需要同步更新本项目的[控制面契约](../control-plane/contract)和[兼容性与破坏性变更](../control-plane/breaking-changes)，不能只修改接口结构。

## 修改文档

Zero Core 的公开文档位于本目录。文档变更应以当前实现、能力响应和可复验结果为依据，并留在 Zero Core 的侧栏和阅读序列内。

返回 [Zero Core 文档](../)。
