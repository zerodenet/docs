# ZeroDeNet 项目文档

ZeroDeNet 项目组的公开文档仓库。当前接入的独立项目：

- [Zero Core](https://github.com/zerodenet/core)
- [ZNet Sink](https://github.com/zerodenet/znet-sink)

## 本地开发

需要 Node.js 22 或更高版本，并启用 Corepack。

```powershell
corepack enable
pnpm install
pnpm dev
```

默认开发地址为 `http://localhost:5173`。

## 质量检查

```powershell
pnpm check
pnpm check:build
```

`pnpm check` 检查项目注册、入口页、UTF-8、标题、本地链接、显式侧栏和跨项目链接边界；`pnpm check:build` 额外验证 VitePress 生产构建和构建产物。

## 内容边界

- `docs/projects/<project>/`：每个项目独立的使用文档、接口契约和贡献入口。
- 项目侧栏、面包屑和上一页/下一页只连接同一项目内的页面。
- 版本、兼容性、契约和贡献规则由对应项目维护，不设置全站共享版本。
- 临时调查、内部实现计划和问题记录应留在对应代码仓库。

新增项目时，优先使用项目脚手架创建注册信息和入口页，然后由维护者补充显式导航：

```powershell
pnpm create:project -- --id example --name "Example" --description "项目简介" --repository "https://github.com/zerodenet/example"
```

脚手架会创建项目注册信息和基础页面。维护者还需要在 `docs/.vitepress/navigation.ts` 中添加该项目自己的侧栏，并确保页面不进入其他项目的阅读序列。

## 单向导入 Core 公开文档

这是迁移期使用的单向导入工具。它只复制公开指南、协议、当前控制面契约和选定的稳定参考资料，不会导入历史控制面设计和测试记录：

```powershell
pnpm migrate:core C:\path\to\core\docs
pnpm check:build
```

脚本会覆盖已映射的目标页面，并把原仓库内链接转换为独立文档站路由；未迁移的工程文档会链接回 Core 仓库，避免生成失效页面。

迁移完成后，本仓库是 Core 公开文档的唯一维护位置。不要建立从本仓库回写 Core 的流程，也不要在两个仓库继续修改同一篇公开文档。Core 仓库后续只保留内部工程资料和指向本站的入口。
