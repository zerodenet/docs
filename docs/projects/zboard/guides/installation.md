# 首次安装

[English](/projects/zboard/guides/installation-en) | [简体中文](/projects/zboard/guides/installation)

本指南使用正式发布的 Docker 镜像安装面板，并说明如何配置第一条服务。镜像已经包含后端和 Web 控制台，无需自行构建前端，也无需安装 Go 或 Node.js。

## 安装前准备

需要准备：

- 一台 Linux amd64 主机，已安装 Docker Engine、Docker Compose 插件、Git 和 OpenSSL。
- 一个空的 MySQL 8 数据库，以及拥有该库建表和读写权限的应用账号。生产环境不接受 MySQL root 账号。
- 一个让面板可以访问 MySQL 的现有 Docker 网络。如果 MySQL 运行在容器中，应将其连接到这个网络，并使用容器名或网络别名作为数据库地址。
- 一个配置了 HTTPS 的域名，由 Docker 所在主机上的反向代理转发。示例将面板绑定到 `127.0.0.1:8080`。

正式版 Compose 文件**只启动 ZBoard**，不会创建 MySQL 或 Redis。也可以选择 SQLite，对应配置及 Compose 覆盖文件见 [Docker 存储说明](/projects/zboard/guides/storage-and-backups)。

## 1. 获取部署文件

从 [Releases](https://github.com/zerodenet/zboard/releases) 选择版本，以下以 `v0.0.1` 为例：

```bash
git clone --branch v0.0.1 --depth 1 https://github.com/zerodenet/zboard.git
cd zboard/deploy/docker
cp .env.release.example .env.release
chmod 600 .env.release
```

部署文件和镜像使用同一个版本。选择其他版本时，需要同时修改检出标签和下面的镜像标签。

## 2. 填写配置

编辑 `.env.release`，按实际环境填写以下配置：

```dotenv
ZBOARD_IMAGE_TAG=v0.0.1
ZBOARD_PULL_POLICY=always
ZBOARD_HTTP_BIND=127.0.0.1
ZBOARD_HTTP_PORT=8080
ZBOARD_EXTERNAL_NETWORK=your_existing_docker_network
ZBOARD_DATABASE_DRIVER=mysql
ZBOARD_DATA_SOURCE='zboard:YOUR_DATABASE_PASSWORD@tcp(mysql:3306)/zboard?charset=utf8mb4&parseTime=true&loc=UTC'
ZBOARD_JWT_SECRET=YOUR_RANDOM_JWT_SECRET
ZBOARD_CREDENTIAL_ENCRYPTION_KEY=YOUR_RANDOM_ENCRYPTION_KEY
```

替换网络名、数据库账号、密码、地址和库名。示例中的 `mysql` 必须换成实际可访问的地址；容器里的 `127.0.0.1` 指向 ZBoard 容器自身，不是宿主机，也不是另一个 MySQL 容器。

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

将主机上的反向代理配置为：HTTPS 域名请求转发到 `http://127.0.0.1:8080`。然后访问 `https://你的域名/setup`，完成站点设置并创建第一个管理员。

初始化后通过 `/login` 登录。站点安装完成后，不能再次通过安装页面创建管理员。

## 5. 配置第一条服务

1. **添加节点。** 在管理后台填写节点地址和 SSH 连接信息。
2. **安装 Zero。** 在节点的内核管理中执行安装，等待安装与健康检查完成。
3. **创建协议服务。** 选择节点和协议，配置监听地址、端口等参数，等待发布成功，并放行节点防火墙中的对应服务端口。
4. **创建节点组和套餐。** 将协议服务加入节点组，再在套餐中选择该组。
5. **开通用户订阅。** 使用基础订单流程，创建对应套餐的订单，由管理员确认后开通订阅。
6. **连接客户端。** 在用户账户中选择对应的订阅格式，将订阅链接导入客户端；连接后回到控制台查看流量用量。

需要转发节点或共享上游代理池时，继续阅读[网络前置指南](/projects/zboard/guides/network-fronting)。节点安装和故障恢复见[节点管理指南](/projects/zboard/guides/node-management)。

## 保存部署数据

数据库、`.env.release`、凭据加密密钥、托管规则和 Zero 事件队列都需要持久保存。使用支持插件的构建时，还需要保存插件目录。具体挂载位置和配套恢复要求见[存储与备份指南](/projects/zboard/guides/storage-and-backups)。

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
