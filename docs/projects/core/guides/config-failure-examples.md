# 配置校验与错误处理

配置变更应遵循“本地草稿 → 无副作用校验 → 用户确认 → 完整应用”的顺序。不要把失败后的半成品继续写回节点。

## 命令行校验

```bash
zero validate candidate.json
```

校验失败时先修复第一条错误，再重新运行。常见原因：

| 现象 | 检查项 |
|------|--------|
| unknown field | 字段名或嵌套层级错误 |
| missing field | 缺少协议必需字段 |
| duplicate tag | 入站、出站或组的 tag 重复 |
| unknown outbound | 路由或组引用了不存在的 tag |
| unsupported/disabled | 当前二进制未编译对应 feature |
| invalid credential | UUID、密码、cipher 或 key 格式错误 |
| duplicate listen | 两个入站使用同一监听地址和端口 |
| group cycle | 出站组之间形成循环引用 |

JSON 语法正确不代表配置能运行。`zero validate` 还会检查引用、协议字段和编译能力。

## 通过控制面校验

控制面使用 `config.validate` 校验完整 JSON 字符串，不改变运行状态：

```json
{
  "type": "command",
  "id": 1,
  "method": "config.validate",
  "params": {
    "config": {
      "inbounds": [
        {
          "tag": "mixed-in",
          "listen": {
            "address": "127.0.0.1",
            "port": 7890
          },
          "protocol": {
            "type": "mixed"
          }
        }
      ],
      "outbounds": [
        {
          "tag": "direct",
          "protocol": {
            "type": "direct"
          }
        }
      ],
      "route": {
        "rules": [],
        "final": {
          "type": "route",
          "outbound": "direct"
        }
      }
    }
  }
}
```

校验成功后，再由用户明确触发 `config.apply`。应用请求必须携带同一份完整候选配置，不是局部 patch。

## 错误响应

控制面响应使用稳定 envelope：

```json
{
  "api_id": "zero.api.v1",
  "ok": false,
  "id": 1,
  "error": {
    "code": "invalid_argument",
    "message": "config validation failed",
    "field_path": null
  }
}
```

客户端应根据 `error.code` 分支，把 `message` 展示给用户；不要解析自然语言消息来决定程序行为。`field_path` 不存在时，把错误显示在配置级别，而不是猜测某个表单字段。

常见错误码：

| code | 处理方式 |
|------|----------|
| `invalid_argument` | 修正输入，不要重试相同请求 |
| `feature_disabled` | 更换包含所需 feature 的发行物或移除该配置 |
| `not_found` | 检查引用的 tag、策略或资源 |
| `permission_denied` | 修正控制面认证或权限 |
| `conflict` | 刷新状态并解决并发操作 |
| `internal` | 保留请求 ID、日志和配置摘要后排查 |

## 应用失败怎么办

`config.apply` 会等待运行时完成协调；监听器重建失败等错误会作为失败响应返回，并尝试维持上一份可用配置。

应用失败后：

1. 不要把候选配置标记为已生效。
2. 查询 `health`、`config` 和 `runtime` 快照确认当前状态。
3. 修复候选配置并再次执行 `config.validate`。
4. 如果状态不确定，保留上一份已知可用配置并检查节点日志。

`config` 查询返回的是运行配置摘要，不是可直接写回的完整 `RuntimeConfig`。控制器或 GUI 必须自己保存完整 desired state。

## 外部控制器的并发规则

当前 `config.apply` 没有外部 revision/CAS 参数。一个节点应由单一配置写入方管理；如果多个界面共享控制权，应在外部控制器中串行化写入并维护版本。

完整应用流程见[安全热更新配置](./hot-reload)，请求格式见[控制面配置合同](/projects/core/control-plane/configuration)。
