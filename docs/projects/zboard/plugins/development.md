# 插件开发与运维

这页保留插件贡献所需的基本约定与源码入口。安装和日常管理请先读[用户安装指南](./marketplace)；无需为了使用插件学习 SDK。

下列源码链接固定到本文核对的 [v0.0.2 RC 对应提交](https://github.com/zerodenet/zboard/tree/cf6f2cf0838880615063e94d7f5af3113ea03d9f)。开发其他版本时，应使用与目标宿主一致的源码和测试，不能把未发布设计视为可用接口。

## 配置宿主

插件目录应独立持久化，并与数据库、凭证加密密钥一起备份；参见[部署配置](./marketplace#_1-配置市场来源)。默认市场可直接使用，未知离线包也可由管理员预览并确认，不要求一律预配 YAML 公钥。

一个数据库同时只有一个活动插件宿主。多实例部署需把插件页面和认证请求路由到活动宿主；重启或接管后重新建立页面及登录会话。插件初始化失败不会阻止核心服务启动，应检查插件状态和服务日志。

原生服务插件不具备操作系统级沙箱。发布者和部署者必须把原生包视为受信任代码，详见[信任边界](./trust)。

## 管理流程

安装、数据准备、配置校验与版本切换由宿主完成，管理端不提供逐项能力授权或手动执行迁移。首次安装停用，更新保留原启停状态，失败保留原安装与数据。

当前只保留活动包，不支持历史回滚。卸载保留配置与私有数据；单独清除数据不会删除核心账户或订阅。完整操作语义见[生命周期与数据](./governance)。

## 创建并签名离线包

从 ZBoard 仓库根目录使用仓库要求的 Go 工具链运行页面示例：

```sh
go -C backend run ./tools/pluginpackager \
  -source ../examples/plugins/welcome \
  -out /tmp/welcome.zbplugin
```

未指定 `-key` 时，工具在操作系统用户配置目录中生成并复用本地签名私钥。正式发布应固定并妥善保管发布者身份和密钥；可使用显式 `-key`、`-key-id`，或用 `-keygen` 生成密钥。私钥不得放入包、源仓库或上传给宿主。

- 包包含 `manifest.json`、`ui/`、`runtimes/` 下允许的普通文件，工具生成摘要和 `signature.json`；不要手工修改已签名清单。
- ID 保持稳定，版本使用严格 SemVer；只声明实际需要的能力、页面、组件与目标平台。
- 包上限 32 MiB，展开内容上限 64 MiB、512 个文件；路径穿越、软链接、未声明文件与摘要不符会被拒绝。
- 发布前验证首次安装、配置、启停、升级失败保留数据、卸载和重新安装；需要数据迁移时保留已发布的迁移历史。

规范与可运行示例：[打包器](https://github.com/zerodenet/zboard/blob/cf6f2cf0838880615063e94d7f5af3113ea03d9f/backend/tools/pluginpackager/main.go)、[清单校验](https://github.com/zerodenet/zboard/blob/cf6f2cf0838880615063e94d7f5af3113ea03d9f/backend/internal/plugins/manifest.go)、[页面示例](https://github.com/zerodenet/zboard/tree/cf6f2cf0838880615063e94d7f5af3113ea03d9f/examples/plugins/welcome)。

## 页面桥

页面及指定位置组件运行在隔离 iframe 中，通过带会话令牌的消息桥访问被允许的操作。不能访问宿主 DOM、取得宿主登录令牌、任意联网或导航顶层窗口。每个请求仍校验页面身份、能力、用途与当前插件状态；停用或更换版本会使旧会话失效。

业务页面用 `capabilities.list` 发现当前获准操作，再按返回契约调用；不要把某个管理员身份或输入中的用户 ID 当成额外授权。配置、私有存储的读写权限可以分别声明，旧的合并能力继续兼容。

消息类型及校验见[前端桥实现](https://github.com/zerodenet/zboard/blob/cf6f2cf0838880615063e94d7f5af3113ea03d9f/frontend/src/plugins/PluginFrame.vue)，业务操作见[宿主能力目录](https://github.com/zerodenet/zboard/blob/cf6f2cf0838880615063e94d7f5af3113ea03d9f/backend/internal/application/plugin_business_catalog.go)。身份入口另有[专用契约](./identity-reference)。

## 服务端 SDK

Go SDK 提供配置与健康检查、身份提供方、后台任务、DNS / 证书提供方、声明的 HTTP 路由和页面操作等专用接口。运行时身份必须与签名清单一致；配置应用按 revision 幂等，不应在配置测试或验证中执行扣款等业务副作用。

原生插件已可通过私有认证连接调用获准的宿主能力，包括受限账户、订阅、消息和私有存储操作。接口不返回数据库连接、SQL、密码哈希或管理令牌；不得绕过声明能力访问内部 HTTP 接口。账户范围的原生调用还必须带有效的插件绑定身份，不能自行指定任意用户。

不要在 Health、配置验证/应用/测试或身份交换等宿主发起的生命周期 RPC 中同步回调私有存储。宿主忙时返回 503，应退出当前回调后重试；修订号冲突 409 需要重新读取并决定，不能原样反复写入。

权威入口：[RPC 契约](https://github.com/zerodenet/zboard/blob/cf6f2cf0838880615063e94d7f5af3113ea03d9f/backend/pkg/pluginapi/v1/control.proto)、[宿主调用 SDK](https://github.com/zerodenet/zboard/blob/cf6f2cf0838880615063e94d7f5af3113ea03d9f/backend/pkg/pluginapi/v1/host.go)、[存储 SDK](https://github.com/zerodenet/zboard/blob/cf6f2cf0838880615063e94d7f5af3113ea03d9f/backend/pkg/pluginapi/v1/storage.go)、[任务约定](https://github.com/zerodenet/zboard/blob/cf6f2cf0838880615063e94d7f5af3113ea03d9f/backend/pkg/pluginapi/v1/tasks.md)、[DNS](https://github.com/zerodenet/zboard/blob/cf6f2cf0838880615063e94d7f5af3113ea03d9f/backend/pkg/pluginapi/v1/dns.md)与[证书](https://github.com/zerodenet/zboard/blob/cf6f2cf0838880615063e94d7f5af3113ea03d9f/backend/pkg/pluginapi/v1/certificate.md)。

## 提供市场目录

公开市场的登记与发行元数据由 [zerodenet/plugins](https://github.com/zerodenet/plugins) 维护。按照该仓库当前贡献规范提交来源、发布者公钥、能力范围和发行信息；同一版本的包、大小和摘要必须保持不变。

自建签名目录是可选分发方式，不是使用默认市场的前提。目录使用 `{payload, signature}`，签名覆盖 payload 的精确字节；schema 为 1，每个插件 ID 一条记录、最多 200 条，有效期须在未来 31 天内。目录及初始包地址必须为公开 HTTPS 443、无查询参数。条目公钥不自动获得签署其他目录的权力。

使用打包器的 `-catalog`、`-key`、`-key-id`、`-out` 签名，发布后再配置宿主 `plugins.catalog_url` 和目录签名者公钥。具体字段以[目录解析与校验](https://github.com/zerodenet/zboard/blob/cf6f2cf0838880615063e94d7f5af3113ea03d9f/backend/internal/plugins/market.go)为准；不要把公开市场 JSON 直接填入该配置。
