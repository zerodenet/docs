<span id="使用场景"></span>

# 按任务开始

## 桌面代理

**准备好：** 一台 Windows、macOS 或 Linux 电脑，以及可用的订阅链接或代理配置。ZeroDeNet 软件本身不附带可连接的代理服务。

1. [安装 ZNet Sink](/projects/znet-sink/guides/installation)，确认平台与处理器对应
2. [完成第一次连接](/projects/znet-sink/guides/first-connection)：导入、选择配置和节点，再验证系统代理
3. 浏览器能连接后，需要接管不遵循系统代理的应用时再设置 [TUN](/projects/znet-sink/guides/tun)

**成功结果：** 客户端显示内核运行，测试请求能经过选定节点。只有“内核运行中”还不足以判断应用流量已经走代理。

连接失败时，按[客户端故障排查](/projects/znet-sink/guides/troubleshooting)区分内核、订阅、节点和接管问题。

## 运行节点

**准备好：** 可以运行 Zero Core 的电脑或服务器，以及需要使用的协议参数。第一次验证建议先在本机完成。

1. [安装 Zero Core](/projects/core/guides/installation)
2. 按[快速开始](/projects/core/guides/quickstart)运行一个本地 Mixed 代理，用命令行发出测试请求
3. 再按[配置基础](/projects/core/guides/configuration-basics)加入远程代理出站，或从[协议配置](/projects/core/protocols/)选择服务端协议

**成功结果：** 配置校验通过、指定端口开始监听、测试请求成功。示例中的直连出口用于验证本地链路，不会自动提供远程代理。

向其他设备开放监听前设置认证和防火墙；控制 API 保持本地访问，远程使用前阅读[控制接口安全](/projects/core/guides/control-security)。

## 自用与分享 {#服务运营}

**准备好：** 部署 ZBoard 的机器、可管理的代理节点，以及准备使用这些线路的账户。

1. [部署 ZBoard](/projects/zboard/guides/installation)并创建管理员
2. 按[首次初始化](/projects/zboard/guides/first-setup)接入节点、选择可分配的线路、创建使用者并开通订阅
3. 把该使用者的订阅地址导入客户端，检查[订阅交付与用量](/projects/zboard/guides/subscriptions-and-traffic)

**成功结果：** 使用者只能获取被授权的线路，客户端能够连接，面板能够看到对应的用量。节点在线或订单已创建都不等于这条链路已经完成。

按需求逐步增加[前置入口](/projects/zboard/guides/network-fronting)、[备份](/projects/zboard/guides/storage-and-backups)和[插件](/projects/zboard/plugins/)。基础自用与分享流程不要求开通在线支付。

## 应用集成

已有脚本或应用需要控制 Zero Core 时，从[控制 API 使用说明](/projects/core/guides/control-api)开始；只有实现客户端时才需要查阅完整接口契约。

修改项目代码时，先看该项目的贡献说明：

- [Zero Core](/projects/core/contributing/)
- [ZNet Sink](/projects/znet-sink/contributing/)
- [ZBoard](/projects/zboard/contributing/)

## 常见组合

| 需求 | 所需项目 |
| --- | --- |
| 使用已有订阅 | ZNet Sink，按客户端提示安装或选择 Zero Core |
| 直接运行配置文件 | Zero Core |
| 管理自己的节点与分享账户 | ZBoard，加上实际运行的节点 |
| 从节点管理到桌面连接 | ZBoard + Zero Core + ZNet Sink |
