# 部署方案

本仓库由 GitHub Actions 构建，部署到 Cloudflare Pages，并使用 GitHub Pages
提供独立的公开预览。Cloudflare 和 GitHub Pages 均接收同一提交生成的静态
VitePress 文件，不在托管平台上再次安装或构建依赖。

## 分支与触发关系

| 来源 | CI | Cloudflare Pages | GitHub Pages |
| --- | --- | --- | --- |
| Pull Request | 检查和构建 | 不部署 | 不部署 |
| `main` 推送 | 检查和构建 | 生产部署 | 不部署 |
| `develop` 推送 | 检查和构建 | 预览部署 | 公开预览 |
| 手动触发 | 可选分支 | 仅允许 `main` 或 `develop` | 仅允许 `develop` |

Cloudflare Pages 项目的生产分支必须是 `main`。工作流把当前 Git 分支传给
Wrangler，因此 `main` 会更新生产站点，`develop` 会生成 Cloudflare 分支
预览。

GitHub Pages 只跟随 `develop`，构建时使用 `/docs/` 仓库子路径，并生成
`noindex, nofollow` 元数据。Cloudflare 的 `develop` 预览也使用相同的
`noindex` 设置；只有 `main` 生产站允许搜索引擎索引。

## 依赖与构建

本地、CI 和两个部署工作流统一使用：

```powershell
pnpm install --frozen-lockfile
pnpm check:build
```

pnpm 版本由 `package.json` 的 `packageManager` 固定。`--frozen-lockfile`
确保远端只同步 `pnpm-lock.yaml` 已记录的依赖，不会在部署期间自行升级或
改写锁文件。依赖版本更新应单独提交 `package.json` 和 `pnpm-lock.yaml`，
通过 CI 后再合并。

## 第一次部署

远端仓库当前为空。第一次推送按以下顺序执行。

### 1. 准备 Cloudflare

在 Cloudflare 创建 Direct Upload Pages 项目：

- 项目名：`zerodenet-docs`
- 生产分支：`main`

创建权限范围为 **Account / Cloudflare Pages / Edit** 的 API Token，然后在
GitHub 仓库的 **Settings > Secrets and variables > Actions** 添加：

- `CLOUDFLARE_API_TOKEN`
- `CLOUDFLARE_ACCOUNT_ID`
- `CLOUDFLARE_PAGES_PROJECT`：可选；项目名不是 `zerodenet-docs` 时才添加

Secrets 必须在第一次推送前存在，否则 CI 可以通过，但 Cloudflare 部署会
在上传阶段失败。

### 2. 提交并推送 `main`

先运行：

```powershell
pnpm check:build
```

确认通过后，提交当前工作区并推送 `main`。第一次推送会：

1. 在 GitHub 建立默认分支 `main`。
2. 运行 Documentation CI。
3. 独立执行相同检查并部署 Cloudflare 生产站。
4. 不触发 GitHub Pages。

在 GitHub Actions 中确认两个工作流成功，并在 Cloudflare Deployments 中
确认该提交对应的生产部署。

### 3. 启用并推送 `develop`

`main` 首次推送成功后：

1. 在 GitHub **Settings > Pages** 中把 Source 设置为 **GitHub Actions**。
2. 让本地 `develop` 快进到已经提交的 `main`。
3. 推送 `develop`。

这次推送会同时运行 CI、Cloudflare `develop` 预览和 GitHub Pages 预览。
GitHub Pages 地址通常为 `https://zerodenet.github.io/docs/`；实际地址以
Actions 的 deployment 输出为准。

## 日常发布流程

1. 功能或文档改动通过 Pull Request 合入 `develop`。
2. `develop` 自动更新 Cloudflare 与 GitHub Pages 两个预览。
3. 验收预览后，把 `develop` 合入 `main`。
4. `main` 自动更新 Cloudflare 生产站。

需要重新部署现有提交时，可在 Actions 中手动运行工作流并选择对应分支。
手动部署仍会重新安装锁定依赖并执行完整检查，不会上传未经验证的本地产物。

## 失败处理

- 检查、构建或安装失败时不会执行上传。
- 同一分支的新部署会取消仍在运行的旧部署，避免旧提交后完成并覆盖新提交。
- Cloudflare 部署失败不会影响当前在线版本。
- 生产内容有问题时，优先回退 Git 提交并重新推送；紧急情况下可先在
  Cloudflare Pages 的 Deployments 页面回滚到之前成功的生产部署。
