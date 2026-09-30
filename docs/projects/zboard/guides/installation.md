# Docker 部署选项 {#首次安装}

第一次搭建请跟随[从零到第一条可用线路](./)。本页补充 MySQL、网络和已有部署选项；使用默认 SQLite 的读者无需另走一遍。

## 安装前准备

发布 Compose 只运行 ZBoard，镜像已经包含后端和 Web 控制台，不创建 MySQL 或 Redis。它要求 Linux amd64、Docker Engine 与 Compose 插件，并连接一个已存在的 Docker 网络。

- MySQL：准备一个空的 MySQL 8 数据库，以及能建表和读写的应用账号；生产环境不接受 root 账号。
- SQLite：数据保存在持久目录，不需另装数据库。
- 两种方式都要保留配置、加密密钥和数据目录。已有站点先看[升级与恢复](./maintenance#upgrade)。

## 1. 获取部署文件

在 [Releases](https://github.com/zerodenet/zboard/releases) 选择发行版，阅读发布说明。获取同一标签的部署文件：

```bash
read -r -p '请输入选定的 Release 标签：' ZBOARD_VERSION
git clone --branch "$ZBOARD_VERSION" --depth 1 https://github.com/zerodenet/zboard.git
cd zboard/deploy/docker
cp .env.release.example .env.release
chmod 600 .env.release
```

把 `.env.release` 的 `ZBOARD_IMAGE_TAG` 改为刚选择的完整标签。不要沿用示例中的旧默认值，也不要混用其他版本的部署文件。

## 2. 填写配置

以下是使用现有 MySQL 的主要配置项，编辑 `.env.release` 并替换占位值：

```dotenv
ZBOARD_IMAGE_TAG=YOUR_SELECTED_RELEASE_TAG
ZBOARD_PULL_POLICY=always
ZBOARD_HTTP_BIND=127.0.0.1
ZBOARD_HTTP_PORT=8080
ZBOARD_EXTERNAL_NETWORK=your_existing_docker_network
ZBOARD_DATABASE_DRIVER=mysql
ZBOARD_DATA_SOURCE='zboard:YOUR_DATABASE_PASSWORD@tcp(mysql:3306)/zboard?charset=utf8mb4&parseTime=true&loc=UTC'
ZBOARD_JWT_SECRET=YOUR_RANDOM_JWT_SECRET
ZBOARD_CREDENTIAL_ENCRYPTION_KEY=YOUR_RANDOM_ENCRYPTION_KEY
```

MySQL 容器要连接同一网络，`mysql` 替换为可达的容器名、网络别名或数据库主机地址。容器内的 `127.0.0.1` 不是宿主机或另一容器。

没有现成网络时可创建 `docker network create zboard_backend`，相应设置 `ZBOARD_EXTERNAL_NETWORK=zboard_backend`，再将 MySQL 接入它。

新安装运行 `openssl rand -hex 32` **两次**，分别填入 JWT 和凭据加密密钥。不要复用同一个值，重启或升级也不要重新生成。`ZBOARD_BOOTSTRAP_ADMIN_EMAIL` 与 `ZBOARD_BOOTSTRAP_ADMIN_PASSWORD` 留空时，通过浏览器安装向导创建管理员。

## 3. 准备目录并启动

默认目录执行：

```bash
sh ./prepare-host-dirs.sh
docker compose -f docker-compose.release.yml --env-file .env.release config --quiet
docker compose -f docker-compose.release.yml --env-file .env.release pull
docker compose -f docker-compose.release.yml --env-file .env.release up -d
docker compose -f docker-compose.release.yml --env-file .env.release ps
curl --fail http://127.0.0.1:8080/readyz
```

自定义挂载位置见[目录准备](./storage-and-backups#required-host-directories)。无法启动时执行同一 Compose 命令的 `logs --tail 100 zboard`，检查网络、数据库连接、配置与目录权限。

## 4. 创建管理员

主机上的 HTTPS 反向代理转发到 `http://127.0.0.1:8080`；容器化反向代理使用共享 Docker 网络中的 `zboard:8080`。确认面板域名可访问后，回到[主教程第 2 步](./#setup)创建站点和管理员。

## 5. 配置第一条服务

部署完成后，从[主教程第 3 步](./#connect-node)接入服务器，继续完成协议、订阅和客户端连接。后续步骤集中在同一篇教程中。

## 保存部署数据

数据库、`.env.release`、凭据加密密钥、规则目录、插件目录及 Zero 事件队列都要保存。具体挂载与恢复要求见[存储与备份](./storage-and-backups)。

## 使用 SQLite

SQLite 的完整首次部署命令见[主教程第 1 步](./#deploy)。与 MySQL 的关键区别是：

```dotenv
ZBOARD_DATABASE_DRIVER=sqlite
ZBOARD_DATA_SOURCE=/var/lib/zboard/data/zboard.db
ZBOARD_DATABASE_HOST_DIR=./data
```

准备目录时传入 `ZBOARD_DATABASE_DRIVER=sqlite`；每次 Compose 操作同时使用 `docker-compose.release.yml` 与 `docker-compose.sqlite.yml`。已有数据切换驱动要执行[数据库迁移](./maintenance)，不能只换连接地址。
