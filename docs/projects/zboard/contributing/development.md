# 本地开发

本页说明贡献者如何启动开发环境和验证改动。项目定位与功能范围见 [ZBoard 首页](../)。以下命令在产品代码仓库中执行。

## 工具链 {#toolchain}

使用仓库声明的版本：

- Go 版本及工具链见 `backend/go.mod`。
- Node.js 版本以前端项目及 Docker 构建配置为准。
- pnpm 版本见 `frontend/package.json` 的 `packageManager`。
- 默认本地启动流程使用 MySQL 8。

环境检查脚本可以自动准备仓库指定的 Go 工具链：

```powershell
.\scripts\verify-env.ps1
```

```bash
./scripts/verify-env.sh
```

## 一键启动 {#one-command-startup}

启动脚本会检查依赖，按需通过 Docker Compose 启动 MySQL，生成被 Git 忽略的本地运行配置，然后启动后端和可选的前端。

PowerShell：

```powershell
.\scripts\start-dev.ps1 -WithFrontend
```

Bash：

```bash
./scripts/start-dev.sh --with-frontend
```

已有独立 MySQL 服务时，使用 `-SkipDependencies` 或 `--skip-deps`。端口、超时和数据库连接选项见脚本帮助或参数说明。

后端地址为 `http://127.0.0.1:8080`，前端开发服务默认地址为 `http://127.0.0.1:5173`。

## 手动启动后端 {#manual-backend-startup}

需要准备数据库连接、至少 32 字节的 JWT 密钥和固定的 32 字节凭据加密密钥：

```powershell
Set-Location backend
$env:ZBOARD_ENVIRONMENT = "development"
$env:ZBOARD_DATA_SOURCE = "zboard:<password>@tcp(127.0.0.1:3306)/zboard?charset=utf8mb4&parseTime=true&loc=Local"
$env:ZBOARD_JWT_SECRET = "<at-least-32-random-bytes>"
$env:ZBOARD_CREDENTIAL_ENCRYPTION_KEY = "<32-random-bytes-as-base64-or-hex>"
go run ./cmd/zboard -f ./etc/zboard.yaml.example
```

空数据库启动后进入安装模式，访问 `/setup` 创建首个管理员并完成初始化。

服务启动时会执行内嵌 SQL 迁移。只执行迁移而不启动 HTTP 服务时，可使用 `scripts/migrate.ps1` 或 `scripts/migrate.sh`。使用新构建打开已有数据库前先备份，并检查目标构建附带的迁移文件；不要修改已发布的迁移历史。

## 手动启动前端 {#manual-frontend-startup}

PowerShell：

```powershell
Set-Location frontend
$env:VITE_API_BASE = "http://127.0.0.1:8080/api/v1"
pnpm install --frozen-lockfile
pnpm dev
```

Bash：

```bash
cd frontend
pnpm install --frozen-lockfile
VITE_API_BASE=http://127.0.0.1:8080/api/v1 pnpm dev
```

## 验证改动 {#verification}

根据改动范围执行检查。完整的本地检查包括：

```powershell
Set-Location backend
go test ./...
go vet ./...

Set-Location ..\frontend
pnpm test
pnpm build
```

`pnpm build` 包含 Vue 和 TypeScript 类型检查。API 改动还需要同步 `backend/api/openapi.yaml` 及接口契约测试。

仓库还提供以下脚本：

- `scripts/smoke-test.*`：检查已运行的服务。
- `scripts/build-all.*`：构建后端和前端。
- `scripts/check-go-version.*`、`scripts/sync-go-baseline.*`：检查和维护 Go 工具链版本。

## 性能与稳定性验证 {#performance-and-stability-verification}

从仓库根目录执行，`GO_BIN` 可指定 Go 程序路径：

```bash
bash scripts/benchmark-accounting.sh local
bash scripts/benchmark-accounting.sh container
bash scripts/acceptance-mixed.sh
```

计量基准默认每个场景使用 100 个批次、运行三次，可通过 `BENCH_TIME` 和 `BENCH_COUNT` 调整。容器检查需要 Docker。混合负载默认使用 10 个节点、1,000 份订阅、100,000 条历史记录、四个并发读取方和每秒 100 个事件，持续 300 秒；通过 `DURATION_SECONDS`、`EVENT_RATE`、`READERS` 调整负载。

应用和数据库共同使用 1 CPU / 1 GiB 资源预算，负载生成器在预算之外运行。根据测试环境设定延迟和内存要求，并核对重复、乱序事件下的计量结果、失败原因和积压是否排空。

真实 Zero 撤权验证应使用隔离节点和测试凭据：

```bash
ZERO_ARTIFACT_DIR=/path/to/verified-linux-zero-artifact \
  NODE_SCENARIO=expiry bash scripts/acceptance-node.sh
```

制品目录需要包含 `zero` 和对应的 `verification.json`。其他场景包括 `exhaustion`、`group_change` 和 `recovery`。应验证实际代理连接、已有连接和配置恢复情况，控制接口或模拟 SSH 的结果不能替代真实连接验证。

原始日志、性能记录、环境信息和源码摘要保存在被忽略的 `.codex-local-artifacts/acceptance/` 中。每秒 500 个事件的 60 秒突发与 24 小时持续运行是独立测试；更换构建或重置环境后重新计时。短时间测试不能证明长期稳定性或生产容量。

## 受限网络环境 {#restricted-networks}

缺少工具链时，`scripts/ensure-go-env.*` 可以安装指定 Go 版本。无法直接访问 `go.dev` 时，可将 `ZBOARD_GO_DOWNLOAD_BASE` 指向可信镜像，或通过 `ZBOARD_GOROOT_FALLBACK` 指定已安装的 Go 目录。

不要为解决本地环境问题降低生产密钥要求，也不要提交生成的运行配置。
