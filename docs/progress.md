<span id="实现与文档进度"></span>
<span id="版本与使用限制"></span>

# 升级与兼容

遇到界面入口缺失、配置不识别或升级后行为变化时，先确认正在使用的程序、配置与插件是否匹配。首次使用直接跟随对应项目教程即可。

<span id="版本术语"></span>
<span id="核对基线"></span>

## 选择发布渠道

从各项目的官方发布页获取软件：[Zero Core](https://github.com/zerodenet/core/releases)、[ZNet Sink](https://github.com/zerodenet/znet-sink/releases)、[ZBoard](https://github.com/zerodenet/zboard/releases)。

- **正式版**：日常使用优先选择；客户端自动下载页列出这个渠道
- **候选版（RC）**：用于测试即将发布的能力，升级前阅读说明并准备备份
- **开发版**：用于验证实验能力，不能仅因为编号较大就覆盖当前可用环境

某项功能还没有进入所用版本时，需要选择包含它的发布包或等待后续发布。不要改文件名、镜像标签或配置版本字段来绕过兼容检查。

三个项目分别更新，版本号相同不代表能力相同。配置格式、设置备份和插件协议也有各自的兼容要求。

## Zero Core：核对实际内核 {#zero-core}

运行 `zero build-info` 查看实际构建；遇到协议或配置不支持的错误时，检查[协议能力与构建限制](/projects/core/reference/protocol-capabilities)，再用 `zero validate` 校验完整配置。

WireGuard 等实验能力需要包含对应功能的构建。TUN 还依赖系统权限与平台支持，不能用“进程已启动”判断路由、DNS 和所有应用都已接管。

升级时保留旧二进制、配置和状态目录，先用新程序校验配置再替换。详细步骤见[更新与回退](/projects/core/guides/installation#更新源码)；有配置语义变化时查看[兼容性与破坏性变更](/projects/core/control-plane/breaking-changes)。

## ZNet Sink：客户端与内核分别确认 {#znet-sink}

客户端负责界面，Zero Core 负责转发。某个入口不存在时检查客户端版本；配置字段或协议被拒绝时同时检查内核。插件还会检查自己的兼容条件和运行权限。

换电脑、重装或回退前，阅读[设置迁移与内核管理](/projects/znet-sink/guides/settings-transfer)。设置导出不等于备份全部订阅和代理配置，也不保证旧客户端能读取新版格式。

如果版本相符但仍无法连接，回到[故障排查](/projects/znet-sink/guides/troubleshooting)，分别检查内核、来源、节点及系统代理/TUN。

## ZBoard：保留可恢复的数据 {#zboard}

面板、节点内核和插件分别管理。升级前阅读发布说明，备份数据库、部署配置、插件目录和凭据加密密钥，并让部署文件与镜像对应同一发行版本。

数据库迁移后，直接换回旧镜像不等于完成回退。按[升级与恢复](/projects/zboard/guides/maintenance#upgrade)准备相匹配的程序和数据，再验证登录、节点发布、订阅连接与用量。

老版本没有插件或新版管理入口时，不要通过手工改库补入口；先选择支持该功能的发行版本，按正常升级流程迁移。

## 反馈问题时带上什么

提供项目名、完整版本、操作系统、操作步骤、预期和实际结果。客户端问题同时提供内核版本；面板问题注明节点内核与相关插件版本。日志、截图和配置先删除令牌、密码、私钥与用户信息，再到[对应项目反馈](/community/#问题反馈)。

<span id="本轮核对范围"></span>
