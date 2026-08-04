# DNS 与证书管理

Zboard 可以通过供应商账号维护节点域名记录，并在节点上签发和续期协议服务使用的证书。DNS 记录、证书资产和协议服务保持独立，便于分别审计和重试。

## 托管 DNS 记录

创建 DNS 记录时需要选择供应商账号、目标节点、域名、记录类型和值。当前托管记录以 Cloudflare Zone 和 record ID 作为远端身份。

创建后可编辑：

- 目标节点；
- A/AAAA 记录值；
- TTL；
- Cloudflare 代理状态。

供应商账号、完整域名和记录类型属于身份字段，不能原地修改。需要改变这些字段时，删除旧记录后重新创建。

保存修改会立即进入供应商同步。编辑页面使用 revision 防止两个会话互相覆盖；出现冲突时刷新记录后重新提交。

## 删除 DNS 记录

删除操作会先删除 Zboard 保存的那个 Cloudflare record ID，再移除本地期望状态：

- 远端删除成功后，删除面板记录；
- 供应商返回 404 时，视为远端已经不存在，可以继续清理本地记录；
- 鉴权、权限或其他供应商错误会保留面板记录，便于修复后重试；
- 同一记录有同步操作正在运行时，不允许并发删除。

Zboard 不会按域名模糊删除其他记录。

## 创建证书

创建托管证书时需要确定：

- 目标节点；
- 一个或多个域名；
- ACME 环境；
- 验证方式；
- 联系邮箱；
- 自动续期策略。

目标节点、域名、环境、验证方式和供应商身份定义了证书资产边界，创建后不可原地修改。需要改变这些字段时，新建证书并重新绑定协议服务。

可编辑字段包括：

- 显示名称；
- ACME 联系邮箱；
- HTTP-01 Webroot；
- 是否自动续期；
- 提前续期天数，范围为 1–60 天。

签发或续期正在运行时不能编辑证书。编辑同样使用 revision 冲突保护。

## HTTP-01 Webroot

HTTP-01 Webroot 要求域名的 80 端口最终把：

```text
/.well-known/acme-challenge/<token>
```

映射到所选节点上的 Webroot 目录。

签发前，Zboard 会在节点 Webroot 写入一次性测试文件，再从公开域名请求该地址并比较返回内容。节点优先使用 `curl`，没有时使用 `wget`；只允许 HTTP/HTTPS 请求和重定向。

预检失败通常表示：

- A/AAAA 记录未指向目标节点；
- 80 端口不可达；
- 反向代理没有把 challenge 路径映射到 Webroot；
- HTTP 被跳转到错误位置；
- 返回内容被应用路由或缓存替换。

仅控制端缺少到某个 IPv6 地址的路由时，不会直接认定远端 AAAA 不可用；明确的连接拒绝或超时仍会阻止签发。

## DNS-01 Cloudflare

DNS-01 需要供应商账号提供有效的 Cloudflare API Token。Zboard 在节点上准备 Certbot Cloudflare 插件时按以下顺序尝试：

1. 使用系统包管理器安装 `python3-certbot-dns-cloudflare` 或发行版对应包；
2. 如果发行版没有该包，在 `/opt/zboard-certbot` 创建隔离 Python virtual environment；
3. 如果 venv 不可用，再把 Certbot 和插件安装到 `/opt/zboard-certbot-packages`，通过独立 wrapper 运行。

每一步都会检查 Certbot 是否真正列出 `dns-cloudflare` 插件。系统包、venv 和 pip target 都失败时，任务会返回明确错误，而不是继续执行一个缺少插件的 Certbot。

节点至少需要：

- root 权限；
- 可用的系统包管理器或 Python 3；
- 到 Python 包源和 ACME 服务的网络；
- 足够的磁盘空间；
- 正确权限的 Cloudflare Token。

## 证书绑定与续期

证书签发成功后，可以绑定到同一节点的 TLS 协议服务。绑定前确认域名覆盖、有效期和证书状态。

启用自动续期时，Zboard 根据“提前续期天数”计算下一次续期时间。修改该值会重新计算计划。续期失败不会删除当前证书文件；处理错误后可以重试。

## 常见错误

### HTTP-01 返回 unauthorized

不要只检查 DNS 解析。直接从公网请求 challenge URL，确认内容等于测试 token，并检查 HTTPS 跳转是否仍能访问同一 Webroot。

### 找不到 `python3-certbot-dns-cloudflare`

这是发行版仓库缺包，不代表只能放弃 DNS-01。查看任务日志是否继续尝试 venv 和 pip target；若全部失败，补齐 Python、venv/pip 或节点外网访问后重试。

### 找不到 `python3-venv`

某些发行版按 Python 次版本提供 venv 包。自动流程会尝试对应的 `pythonX.Y-venv`，随后还有 pip target 回退。仍失败时检查软件源配置和 Python 安装完整性。

### DNS 删除后面板记录仍存在

查看供应商返回错误。除远端 404 外，鉴权和权限错误会保留本地记录，这是为了避免面板误认为远端资源已经删除。

### 证书无法编辑

确认没有签发或续期任务正在运行，并刷新页面获取最新 revision。资产身份字段需要新建证书，不能通过编辑修改。
