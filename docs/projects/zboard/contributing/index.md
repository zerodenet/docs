# 参与 ZBoard

ZBoard 面向自用与分享：核心保留日常节点、账户和订阅管理，额外能力通过明确的插件接口扩展。贡献应保留已有可用流程，不因定位调整擅自删除订单、供应商、DNS 或证书等功能。

## 文档贡献

使用文档维护在 [zerodenet/docs](https://github.com/zerodenet/docs) 的 `docs/projects/zboard/`，产品仓库的本地 `docs/` 不参与发布。

- 先写使用者要完成的任务、操作步骤和成功标准，避免按内部模块罗列实现。
- 功能声明核对具体 Release，区分正式、RC 和仅源码可见的能力。
- 保留已有链接与锚点；新增页面才更新导航，完成后运行 `pnpm check:build`。
- 临时方案、测试日志和机器配置不放进公开用户指南。

## 代码与插件贡献

产品代码和缺陷提交到 [ZBoard 仓库](https://github.com/zerodenet/zboard)，按 [CONTRIBUTING.md](https://github.com/zerodenet/zboard/blob/cf6f2cf0838880615063e94d7f5af3113ea03d9f/CONTRIBUTING.md) 的分支、提交和验证要求执行。

项目约定：

1. API 变更同步 `backend/api/openapi.yaml` 和契约测试。
2. 数据结构由 `backend/migrations/` 的版本化 SQL 管理，不修改已发布迁移或改用运行时 AutoMigrate。
3. SSH、发布、支付回调和权限变更等敏感操作保留校验、幂等与审计测试。
4. 插件使用已开放的窄接口，不能绕过核心权限或把原生进程当作安全沙箱。
5. 后端运行测试与 vet；前端运行测试、类型检查和生产构建。涉及节点行为时补真实节点/客户端验证，未运行的检查明确记录。

[本地启动与验证](./development)是贡献环境入口。[插件开发约定](../plugins/development)只保留打包、信任和接口的必要说明，完整契约链接到对应源码，避免维护另一份实现手册。
