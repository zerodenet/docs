# 系统维护与数据库迁移

“服务系统 → 系统维护”提供整站维护和 MySQL / SQLite 迁移。数据库复制完成后还需要修改部署配置并重启，页面不会自动切换正在使用的数据库。

## 更新面板版本 {#upgrade}

升级前核对当前与目标的完整版本，阅读目标 [Release](https://github.com/zerodenet/zboard/releases) 的迁移说明，保存[一致备份](./storage-and-backups)。不要用重新生成密钥或覆盖环境文件的方式“重新安装”。

涉及数据库迁移的升级，按下列顺序操作：

1. 安排维护窗口，停止所有应用写入实例，保存数据库、规则、上传内核、事件队列、插件目录、配置和原镜像。
2. 使用目标标签对应的部署文件，把 `.env.release` 中镜像标签改为目标版本，保留现有数据库连接、密钥与持久目录。按[目录准备](./storage-and-backups#required-host-directories)补齐新挂载，再用 `config --quiet` 检查 Compose。
3. 拉取镜像，由**一个**实例执行迁移；其他实例保持停止。
4. 迁移成功后重建应用容器，检查登录、订阅、节点发布、上报与真实连接，再恢复访问。

MySQL 单实例 Compose 示例（在原部署目录，更新镜像标签后执行）：

```bash
docker compose -f docker-compose.release.yml --env-file .env.release stop zboard
docker compose -f docker-compose.release.yml --env-file .env.release pull
docker compose -f docker-compose.release.yml --env-file .env.release run --rm --no-deps zboard -migrate-only
docker compose -f docker-compose.release.yml --env-file .env.release up -d
```

SQLite 部署每条命令都增加 `-f docker-compose.sqlite.yml`，同样在停写后由一个目标版本实例执行 `-migrate-only`。仅执行 `restart` 不会加载已修改的镜像或 Compose 环境变量。使用[离线镜像](./installation#offline-image)时，先校验并加载目标包，保持 `ZBOARD_PULL_POLICY=never`，跳过 `pull`。

## v0.0.2 升级检查 {#upgrade-v0-0-2}

[v0.0.2 正式版](https://github.com/zerodenet/zboard/releases/tag/v0.0.2) 包含本地上传内核、订阅邮件告警，以及此前候选版的订阅生命周期、外部转发、流量统计与发布恢复改进。优先使用明确的 `v0.0.2` 镜像标签，便于复现和回退。

从 `v0.0.1` 升级会补齐 `0022–0029` 的迁移；已经使用 RC 的站点只补未记录的迁移。涉及的变化包括商品归档、订阅生命周期、小时流量汇总、固定额度、外部转发和协议展示统计重置。`0029_subscription_alerts` 增加持久的订阅告警去重与扫描记录，不要沿用只列到 `0028` 的候选版升级清单。

- **MySQL**：先停止其他应用写入实例，单实例执行 `-migrate-only` 成功后再启动应用；不并发迁移，也不混跑新旧写入实例。
- **SQLite**：由应用自己的 SQLite 迁移流程更新表结构并记录版本；小时统计仍使用事务内触发器。不要手工执行 MySQL SQL 文件来“补齐”版本。
- **上传内核**：使用同标签的 Compose，将 `/var/lib/zboard/artifacts/kernel-uploads` 单独持久挂载为可写。保留制品根目录只读，并按[目录准备](./storage-and-backups#required-host-directories)补建挂载点。自定义反向代理还需配置[上传大小和超时](./installation#kernel-upload-proxy)。
- **订阅邮件**：升级不会自动开启四类告警。需要先验证 SMTP，打开邮件任务总开关，再按需启用[订阅告警](./announcements-and-email#subscription-alerts)。

迁移后先检查 `/readyz` 和登录，再验证已有订阅、节点发布、上报、客户端连接和用量。使用新增功能时，另做一次可信内核上传验收和邮件实际收件检查；迁移成功不等于这些外部链路可用。

::: warning 小时统计与外部转发的迁移兼容性
`0024_traffic_usage_hourly` 会从原始账本回填小时汇总，`0025_traffic_hourly_application` 将 MySQL 小时统计改为应用内事务写入并移除旧触发器。已有旧触发器的库需要正常 schema 级 TRIGGER 权限，不需授予 SUPER。

遇到 MySQL `1419` 后接 `1050` 的部分迁移状态，保留日志和备份，用目标版本重新执行迁移；不要删除原始流量账本、手工标记迁移完成或打开全局函数信任。

回滚到依赖旧表结构或触发器的版本时，必须停止新实例，并将**升级前数据库快照和旧程序一起恢复**，不能只切换镜像。`0027_external_forward_entries` 等结构变化也需要匹配快照。新版本已接受写入后，先核对并处理新增数据，不能直接覆盖丢弃。
:::

下面的数据库切换用于 MySQL 与 SQLite 之间迁移，和日常版本升级是两件事。

## 开启维护

填写维护页标题和说明，勾选“开启整站维护”，点击“保存维护设置”。普通用户、节点上报和业务接口会收到维护响应；管理员控制台、健康检查及状态接口继续可用。

维护会影响节点事件接收，应预留维护窗口并观察节点端可靠投递队列。维护结束后检查积压是否恢复，不能只检查首页。

## 迁移前准备

- 备份源数据库、凭证加密密钥、部署环境配置、托管规则目录及事件存储，保留原镜像。
- 准备另一种驱动的**空目标库**；不要选用已有业务数据的数据库。
- SQLite 使用服务器或容器内可写、可持久化的文件路径，例如 `/var/lib/zboard/data/zboard.db`，不是浏览器电脑上的路径。
- MySQL 使用完整连接 DSN，确认目标库权限；作为源库时还要能执行一致性只读锁操作，具体以连接预检结果为准。
- 多实例部署应统一安排停写和切换，不要让另一实例继续向源库写入。

## 执行与切换

1. 打开“系统维护”，检查“当前驱动”。
2. 选择目标驱动，填写目标连接信息。MySQL DSN 默认隐藏，可按显示按钮核对；切换驱动后要重新填写。
3. 点击“连接预检”，确认目标可连接且为空。预检不会复制业务数据，也不代表已经切换。
4. 核实备份后勾选确认，点击“开始迁移”。系统进入维护，复制业务与观测表，并逐表校验数量。
5. 等待任务完成，查看进度、错误和“下一步”。失败时保留源库并先定位问题，不向未验证目标切换。
6. 完成后保持维护开启，在部署环境更新 `ZBOARD_DATABASE_DRIVER` 和 `ZBOARD_DATA_SOURCE`；SQLite 同时使用数据目录挂载。按[部署说明](./installation)重建应用容器；修改环境后不要只执行 `restart`。
7. 确认页面显示目标驱动，检查 `/readyz`、容器健康、管理员登录、订阅、订单、流量和规则产物。
8. 验证通过后手动关闭维护，检查用户访问及节点上报恢复。

迁移运行时不能关闭维护。复制完成也不代表新库已开始服务；必须以重启后的实际驱动和业务读取为准。

## SQLite 备份与回滚

SQLite 数据目录必须持久化，容器重建不能丢失文件。备份使用一致性备份方式，或停止应用后备份完整数据目录及存在的 WAL/SHM 文件，不只复制仍在写入中的主 `.db`。

切换失败时保持维护，停止新实例，恢复原部署配置与匹配的源数据库、规则文件和事件存储，再启动原版本验证。新库已接受业务写入后，不可直接切回旧库丢弃新增数据，应先核对并处理差异。
