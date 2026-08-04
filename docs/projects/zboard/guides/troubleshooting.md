# 故障排查

## 服务无法启动

检查：

- MySQL 连接是否可用；
- Redis 是否正常运行；
- 环境变量是否完整；
- JWT 和凭证加密密钥是否满足要求；
- 容器磁盘空间和 inode 是否充足；
- `/readyz` 是否返回数据库和应用就绪状态。

如果镜像构建或同步失败，不要只看最后的 Docker 错误。先确认失败发生在构建、数据库备份、候选启动还是应用切换阶段，再决定是否需要清理可重建缓存。

## 节点无法上线或发布失败

检查：

1. SSH 凭证和节点网络是否可用；
2. 节点上的 Zero 版本是否与选择值一致；
3. 配置校验返回的第一条字段错误；
4. 监听端口是否冲突；
5. 证书文件和规则资源是否可访问；
6. 激活后的服务、控制接口和 Connector 是否健康。

协议服务保存成功不代表发布成功。依赖托管用户能力时，还要确认节点实际内核版本满足最低要求，并完成一次成功发布。

## 协议配置校验失败

VLESS/VMess 常见原因：

- 服务端和客户端选择了不同传输；
- WebSocket 路径没有以 `/` 开头；
- 两端 WebSocket 路径或请求头不同；
- 两端 gRPC Service Name 不同；
- 同时配置 WebSocket 和 gRPC；
- VLESS REALITY 使用了非 TCP 传输；
- VMess 缺少要求的 TLS 配置。

Trojan/Hysteria2 托管订阅用户需要 Zero `0.0.15-rc.3` 或更高版本；Mieru 用户归属需要 `0.0.15-rc.4` 或更高版本。详细说明见[协议服务配置](./protocol-services)。

## 订阅配置异常

确认：

- 节点服务最近一次发布成功；
- 订阅令牌未撤销，用户和订阅状态有效；
- 订阅模板、节点组成员和策略组引用正确；
- `mixed_port` 在 `1–65535` 范围内且未被占用；
- 客户端使用正确的模板或 User-Agent；
- ZNet Sink/native 响应按 Base64 文本解码；
- HTTP 响应不是无效令牌触发的 302 伪装跳转。

Base64 不是加密。不要把完整订阅 URL、令牌或解码后的凭据放进公开日志。

## 流量已上报但剩余额度看起来不变

先区分计算和显示：

- 数据库和 API 使用精确字节；
- 管理端会自动显示 B、KB、MB 或 GB；
- 小于 1 MiB 的记录不应再显示成固定的 `0 MiB`；
- 剩余流量等于套餐额度减去计费后的已用流量。

检查原始流量字节、协议服务倍率、订阅累计已用值和套餐额度。客户端本地测速成功但节点没有归属到该用户的 `flow.completed` 时，不会产生面板计费记录。

## DNS 更新或删除失败

- 检查 Cloudflare Token 的 Zone 和 DNS 编辑权限；
- 确认记录保存的 Zone/record ID 与远端一致；
- revision 冲突时刷新后重试；
- 同步任务运行期间不要并发删除；
- 远端 404 会按已删除处理，其他供应商错误会保留本地记录。

更改供应商账号、完整域名或记录类型需要删除后重建。

## HTTP-01 证书 unauthorized

依次检查：

1. A/AAAA 是否指向目标节点；
2. 公网 80 端口是否可达；
3. `/.well-known/acme-challenge/` 是否映射到配置的 Webroot；
4. HTTP/HTTPS 重定向后是否仍返回相同测试 token；
5. CDN、反向代理、应用路由或缓存是否改写内容。

Zboard 会先写入临时 token 并从域名请求验证。预检失败时先修复 Webroot 映射，不要直接重复申请。

## DNS-01 缺少 Certbot Cloudflare 插件

自动任务会依次尝试：

1. 系统 `python3-certbot-dns-cloudflare` 包；
2. `/opt/zboard-certbot` Python venv；
3. `/opt/zboard-certbot-packages` pip target 和 wrapper。

出现 `Unable to locate package python3-certbot-dns-cloudflare` 或 `python3-venv has no installation candidate` 时，继续查看后续回退日志。全部失败才需要人工修复 Python、pip/venv、软件源、外网访问或磁盘空间。

## 证书无法编辑或绑定

- 签发或续期运行中不能编辑；
- revision 冲突时刷新页面；
- 节点、域名、环境和 challenge 类型属于不可变身份，需要新建证书；
- 绑定时确认证书属于同一节点、覆盖协议域名且状态可用。

详细流程见[DNS 与证书管理](./dns-and-certificates)。
