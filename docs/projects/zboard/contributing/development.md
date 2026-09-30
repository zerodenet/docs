# 本地开发

以下命令在 [zerodenet/zboard](https://github.com/zerodenet/zboard) 产品仓库执行。先读[贡献规范](./)；部署使用者直接看[安装指南](../guides/installation)，无需搭建开发工具链。

## 工具链 {#toolchain}

以所检出版本的 `backend/go.mod`、`frontend/package.json` 和 Dockerfile 为准。默认启动脚本使用 MySQL 8。

先运行 `./scripts/verify-env.sh`；Windows 使用 `scripts/verify-env.ps1`。不要为了本机可运行而降低生产密钥要求。

## 一键启动 {#one-command-startup}

```bash
./scripts/start-dev.sh --with-frontend
```

Windows 对应 `./scripts/start-dev.ps1 -WithFrontend`。脚本准备本地配置，按需启动数据库及前后端；已有数据库用 `--skip-deps`（PowerShell：`-SkipDependencies`）。参数以[仓库脚本](https://github.com/zerodenet/zboard/tree/cf6f2cf0838880615063e94d7f5af3113ea03d9f/scripts)为准。

默认后端 `http://127.0.0.1:8080`，前端 `http://127.0.0.1:5173`。空库启动后通过 `/setup` 初始化。

## 手动启动后端 {#manual-backend-startup}

使用 `backend/etc/zboard.yaml.example`，设置开发环境、数据库连接、JWT 密钥及固定凭据加密密钥后运行：

```bash
cd backend
go run ./cmd/zboard -f ./etc/zboard.yaml.example
```

环境变量定义见[配置示例](https://github.com/zerodenet/zboard/blob/cf6f2cf0838880615063e94d7f5af3113ea03d9f/backend/etc/zboard.yaml.example)。已有数据库先备份；只执行迁移用 `scripts/migrate.sh` 或 PowerShell 对应脚本。

## 手动启动前端 {#manual-frontend-startup}

```bash
cd frontend
pnpm install --frozen-lockfile
VITE_API_BASE=http://127.0.0.1:8080/api/v1 pnpm dev
```

PowerShell 使用 `$env:VITE_API_BASE` 设置同一值，再运行 `pnpm dev`。

## 验证改动 {#verification}

```bash
(cd backend && go test ./... && go vet ./...)
(cd frontend && pnpm test && pnpm build)
```

前端 build 包含类型检查；API 改动同步 OpenAPI 和契约测试。PR 说明列出改动、验证结果及未完成项，不把局部通过写成全量通过。

## 性能与稳定性验证 {#performance-and-stability-verification}

涉及计量、并发或节点撤权时，使用仓库的 `benchmark-accounting.sh`、`acceptance-mixed.sh` 和 `acceptance-node.sh`，按脚本准备隔离数据库、可信 Zero 制品与测试凭据。记录负载、时长和环境；模拟 HTTP/SSH 不能代替真实客户端连通和撤权验证，短测不能证明生产容量。

## 受限网络环境 {#restricted-networks}

工具链准备使用 `scripts/ensure-go-env.*`；可信镜像可通过 `ZBOARD_GO_DOWNLOAD_BASE` 指定，已安装工具链使用 `ZBOARD_GOROOT_FALLBACK`。不要提交生成的运行配置、私钥、令牌或机器专用日志。
