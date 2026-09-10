# 数据存储与备份

首次部署请从[安装教程](./installation)开始。本页说明需要持久保存的目录、数据库选择和备份恢复方法。

## 准备宿主机目录 {#required-host-directories}

`/var/lib/zboard/artifacts` 下的两类内容使用不同的挂载权限：

- `ZBOARD_ZERO_ARTIFACT_HOST_DIR` 保存可信 Zero 程序及校验文件，以只读方式挂载。
- `ZBOARD_MANAGED_RULE_HOST_DIR` 保存托管规则源文件和生成的规则产物，以读写方式挂载，重建容器时需要保留。

首次部署前执行：

```bash
cd deploy/docker
sh ./prepare-host-dirs.sh
```

自定义位置时，使用与 Compose 相同的环境变量：

```bash
ZBOARD_ZERO_ARTIFACT_HOST_DIR=/srv/zboard/artifacts \
ZBOARD_MANAGED_RULE_HOST_DIR=/srv/zboard/managed-rules \
sh ./prepare-host-dirs.sh
```

MySQL 部署只使用基础 Compose 文件，不创建或挂载 SQLite 数据目录。使用 SQLite 时，设置 `ZBOARD_DATABASE_DRIVER=sqlite`、`ZBOARD_DATA_SOURCE=/var/lib/zboard/data/zboard.db`，按需设置 `ZBOARD_DATABASE_HOST_DIR`，并同时使用 SQLite 覆盖文件：

```bash
set -a
. ./.env.release
set +a
sh ./prepare-host-dirs.sh
docker compose \
  -f docker-compose.release.yml \
  -f docker-compose.sqlite.yml \
  --env-file .env.release \
  up -d
```

准备脚本会在只读制品目录中创建空的 `rules/` 挂载点，Compose 再将独立的可写规则目录挂载到这里。

## 挂载布局 {#mount-layout}

```text
/var/lib/zboard/artifacts                 只读的可信制品目录
└── rules                                独立的可写规则目录
    └── <tag>
        ├── source.json                  规范化规则源文件
        └── artifacts/<source-sha256>/   编译后的客户端规则
```

不要把整个制品目录改成可写。这个路径下由应用生成的数据仅位于托管规则目录中。

蓝绿部署的两个实例必须挂载同一个 `ZBOARD_MANAGED_RULE_HOST_DIR`，否则切换后可能出现数据库记录与规则文件不一致。

## 备份与恢复 {#backup-and-restore}

数据库保存规则元数据和修订信息，规则源文件与编译产物保存在 `ZBOARD_MANAGED_RULE_HOST_DIR`。备份时应在同一备份窗口保存：

1. 一致的 ZBoard 数据库备份。
2. 托管规则目录的归档或快照。
3. 部署配置、凭据加密密钥及其他持久目录；插件目录的要求见下文。

规则目录备份示例：

```bash
managed_rule_dir=${ZBOARD_MANAGED_RULE_HOST_DIR:-./managed-rules}
tar -C "$(dirname "$managed_rule_dir")" \
  -czf "zboard-managed-rules-$(date -u +%Y%m%dT%H%M%SZ).tar.gz" \
  "$(basename "$managed_rule_dir")"
```

启动恢复后的面板之前，应同时恢复数据库及对应的规则目录。只恢复数据库会缺少规则文件；只恢复目录则可能带回数据库已不再引用的旧修订。

SQLite 的一致性备份与切换步骤见[系统维护](./maintenance#sqlite-备份与回滚)。

## 检查部署配置 {#deployment-verification}

启动前先检查 Compose 配置：

```bash
docker compose -f docker-compose.release.yml --env-file .env.release config --quiet
```

SQLite 部署需要同时指定两个文件：

```bash
docker compose \
  -f docker-compose.release.yml \
  -f docker-compose.sqlite.yml \
  --env-file .env.release \
  config --quiet
```

启动后检查制品目录只读、规则目录可写。以下命令仅创建并删除一个临时检查文件；SQLite 部署需同时加上 SQLite 覆盖文件：

```bash
docker compose -f docker-compose.release.yml --env-file .env.release exec zboard sh -c '
  test ! -w /var/lib/zboard/artifacts || exit 1
  touch /var/lib/zboard/artifacts/rules/.write-test
  rm /var/lib/zboard/artifacts/rules/.write-test
'
```

## 插件数据持久化 {#plugin-persistence}

服务将 `ZBOARD_PLUGIN_HOST_DIR`（默认 `./plugins`）挂载到 `/var/lib/zboard/plugins`。`prepare-host-dirs.sh` 会创建此私有目录。备份时同时保存插件目录、数据库和凭据加密密钥。

需要配置发布者公钥或自定义市场目录时，将配置加入 ZBoard YAML，并以只读方式挂载到 `/app/etc/zboard.yaml`。具体见[插件市场](../plugins/marketplace)。

同一数据库只能由一个实例执行插件。备用实例可以提供核心接口，但不创建插件页面会话或执行插件操作。切换时停止原实例并重启接替实例；原实例异常退出后需要等待一分钟租约到期。此机制不提供多个实例同时处理插件请求的路由能力。
