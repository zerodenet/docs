# 插件第三方登录与注册

这是身份插件贡献者的简要约定。配置和账号使用步骤见[使用登录插件](./login)；所选插件支持的平台以其发行说明为准。

## 用户路径与核心职责

插件验证 OAuth2 / OIDC 外部身份并返回断言，核心处理注册、邮箱验证、账户归属、绑定、审计与会话。身份能力本身不允许改用户角色、订阅或凭证；其他业务操作需要独立的宿主能力和授权。

- 已绑定且正常的账户可登录；新身份仍受站点注册开关约束。
- 没有已验证邮箱时由核心完成邮箱验证。相同邮箱不能用于自动绑定或接管已有账户。
- 绑定需要当前本地账户确认，用户解绑也必须通过核心的密码确认；不能由插件自己修改绑定表。
- 第三方注册用户的初始本地密码由核心在近期授权证明有效时设置，不能覆盖已有密码。
- 停用提供方、改变配置、更新或卸载插件会阻止旧的未完成授权继续提交；已经提交的账户和绑定保留。

## 专用契约

签名清单声明 `zboard.identity.provider.v1`、所需配置能力和服务端程序。协议定义见[PluginControl / 身份消息](https://github.com/zerodenet/zboard/blob/cf6f2cf0838880615063e94d7f5af3113ea03d9f/backend/pkg/pluginapi/v1/control.proto)：

- `ListIdentityProviders` 列出启用的稳定提供方 ID 与名称，最多 16 项；旧单提供方保留兼容入口。
- `GetIdentityProvider` 返回指定提供方的协议、Issuer、授权地址、Client ID 与 scopes。
- `ExchangeIdentity` 接收核心保存的授权码、精确回调地址、nonce、PKCE verifier 和预期 Issuer；返回 Issuer、Subject、邮箱与布尔型已验证标志，不返回第三方令牌。

提供方标识与 Subject 必须稳定。插件负责正确验证 OIDC 签名及 issuer、audience、时效、nonce 等协议要求，或从 OAuth2 提供方的受信任用户资料接口获取身份，不能仅解码未验签内容。

配置公开投影不得泄露密钥；保存配置需遵守宿主修订号与失败回滚规则。多提供方选择、配置绑定和运行状态校验以[宿主身份适配实现](https://github.com/zerodenet/zboard/blob/cf6f2cf0838880615063e94d7f5af3113ea03d9f/backend/internal/plugins/identity.go)为准。

## 状态、事务与端点

核心拥有 OAuth state、nonce、S256 PKCE、浏览器绑定与一次性完成票据。插件不得自己签发 ZBoard 会话或跳过核心完成流程。回调路径固定为 `/api/v1/auth/oidc/callback`，必须使用部署方配置的公开 HTTPS 根地址。

授权状态会过期且只消费一次。宿主重启后需重新授权，多实例入口应路由到活动插件宿主。提交注册、绑定或会话前，核心再次核对插件版本、配置、提供方和账户状态。

端点行为与回归用例请查阅[授权处理](https://github.com/zerodenet/zboard/blob/cf6f2cf0838880615063e94d7f5af3113ea03d9f/backend/internal/handler/external_auth.go)、[注册与初始密码处理](https://github.com/zerodenet/zboard/blob/cf6f2cf0838880615063e94d7f5af3113ea03d9f/backend/internal/handler/external_registration.go)和[身份核心规则](https://github.com/zerodenet/zboard/blob/cf6f2cf0838880615063e94d7f5af3113ea03d9f/backend/internal/capabilities/identity/external.go)，不要复制一套独立的账户或登录实现。

发布前除协议测试外，还需使用部署者实际登记的客户端完成真实授权、绑定、注册关闭和解绑场景验证。元数据检测或模拟身份测试不能证明真实账号授权已经可用。
