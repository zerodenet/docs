<span id="实现与文档进度"></span>

# 版本与使用限制

安装包决定你实际能用什么。文档中的候选版功能和源码改动，不会自动出现在旧正式版里。本页于 **2026-09-30** 核对；后续发布请以各项目 Releases 为准。

<span id="版本术语"></span>
<span id="核对基线"></span>

## 选择发布渠道

| 项目 | 最近正式版 | 本次核对的候选版（预发布） |
| --- | --- | --- |
| Zero Core | [v0.0.1](https://github.com/zerodenet/core/releases/tag/v0.0.1) | [v0.0.2-rc.202609290540](https://github.com/zerodenet/core/releases/tag/v0.0.2-rc.202609290540) |
| ZNet Sink | [v0.0.1](https://github.com/zerodenet/znet-sink/releases/tag/v0.0.1) | [v0.0.2-rc.202609291414](https://github.com/zerodenet/znet-sink/releases/tag/v0.0.2-rc.202609291414) |
| ZBoard | [v0.0.1](https://github.com/zerodenet/zboard/releases/tag/v0.0.1) | [v0.0.2-rc.202609291405](https://github.com/zerodenet/zboard/releases/tag/v0.0.2-rc.202609291405) |

- **正式版**：GitHub 未标为预发布的制品；本站的客户端自动下载器读取此渠道
- **候选版（RC）**：可下载的预发布制品，包含较新的功能和修复；升级前备份并确认回退方式
- **开发版 / 源码构建**：只说明该提交的实现；未随候选版发布的修复，需要等待后续制品或自行构建

三个项目独立发布，版本数字相同也不代表可以任意搭配。不要只改文件名、镜像标签或配置版本来模拟升级。配置 `schema_version: 1`、控制 API `zero.api.v1`、设置导出格式和插件协议也各有自己的版本。

Core 另有公开开发版 [v0.0.3-dev.202609281319](https://github.com/zerodenet/core/releases/tag/v0.0.3-dev.202609281319)，用于试验 RC 之外的能力。版本号较大不代表比候选版更适合日常使用；按需要选择渠道，不混用其能力说明。

## Zero Core：核对实际内核 {#zero-core}

使用 `zero --version` 记录构建版本；启用控制接口时再查看 `health` 与 `capabilities`。协议方向、传输和构建特性以[能力矩阵](/projects/core/reference/protocol-capabilities)为准。

- TUN、DNS 与 Fake-IP 已有实现，但系统权限、路由恢复和网络切换需要按平台验证。先跑通普通代理，再启用 [TUN 与 DNS](/projects/core/guides/tun-and-dns)
- WireGuard 按公开开发版的实验能力说明使用，并检查对应构建特性；不能套用到正式版或 RC
- 开发分支合入的修复可能晚于上表制品；升级前对照发布记录，不把源码状态当作安装包状态
- Linux/macOS 的自动检查不能替代 Windows 实机网卡切换验收，macOS 的 UID 防回环也仍有平台限制

配置失败时保留原文件与错误信息，先按[故障排查](/projects/core/guides/troubleshooting)定位，避免在远程机器上直接试错路由。

## ZNet Sink：客户端与内核分别确认 {#znet-sink}

客户端运行成功并不代表系统代理或 TUN 已接管流量。遇到与说明不符的界面，先确认客户端版本，再确认当前 Zero Core 版本。

- 新版插件和按配置保存的网络设置以候选版说明为准；正式版 v0.0.1 不包含之后加入的功能
- 当前核对的客户端制品覆盖 Windows x86-64、macOS Intel / Apple Silicon 和 Linux x86-64
- Linux 系统代理使用 GNOME 的设置接口；其他桌面环境需按[首次连接](/projects/znet-sink/guides/first-connection)验证应用是否遵循代理
- TUN 需要额外系统权限。简约模式的连接按钮会同时请求系统代理和 TUN；只想先验证系统代理时按[首次连接](/projects/znet-sink/guides/first-connection)使用专业模式

升级前[导出设置并备份](/projects/znet-sink/guides/settings-transfer)。发布完成或 CI 通过均不等于所有桌面环境、网络切换和升级中断场景已完成实机验收。

## ZBoard：先完成一次真实交付 {#zboard}

当前用户指南按上表 RC 核对。它以自用和分享为主要阅读路径：用户、节点、订阅与用量由基础面板管理，额外能力按需安装插件。

- 插件宿主、第三方登录和支付集成有各自的能力与信任要求；旧正式版 v0.0.1 不应照搬新插件指南
- 创建订单后仍需完成确认与履约，客户端才会获得有效权益；自用分配无需因此启用支付插件
- 仅授权前置入口时，可交付父协议凭据及该入口地址；直连地址需要单独授权
- 升级前同时备份数据库、插件目录与加密密钥；不要把还原旧二进制当作数据库回滚

按[首次初始化](/projects/zboard/guides/first-setup)验证“配置交付 → 客户端连接 → 用量返回”，遇到问题按[故障排查](/projects/zboard/guides/troubleshooting)逐段检查。

## 反馈问题时带上什么

提供项目名、完整版本、操作系统、操作步骤、预期和实际结果。客户端问题同时提供内核版本；面板问题注明节点内核与插件版本。日志、截图和配置先删除订阅地址中的令牌、密码、私钥和用户信息，再到[对应项目反馈](/community/#问题反馈)。

<span id="本轮核对范围"></span>

维护者可在仓库 [CONTENT_SYNC.md](https://github.com/zerodenet/docs/blob/develop/CONTENT_SYNC.md)查看本轮源码核对与文档验证范围。
