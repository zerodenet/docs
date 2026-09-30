# 首次安装


本指南使用发布的 Docker 镜像安装面板，再为自己配置第一条可用线路。镜像已经包含后端和 Web 控制台，无需自行构建前端，也无需安装 Go 或 Node.js。

## 安装前准备

需要准备：

- 一台 Linux amd64 主机，已安装 Docker Engine、Docker Compose 插件、Git 和 OpenSSL。
- 选择一种数据库：现有 MySQL 8 的空库与应用账号，或[本地 SQLite](#使用-sqlite)。MySQL 账号需要建表和读写权限，生产环境不接受 root 账号。
- 一个 Docker 网络供发布 Compose 使用。MySQL 在容器中时，把它连接到同一网络并使用容器名或别名；SQLite 也需满足 Compose 的外部网络配置。
- 一个配置了 HTTPS 的域名，由 Docker 所在主机上的反向代理转发。示例将面板绑定到 `127.0.0.1:8080`。

发布 Compose 文件**只启动 ZBoard**，不会创建 MySQL 或 Redis。也可以选择 SQLite，对应配置及 Compose 覆盖文件见 [Docker 存储说明](/projects/zboard/guides/storage-and-backups)。

## 1. 获取部署文件

下面以 [v0.0.2-rc.202609291405](https://github.com/zerodenet/zboard/releases/tag/v0.0.2-rc.202609291405) 为例，与当前指南的菜单和功能对应。它是候选版，部署前请阅读发布说明。需要正式版时可选择 `v0.0.1`，但不能预期具有此处介绍的后续插件与管理功能。

```bash
git clone --branch v0.0.2-rc.202609291405 --depth 1 https://github.com/zerodenet/zboard.git
cd zboard/deploy/docker
cp .env.release.example .env.release
chmod 600 .env.release
```

部署文件和镜像使用同一个版本。仓库 `.env.release.example` 的示例标签可能仍是 `v0.0.1`，复制后必须按下一步显式修改；不要仅切换源码标签而继续拉取旧镜像。已有安装升级请先读[升级步骤](./maintenance#upgrade)，不要覆盖原密钥和数据目录。

## 2. 填写配置

编辑 `.env.release`，按实际环境填写以下配置：

```dotenv
ZBOARD_IMAGE_TAG=v0.0.2-rc.202609291405
ZBOARD_PULL_POLICY=always
ZBOARD_HTTP_BIND=127.0.0.1
ZBOARD_HTTP_PORT=8080
ZBOARD_EXTERNAL_NETWORK=your_existing_docker_network
ZBOARD_DATABASE_DRIVER=mysql
ZBOARD_DATA_SOURCE='zboard:YOUR_DATABASE_PASSWORD@tcp(mysql:3306)/zboard?charset=utf8mb4&parseTime=true&loc=UTC'
ZBOARD_JWT_SECRET=YOUR_RANDOM_JWT_SECRET
ZBOARD_CREDENTIAL_ENCRYPTION_KEY=YOUR_RANDOM_ENCRYPTION_KEY
```

替换网络名、数据库账号、密码、地址和库名。没有现成 Docker 网络时，可先执行 `docker network create zboard_backend`，并将 `ZBOARD_EXTERNAL_NETWORK` 设为 `zboard_backend`；MySQL 容器仍需接入这个网络。示例中的 `mysql` 必须换成实际可访问的地址；容器里的 `127.0.0.1` 指向 ZBoard 容器自身，不是宿主机，也不是另一个 MySQL 容器。

下面的命令运行**两次**，分别生成 JWT 密钥和凭据加密密钥，填入对应配置项：

```bash
openssl rand -hex 32
```

这两个值在重启后应保持不变。凭据加密密钥用于解密已保存的节点凭据，需要在数据库之外另行备份。

将 `ZBOARD_BOOTSTRAP_ADMIN_EMAIL` 和 `ZBOARD_BOOTSTRAP_ADMIN_PASSWORD` 保持为空，稍后通过安装页面创建管理员。面板没有默认管理员密码。

## 3. 准备目录并启动

下面的命令使用 `.env.release` 中的默认宿主机目录。如果修改了目录位置，请先按[自定义目录说明](/projects/zboard/guides/storage-and-backups#required-host-directories)准备对应路径。

```bash
sh ./prepare-host-dirs.sh
docker compose -f docker-compose.release.yml --env-file .env.release config --quiet
docker compose -f docker-compose.release.yml --env-file .env.release pull
docker compose -f docker-compose.release.yml --env-file .env.release up -d
docker compose -f docker-compose.release.yml --env-file .env.release ps
```

在 Docker 所在主机上检查服务：

```bash
curl --fail http://127.0.0.1:8080/readyz
curl --fail http://127.0.0.1:8080/api/v1/version
```

`/readyz` 检查面板的数据库连接，不能用它判断 Zero 节点是否安装完成、配置是否发布成功。

启动失败时查看日志：

```bash
docker compose -f docker-compose.release.yml --env-file .env.release logs --tail 100 zboard
```

常见原因包括必填环境变量为空、外部 Docker 网络不存在、数据库凭据错误，以及容器无法连接 MySQL。

## 4. 创建管理员

将主机上的反向代理配置为：HTTPS 域名请求转发到 `http://127.0.0.1:8080`。如果反向代理也在容器中，不能把它自己的 `127.0.0.1` 当作 ZBoard；应使用共享 Docker 网络内的服务地址。然后访问 `https://你的域名/setup`，完成站点设置并创建第一个管理员。

初始化后通过 `/login` 登录。站点安装完成后，不能再次通过安装页面创建管理员。

## 5. 配置第一条服务

1. **添加节点。** 在“节点系统 → 服务器管理”填写服务器地址与 SSH 信息，验证连接和提权能力。
2. **安装 Zero。** 在节点的“内核与运维”中选择可用版本，等待安装和本机健康检查完成。
3. **创建协议。** 在“节点协议 → 创建协议服务”选择实际协议监听，填写对外地址、监听端口与协议参数。放行主机和云防火墙所需端口，检查发布结果。
4. **分配给自己。** 按[开通第一份订阅](./plans-and-orders#self-use)创建权限组和一份套餐规格，为自己的账户分配零金额订单并确认。无需先安装支付插件或开放注册。
5. **实际连接。** 在个人中心复制这份订阅的客户端链接，按[导入步骤](./subscriptions-and-traffic#客户端导入)连接，再核对用量。

协议配置可能在订阅凭据生成后再次发布。尤其 Hysteria2/Mieru 没有有效用户凭据时可能不启动业务监听；请以开通后的发布结果和真实连接为准。
需要转发节点或共享上游代理池时，继续阅读[网络前置指南](/projects/zboard/guides/network-fronting)。节点安装和故障恢复见[节点管理指南](/projects/zboard/guides/node-management)。

## 保存部署数据

数据库、`.env.release`、凭据加密密钥、托管规则和 Zero 事件队列都需要持久保存。插件目录也需要保存。具体挂载位置和配套恢复要求见[存储与备份指南](/projects/zboard/guides/storage-and-backups)。

如果需要从源码运行开发环境，请使用[本地开发指南](/projects/zboard/contributing/development)。

## 使用 SQLite

SQLite 使用同一发布镜像，将 `.env.release` 中的数据库设置改为：

```dotenv
ZBOARD_DATABASE_DRIVER=sqlite
ZBOARD_DATA_SOURCE=/var/lib/zboard/data/zboard.db
ZBOARD_DATABASE_HOST_DIR=./data
```

仍需填写发布 Compose 要求的外部网络，但不需要 MySQL 服务。使用默认目录时执行：

```bash
ZBOARD_DATABASE_DRIVER=sqlite sh ./prepare-host-dirs.sh
docker compose -f docker-compose.release.yml -f docker-compose.sqlite.yml --env-file .env.release config --quiet
docker compose -f docker-compose.release.yml -f docker-compose.sqlite.yml --env-file .env.release up -d
```

后续查看状态、停止和重建均使用相同的两个 Compose 文件及环境文件。已有数据需要切换数据库时，使用[数据库迁移](./maintenance)，不要只修改连接地址。
