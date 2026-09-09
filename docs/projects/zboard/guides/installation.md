# 安装与部署

Zboard 支持 MySQL 和 SQLite。使用仓库中的 Docker Compose 发布配置部署，并固定镜像标签；当前产品版本为 0.0.1，部署时仍需核对制品构建和所需能力。

当前已提供 [0.0.1 正式发布](https://github.com/zerodenet/zboard/releases/tag/v0.0.1)，包含 Linux amd64 二进制、Docker 镜像离线包与 SHA256SUMS；镜像为 `ghcr.io/zerodenet/zboard:v0.0.1`。同名标签重建后需重新拉取镜像并重建容器，仅重启已有容器不会替换镜像。升级前备份数据库、配置与持久目录。

## 准备运行环境

需要 Docker Engine、Compose v2，以及发布配置使用的外部 Docker 网络。MySQL 方案准备可访问的 MySQL 8 数据库；SQLite 方案准备可写的持久目录。当前发布 Compose 不要求部署 Redis。

取得与所选发布匹配的部署文件，进入 `deploy/docker`，创建自己的 `.env.release`。此文件包含凭证，不提交到公开仓库。

## 填写部署参数

| 变量 | 默认 / 是否必填 | 如何填写 |
| --- | --- | --- |
| `ZBOARD_IMAGE_TAG` | 必填 | 发布页上的固定标签 |
| `ZBOARD_IMAGE_REPOSITORY` | `ghcr.io/zerodenet/zboard` | 镜像仓库 |
| `ZBOARD_EXTERNAL_NETWORK` | 必填 | 已存在的外部 Docker 网络名称 |
| `ZBOARD_DATABASE_DRIVER` | `mysql` | `mysql` 或 `sqlite` |
| `ZBOARD_DATA_SOURCE` | 必填 | MySQL 完整 DSN 或 SQLite 容器内文件路径 |
| `ZBOARD_JWT_SECRET` | 必填 | 足够强的登录令牌密钥 |
| `ZBOARD_CREDENTIAL_ENCRYPTION_KEY` | 必填 | 符合应用校验要求的凭证加密密钥，需备份 |
| `ZBOARD_HTTP_BIND` | `127.0.0.1` | 对宿主机开放的监听地址 |
| `ZBOARD_HTTP_PORT` | `8080` | 宿主机端口 |
| `ZBOARD_DATABASE_HOST_DIR` | `./data` | SQLite 宿主机持久目录，需配合 SQLite override |
| `ZBOARD_ZERO_ARTIFACT_HOST_DIR` | `./artifacts` | 受信任 Zero 制品，只读挂载 |
| `ZBOARD_MANAGED_RULE_HOST_DIR` | `./managed-rules` | 托管规则与编译产物，可写挂载 |
| `ZBOARD_ZERO_EVENT_SPOOL_HOST_DIR` | `./zero-events` | 节点事件暂存文件，可写持久目录 |
| `ZBOARD_DATABASE_MAX_OPEN_CONNECTIONS` | `8` | MySQL 连接池上限；SQLite 固定为 `1` |
| `ZBOARD_DATABASE_MAX_IDLE_CONNECTIONS` | `2` | MySQL 空闲连接上限；SQLite 固定为 `1` |
| `ZBOARD_DATABASE_CONNECTION_MAX_LIFETIME_SECONDS` | `3600` | 连接最长寿命，秒 |

MySQL 的 DSN 形式为 `user:password@tcp(db:3306)/zboard?charset=utf8mb4&parseTime=True&loc=UTC`，替换账号、密码、数据库和地址。SQLite 使用 `/var/lib/zboard/data/zboard.db`，这是容器内路径，不是宿主机目录。

## 准备目录并启动

以下命令从 `deploy/docker` 执行，`.env.release` 需使用可被 shell 读取的赋值语法。先准备外部网络和持久目录：

```bash
set -a
. ./.env.release
set +a
sh ./prepare-host-dirs.sh
```

MySQL 使用发布文件：

```bash
docker compose -f docker-compose.release.yml --env-file .env.release up -d
```

SQLite 同时加载数据目录 override：

```bash
docker compose -f docker-compose.release.yml -f docker-compose.sqlite.yml \
  --env-file .env.release up -d
```

后续检查、停止和重建时使用相同的 Compose 文件组合及环境文件。通过反向代理提供 HTTPS；默认宿主机 loopback 绑定适合同机反向代理，需要跨容器或跨主机访问时按部署网络调整。

## 验证安装

1. 使用同一 Compose 组合运行 `ps`，检查 zboard 容器健康。
2. 请求 `http://127.0.0.1:8080/readyz`，确认就绪和数据库连接；修改端口时同步修改地址。
3. 访问站点，完成[首次初始化](./first-setup)。
4. 核对管理员登录、站点公开地址和当前驱动，再接入节点。

首次启动由后端建立和检查数据库结构，不手工插入迁移记录。已有数据要改数据库驱动时，使用[系统维护与数据库迁移](./maintenance)，不要仅更改连接地址。

## 持久化与升级

数据库、凭证加密密钥、托管规则和事件存储共同组成恢复所需资料。受信任 Zero 制品目录保持只读，托管规则目录单独可写；不要为解决规则写入问题把所有制品改为可写。

SQLite 备份应取得一致快照，或停止应用后备份完整数据目录。升级前保留原镜像和匹配的部署配置，升级后核对 `/readyz`、驱动、业务数据及节点事件恢复。
