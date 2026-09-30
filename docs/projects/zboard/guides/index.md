---
prev:
  text: ZBoard
  link: /projects/zboard/
next:
  text: 日常使用与分享
  link: /projects/zboard/guides/daily-operations
---

# 从零搭建第一条可用线路 {#使用指南}

跟着本页完成部署、接入服务器、给自己分配订阅，再在客户端连接。先用一台服务器和一个协议跑通，不需要开放注册、接入支付或安装插件。

## 开始前 {#第一次使用}

准备好：

- **面板主机**：Linux amd64，已安装 Docker Engine、Docker Compose 插件、Git 和 OpenSSL。
- **面板域名**：HTTPS 反向代理可以把请求转到面板主机的 `127.0.0.1:8080`。
- **代理节点**：一台你能通过 SSH 管理的 Linux x86_64/systemd 服务器，知道它的公网地址、SSH 端口和认证信息。面板和节点可以在同一台主机，注意端口不要冲突。
- **客户端**：支持 Shadowsocks 的 Zero、Clash/Mihomo 或 sing-box 客户端。

下面用 SQLite 保存面板数据，无需另外安装数据库。已有 MySQL 并希望复用时，改用[MySQL 部署选项](./installation#_2-填写配置)，启动后回到本页第 2 步。

## 1. 部署面板 {#deploy}

### 获取部署文件

在 [Releases](https://github.com/zerodenet/zboard/releases) 选择要安装的发行版，阅读发布说明。带 RC 或 Dev 标记的是预发布版。复制所选版本的完整标签，在面板主机的 Bash 终端执行：

```bash
read -r -p '请输入选定的 Release 标签：' ZBOARD_VERSION
git clone --branch "$ZBOARD_VERSION" --depth 1 https://github.com/zerodenet/zboard.git
cd zboard/deploy/docker
```

接下来的命令继续在这个终端、这个目录执行，部署文件和镜像使用同一标签。

### 创建配置与数据目录

下面为**新安装**生成配置和两把独立随机密钥。已有站点不要覆盖原文件，应按[升级说明](./maintenance#upgrade)处理。

```bash
umask 077
cat > .env.release <<EOF
COMPOSE_PROJECT_NAME=zboard
ZBOARD_IMAGE_TAG=${ZBOARD_VERSION}
ZBOARD_PULL_POLICY=always
ZBOARD_HTTP_BIND=127.0.0.1
ZBOARD_HTTP_PORT=8080
ZBOARD_EXTERNAL_NETWORK=zboard_backend
ZBOARD_DATABASE_DRIVER=sqlite
ZBOARD_DATA_SOURCE=/var/lib/zboard/data/zboard.db
ZBOARD_DATABASE_HOST_DIR=./data
ZBOARD_JWT_SECRET=$(openssl rand -hex 32)
ZBOARD_CREDENTIAL_ENCRYPTION_KEY=$(openssl rand -hex 32)
EOF

docker network inspect zboard_backend >/dev/null 2>&1 || docker network create zboard_backend
ZBOARD_DATABASE_DRIVER=sqlite sh ./prepare-host-dirs.sh
```

`.env.release` 包含密钥，不要公开。重启或更新时保留这些值，尤其凭据加密密钥；它用于读取已经保存的节点凭据。

### 启动并检查

```bash
docker compose -f docker-compose.release.yml -f docker-compose.sqlite.yml --env-file .env.release config --quiet
docker compose -f docker-compose.release.yml -f docker-compose.sqlite.yml --env-file .env.release pull
docker compose -f docker-compose.release.yml -f docker-compose.sqlite.yml --env-file .env.release up -d
docker compose -f docker-compose.release.yml -f docker-compose.sqlite.yml --env-file .env.release ps
curl --fail http://127.0.0.1:8080/readyz
```

容器正常运行且 `/readyz` 成功后，在反向代理中把面板 HTTPS 域名转发到 `http://127.0.0.1:8080`。如果反向代理也在容器中，应通过同一 Docker 网络访问 `zboard:8080`，不能使用它自己容器里的 `127.0.0.1`。

启动失败时先看日志，不要重新生成密钥或删除数据目录：

```bash
docker compose -f docker-compose.release.yml -f docker-compose.sqlite.yml --env-file .env.release logs --tail 100 zboard
```

常见原因是外部网络未创建、目录不可写或配置项为空。`/readyz` 正常只说明面板就绪，接下来还要接入节点。

## 2. 创建站点和管理员 {#setup}

打开 `https://你的面板域名/setup`，依次完成：

1. **环境检查**：确认服务和数据库正常。
2. **站点设置**：填站点名称、公开 HTTPS 地址；自用先关闭访客注册。
3. **系统策略**：选择自己的时区，例如 `Asia/Shanghai` 或 `UTC`；历史保留时间先保留默认值。
4. **首个管理员**：填写邮箱和强密码，完成安装，再通过 `/login` 登录。

管理员也可以使用个人中心，下面直接给这个账户开通第一份订阅。以后分享时再创建普通账户，不要把管理员密码交给别人。

## 3. 接入一台服务器 {#connect-node}

1. 在后台打开“节点系统 → 服务器管理”，新建服务器。取名例如“我的节点”，填写公网地址、SSH 端口和认证信息。
2. 保存后执行 SSH 验证，确认连接与提权权限正常。
3. 进入这台服务器的“内核与运维”，选择可用的 Zero 发行版本并安装。
4. 等待后台任务完成，确认 Zero 服务和控制接口健康，再检查 Connector 上报状态。

节点需要能访问面板的公开 HTTPS 地址。SSH 可连但 Connector 未上线时，先检查该地址与网络；没有用户流量是正常的，不用因此重装 Zero。BBR、供应商账号和证书暂时不必配置。

## 4. 创建一条协议线路 {#create-protocol}

本例使用 Shadowsocks，不需要另外为协议签发 TLS 证书。打开“节点系统 → 节点协议 → 创建协议服务”，选择“实际协议监听”。

按向导填写：

| 字段 | 本例填写 |
| --- | --- |
| 承载 VPS | 刚接入的“我的节点” |
| 协议类型 | Shadowsocks |
| 服务名称 | 自用线路 |
| 对外地址 | 这台节点的公网 IP，或确实指向它的域名 |
| 服务监听端口 | 例如 `24443`，先确认未被占用 |
| 客户端连接端口 | 没有端口映射时也填 `24443` |
| Shadowsocks 加密方式 | 保留界面推荐的 ChaCha20-Poly1305 |

用户认证凭据会在订阅开通时生成，不必手填一套所有人共用的密码。其余可选设置先保留默认值，不开启额外出站代理。

在服务器防火墙及云安全组放行这个服务需要的 TCP/UDP 端口。保存后点击“查看发布任务”，检查对应节点的队列；排队或执行中先等待。失败时查看错误，修复端口冲突或内核能力等问题后再重试。协议详情中的历史任务记录可能被清理，没有记录不等于尚未发布。

此时还没有用户订阅；下一步开通后，面板会生成凭据并再次更新节点配置。

## 5. 把线路分配给自己 {#grant-access}

面板使用权限组、套餐和订单记录访问范围与额度。这里用零金额分配完成自用开通，不需要收款渠道。

### 建权限组

打开“节点系统 → 权限组”，创建“自用线路组”，代码可填 `personal`，在直接协议中选中刚才的“自用线路”，启用并保存。这里的“权限组”和部分表单里的“节点组”是同一类资源。

### 建一份自用套餐

打开“订阅系统 → 商品与套餐 → 创建商品”。创建表单同时包含商品和首个销售规格（SKU），本例可以填写：

| 区域 | 本例填写 |
| --- | --- |
| 商品信息 | 名称“自用套餐”，Slug `personal` |
| 首个销售规格 | 销售用途“套餐订阅”，SKU 名称“自用月度”，编码 `personal-monthly` |
| 周期与用途 | 计费方式“按周期付费”，销售周期“月付 · 1 个月”，可用场景勾选“新购” |
| 价格 | `0`，币种保留 `CNY` |
| 套餐权益 | 流量配额例如 `100 GiB`、设备数 `3`，速率限制 `0` 表示不限速 |
| 节点组 | 选择“自用线路组” |
| 发布状态 | 勾选“创建后立即发布商品” |

其余选项先保留默认值，点击“创建商品与 SKU”。这些示例值是这份自用订阅的额度与期限，可按需要调整；选择“月付”不会替你绑定支付方式或自动扣款。

### 创建并确认零金额订单

1. 进入“订阅系统 → 订单管理 → 分配订单”。
2. 用户选择自己的管理员邮箱，权益操作选“新开订阅”。
3. 选择“自用套餐”和“自用月度”规格，确认应付金额为 `0`，分配原因填“自用”。
4. 保存后会产生**待付款订单**。打开这笔订单，核对用户、规格和零金额，再点击“确认收款”并确认。
5. 检查订单已完成、订阅已生成，并等待相关节点配置再次发布成功。

**即使金额为零，也必须执行订单确认才会开通。** 零金额订单不需要实际付款；有金额的订单则必须先核实到账。找不到套餐或规格时，检查商品已发布、规格可售且允许“新购”。

## 6. 导入客户端并确认可用 {#connect-client}

1. 切换到个人中心，打开“订阅配置”，选择刚才开通的订阅，核对有效期和剩余流量。
2. 选择与客户端对应的输出格式：Zero 客户端选 Zero，Clash/Mihomo 选 Clash，sing-box 选 sing-box。
3. 复制链接，在客户端“添加订阅/从 URL 导入”中粘贴，更新配置。
4. 确认出现“自用线路”，选择它并启用客户端代理。首次验证可先用系统代理模式，TUN 等按需要再开启。
5. 在浏览器实际访问一个目标，结束这次访问后回到面板的“流量明细”，选择这份订阅及今天的时间范围，检查用量。

订阅链接是访问秘密，不要贴到公开聊天或截图里。普通浏览器打开订阅 URL 可能被跳转，应该在支持的客户端中导入。

完成时应同时看到：**订阅有效、线路已下发、节点发布成功、客户端能连接、用量能归属到这份订阅**。没有用量时先检查所选订阅、节点上报与任务积压，不要仅凭客户端测速成功认定整个流程正常。

## 卡住时先看这里

| 现象 | 先回到哪一步 |
| --- | --- |
| 面板打不开 | 第 1 步，检查容器、`/readyz` 和反向代理 |
| SSH 可连但 Zero 未就绪 | 第 3 步，查看安装任务与节点健康 |
| 订单有了却没有订阅 | 第 5 步，确认是否执行了“确认收款” |
| 客户端配置里没有线路 | 检查订阅有效、权限组已选中协议，节点最近发布成功 |
| 有线路却连不上 | 第 4 步，核对对外地址、最终订阅端口和防火墙 |
| 导入的是网页 | 第 6 步，检查格式、客户端和链接是否有效 |

更具体的错误处理见[故障排查](./troubleshooting)。

## 用通之后 {#按需配置}

先[备份数据库、配置和持久目录](./storage-and-backups)。然后按需要[分享给其他人](./daily-operations)、[配置转发入口](./network-fronting)或[添加插件](../plugins/)。首次连接不需要把所有功能都配完。
