# ZNet Sink

<ProjectMeta project-id="znet-sink" />

ZNet Sink 是 Windows、macOS 和 Linux 上的桌面代理客户端，用来管理订阅、选择节点、开启代理并查看连接。客户端负责界面和本机管理，实际转发流量的是单独安装的 Zero 内核。

## 第一次使用

准备一条自己的订阅链接，或服务提供方给出的 Zero JSON 配置，然后从[完成第一次连接](./guides/first-connection)开始。这一页包含下载安装、准备内核、导入来源、选择节点和验证访问的完整过程。

## 连接之后 {#主要功能}

- [管理订阅](./guides/subscriptions)：更新来源、设置同步周期
- [选择节点、设置应用代理或绕过内网](./guides/proxy-and-probes)
- [让更多应用使用代理](./guides/tun)：按需启用 TUN
- [排查连接问题](./guides/troubleshooting)：按现象定位，必要时导出诊断资料

<figure class="product-screenshot product-screenshot--wide">
  <img src="/screenshots/znet-sink-overview-demo.png" alt="ZNet Sink 概览，展示内核运行状态、代理模式、TUN 和流量" loading="lazy">
  <figcaption>概览示意 · 截图使用脱敏演示数据，实际布局以应用为准</figcaption>
</figure>

## 功能不可用时 {#文档适用版本}

客户端、内核和插件分别更新。按钮是否可用还取决于当前配置、系统权限及内核能力；先查看界面的具体提示。平台差异见[使用限制](/progress)。

## 反馈与贡献 {#项目入口}

遇到问题或想参与改进，查看[问题反馈与贡献](./contributing/)。查找其他操作入口可用[功能总览](./guides/features)。
