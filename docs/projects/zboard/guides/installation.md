# 安装与部署

Zboard 推荐使用 Docker Compose 部署。生产部署需要准备 MySQL 8、Redis 和外部 Docker 网络。

## 前置条件

- Docker Engine
- Docker Compose v2
- MySQL 8 数据库
- Redis 服务

## 配置环境变量

至少需要配置：

- `ZBOARD_DATA_SOURCE`：MySQL 连接地址；
- `ZBOARD_REDIS_ADDR`：Redis 地址；
- `ZBOARD_JWT_SECRET`：登录令牌密钥；
- `ZBOARD_CREDENTIAL_ENCRYPTION_KEY`：凭证加密密钥。

## 启动服务

准备环境变量后启动：

```bash
docker compose up -d
```

启动后检查健康状态：

```text
GET /readyz
```

首次访问管理地址时，根据引导完成管理员初始化。

## 部署建议

- 使用反向代理处理公网 HTTPS；
- 不直接暴露管理接口到公网；
- 定期备份数据库和凭证加密密钥；
- 升级前保留当前镜像和数据库备份。

下一步阅读[首次初始化](./first-setup)。
