# 订阅节点筛选

每个订阅链接只对应一份订阅。可以通过查询参数筛选客户端收到的节点，筛选不会改变原订阅的权限范围。

```text
/api/v1/client/subscription/{subscription-token}
  ?template=clash
  &protocol=vless,hysteria2
  &region=jp,hk
  &tag=premium,streaming
  &exclude_tag=maintenance
  &plan=pro
  &sku=pro-annual
  &node_group=jp-premium
  &q=日本
```

## 权限范围

面板先检查链接绑定的订阅是否属于当前用户、是否有效、是否到期以及是否还有流量，再从该订阅已经授权的节点中筛选结果。

筛选只能减少节点，不能添加节点组、协议服务、凭据、套餐或其他订阅。即使同一账号有多份订阅，`plan`、`sku` 和 `node_group` 也不能把当前链接切换到另一份订阅。

`Subscription-Userinfo` 响应头中的流量与到期时间始终对应这份订阅，不会汇总整个账号的数据。

## 筛选参数

| 参数 | 含义 | 匹配方式 |
| --- | --- | --- |
| `template` | 已有订阅模板标识或 `native` | 精确匹配 |
| `plan` | 套餐的稳定标识 | 多个值满足任意一个 |
| `sku` | 套餐规格代码 | 多个值满足任意一个 |
| `node_group` | 节点组代码 | 多个值满足任意一个 |
| `protocol` | 协议代码 | 多个值满足任意一个 |
| `region` | 节点区域 | 多个值满足任意一个 |
| `tag` | 协议服务标签 | 包含任意指定标签 |
| `exclude_tag` | 需要排除的协议服务标签 | 命中任意标签即排除 |
| `q` | 协议服务名称关键词 | 不区分大小写的包含匹配 |

不同参数需要同时满足。同一参数的多个值可以用逗号分隔，也可以重复传入查询参数；面板会规范化、去重，并限制数量与长度。

例如，`protocol=vless,hysteria2&region=jp` 表示保留日本区域的 VLESS 或 Hysteria2 节点。

无效代码、不支持的协议、过长的值或控制字符会返回 HTTP 400。合法筛选没有匹配节点时，返回有效的空订阅，仍保留该订阅的额度信息，并使用 `Cache-Control: no-store`。

## 排序和服务状态

筛选后的节点继续遵循管理员设置的交付顺序。关闭协议服务会同时停止其订阅交付和运行配置发布；重新启用后，通过正常发布流程恢复。

## 订阅链接接口

已登录用户可以针对指定订阅读取、轮换或撤销链接：

| 方法 | 路径 | 作用 |
| --- | --- | --- |
| `GET` | `/api/v1/account/subscriptions/{id}/access` | 读取有效订阅的链接，尚未生成时按需创建 |
| `POST` | `/api/v1/account/subscriptions/{id}/access/rotate` | 仅更换该订阅的令牌 |
| `DELETE` | `/api/v1/account/subscriptions/{id}/access` | 仅撤销该订阅的令牌 |

继续阅读[订阅配置与流量](./subscriptions-and-traffic)。
