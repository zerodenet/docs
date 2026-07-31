# ZeroDeNet Documentation

ZeroDeNet 官方文档仓库，统一维护旗下开源项目的使用指南、部署说明、配置参考、接口契约与贡献文档。

## 在线文档

* 正式站点：https://docs.zerodenet.org
* 开发预览：https://zerodenet.github.io/docs/

正式站点基于 `main` 分支发布，开发预览基于 `develop` 分支发布。

## 收录项目

| 项目        | 说明                             | 仓库                                                            |
| --------- | ------------------------------ | ------------------------------------------------------------- |
| Zero Core | ZeroDeNet 核心服务及相关协议、接口与部署文档    | [zerodenet/core](https://github.com/zerodenet/core)           |
| ZNet Sink | ZeroDeNet 桌面代理客户端的使用、配置与平台兼容文档 | [zerodenet/znet-sink](https://github.com/zerodenet/znet-sink) |
| ZBoard    | 一站式机场面板管理平台的部署、初始化、节点管理与使用文档   | [zerodenet/zboard](https://github.com/zerodenet/zboard)       |

各项目在文档站中拥有独立的导航、页面结构和内容边界，避免不同项目的版本、配置和使用语义相互混淆。

## 文档范围

本仓库主要维护面向用户、部署人员和集成开发者的公开文档，包括：

* 项目介绍与能力说明；
* 安装、部署和初始化指南；
* 配置项与环境变量说明；
* 节点、协议和功能使用指南；
* API、Webhook、gRPC 等公开接口契约；
* 常见问题与故障排查；
* 兼容性、升级和迁移说明；
* 面向贡献者的公开协作说明。

内部设计记录、临时调查、开发计划、测试记录和未稳定的实现方案，应保留在对应项目仓库中。

## 内容组织

每个项目的文档位于独立目录：

```text
docs/
└── projects/
    ├── core/
    ├── znet-sink/
    └── zboard/
```

项目注册信息维护在：

```text
docs/.vitepress/projects.json
```

导航与侧栏配置维护在：

```text
docs/.vitepress/navigation.ts
```

新增页面时，应确保：

* 页面位于对应项目目录中；
* 页面标题和导航名称清晰；
* 本地链接可以正常访问；
* 不将页面加入其他项目的阅读序列；
* 版本和兼容性说明归属于具体项目；
* 代码问题指向对应代码仓库处理。

## 提交文档问题

文档内容错误、缺失、链接失效或表达不清，可以在本仓库提交 Issue。

涉及程序行为、运行错误、功能需求或安全问题时，请前往对应项目仓库提交：

* [Zero Core Issues](https://github.com/zerodenet/core/issues)
* [ZNet Sink Issues](https://github.com/zerodenet/znet-sink/issues)
* [ZBoard Issues](https://github.com/zerodenet/zboard/issues)

## 分支与发布

本仓库采用以下分支流程：

```text
功能分支
    ↓
develop
    ↓
GitHub Pages 开发预览
    ↓
main
    ↓
正式文档站
```

* `develop`：接收文档变更并生成开发预览；
* `main`：保存已经确认并准备正式发布的文档；
* 功能分支：用于编写单个项目、主题或批次的文档变更。

文档变更应优先合并到 `develop`，确认预览效果后再同步到 `main`。

## 本地开发

需要：

* Node.js 22 或更高版本；
* pnpm；
* Corepack。

启用 Corepack 并安装依赖：

```bash
corepack enable
pnpm install
```

启动本地开发服务器：

```bash
pnpm dev
```

默认访问地址：

```text
http://localhost:5173
```

## 质量检查

运行基础文档检查：

```bash
pnpm check
```

运行完整构建检查：

```bash
pnpm check:build
```

检查范围包括：

* 项目注册信息；
* 项目入口页面；
* Markdown 标题；
* UTF-8 编码；
* 本地链接；
* 项目导航与侧栏；
* 跨项目链接边界；
* VitePress 生产构建；
* 构建产物完整性。

提交变更前，应至少运行：

```bash
pnpm check:build
```

## 新增项目

可以使用项目脚手架创建基础注册信息和入口页面：

```bash
pnpm create:project -- \
  --id example \
  --name "Example" \
  --description "项目简介" \
  --repository "https://github.com/zerodenet/example"
```

脚手架执行后，还需要：

1. 补充项目介绍与使用文档；
2. 在 `docs/.vitepress/navigation.ts` 中添加导航和侧栏；
3. 检查项目页面之间的阅读顺序；
4. 运行 `pnpm check:build`；
5. 提交到功能分支并合并至 `develop` 进行预览。

## License

本仓库中的文档内容按照仓库所声明的许可协议发布。各项目代码的许可协议以对应项目仓库为准。
