# 节点与协议服务管理

Zboard 将基础设施节点和协议服务分离管理。

## 资源关系

```text
VPS 节点资产
    ↓
Protocol Service
    ↓
Node Group
    ↓
Subscription Delivery
```

## 节点管理

节点接入通常包含：

- 配置 VPS 基础信息；
- 验证 SSH 连接；
- 安装或关联 Zero 运行组件；
- 发布协议配置；
- 检查运行状态和事件上报。

## 协议服务

协议服务负责描述业务运行能力，支持复用和迁移，不直接绑定单台服务器。

Zero 相关协议能力、配置模型和控制接口请参考 [Zero Core 项目仓库](https://github.com/zerodenet/core)。

## 运营配置

节点加入后，可以进一步关联：

- 节点组；
- 套餐和 SKU；
- 订阅模板；
- 流量统计规则。
