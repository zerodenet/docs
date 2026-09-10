# 实现与文档进度

本页记录截至 **2026-09-09** 的主分支实现、公开发布和文档覆盖范围。三个产品仓库的正式主分支均为 `main`，没有 `master`；下列链接固定到本轮读取的提交，不包含 develop、功能分支或未提交改动。

## 版本术语

三个产品当前统一使用 **0.0.1**。安装示例、功能说明和兼容性判断均以此为产品版本基线，不沿用重置前的编号与门槛。

- **产品版本**：Zero Core、ZNet Sink、Zboard 均为 `0.0.1`；Git tag、下载路径和镜像标签按实际发布使用 `v0.0.1`。
- **源码分支与构建**：`main`、`develop` 是分支名称，提交 SHA 用于定位实现；发布渠道与构建标识不替代产品版本。
- **协议与数据格式**：`zero.api.v1`、`zero.event.v1`、配置 `schema_version: 1`、客户端设置 `v2` 和 ZRS `0.1` 各自表示独立契约，保持原有值。

## 核对基线

| 项目 | main 源码快照 | 已公开正式版 | 本轮文档重点 |
| --- | --- | --- | --- |
| Zero Core | [50322956](https://github.com/zerodenet/core/tree/503229562ef5854e3be6be3a9c8e7cbc5efffc61) | [0.0.1](https://github.com/zerodenet/core/releases/tag/v0.0.1) | 管理模式、直连例外、Direct UDP、配置校验与探测语义 |
| ZNet Sink | [6d822fb](https://github.com/zerodenet/znet-sink/tree/6d822fb96140be87cdccdd0bea472ba0b089cf04) | [0.0.1](https://github.com/zerodenet/znet-sink/releases/tag/v0.0.1) | 统一绕过、设置迁移、内核生命周期与版本切换 |
| Zboard | [e1b7246](https://github.com/zerodenet/zboard/tree/e1b7246cc4ef805bf39b22d634ba209114eb3b14) | [0.0.1](https://github.com/zerodenet/zboard/releases/tag/v0.0.1) | 前置转发、共享代理池、可靠发布、订单分配与资源清理 |

Release 已于本轮查询确认公开且非预发布。源码快照说明实现范围；下载后的实际能力仍以制品版本、构建特性和运行时响应为准。源码存在、自动化测试存在、安装验收通过是三个不同结论。

## Zero Core

| 已实现能力 | 对使用者的实际作用 | 使用说明与源码依据 |
| --- | --- | --- |
| 无入站的管理模式 | 未导入代理配置时仍可通过 IPC 管理；首次添加监听失败后可修正重试 | [热更新](/projects/core/guides/hot-reload)；[管理模式契约与测试入口](https://github.com/zerodenet/core/blob/503229562ef5854e3be6be3a9c8e7cbc5efffc61/docs/project/management-idle.md) |
| `route.bypass` / `route_bypass_v1` | 直连例外优先于规则和全局模式，内网访问可保留系统路径 | [运行模式](/projects/core/configuration/modes-and-groups)；[路由实现](https://github.com/zerodenet/core/blob/503229562ef5854e3be6be3a9c8e7cbc5efffc61/crates/engine/src/runtime/route.rs) |
| Direct TCP/UDP 入站 | 固定目标端口转发继续经过既有路由、策略与流量统计 | [配置示例](/projects/core/protocols/configuration)；[监听实现](https://github.com/zerodenet/core/blob/503229562ef5854e3be6be3a9c8e7cbc5efffc61/crates/proxy/src/adapters/direct/inbound.rs) |
| 校验与运行状态隔离 | `zero validate` 不争用运行内核的 Fake-IP 持久化租约，可先校验再升级 | [热更新](/projects/core/guides/hot-reload)；[校验边界](https://github.com/zerodenet/core/blob/503229562ef5854e3be6be3a9c8e7cbc5efffc61/docs/project/config-validation-isolation.md) |
| URLTest 与单节点诊断分离 | 手动诊断可以测试隔离中的节点，但不替代策略测速或清除隔离 | [探测语义](/projects/core/guides/proxy-and-urltest)；[选择与健康规则](https://github.com/zerodenet/core/blob/503229562ef5854e3be6be3a9c8e7cbc5efffc61/docs/project/urltest-selection.md) |

TUN、DNS/Fake-IP 和多协议能力已提供配置与控制接口；具体协议方向、传输及跨平台限制仍应读取[能力矩阵](/projects/core/reference/protocol-capabilities)。源码中的 [TUN/Fake-IP 路线](https://github.com/zerodenet/core/blob/503229562ef5854e3be6be3a9c8e7cbc5efffc61/docs/project/tun-fakeip-roadmap.md)包含后续验收目标，不能据此把所有平台防漏、网络切换和进程路由标为完成。

## ZNet Sink

| 已实现能力 | 对使用者的实际作用 | 使用说明与源码依据 |
| --- | --- | --- |
| 网络设置中的统一绕过策略 | 一次维护本地网络、IP/CIDR 和域名例外，生成系统代理、TUN 与内核路由设置 | [统一绕过](/projects/znet-sink/guides/proxy-and-probes#统一绕过规则)；[策略投影](https://github.com/zerodenet/znet-sink/blob/6d822fb96140be87cdccdd0bea472ba0b089cf04/src-tauri/src/services/bypass.rs) |
| 可移植设置 v2 | 导出 DNS、TUN 和绕过偏好，导入旧设置时迁移，避免静默丢失域名例外 | [设置迁移](/projects/znet-sink/guides/settings-transfer)；[导入实现](https://github.com/zerodenet/znet-sink/blob/6d822fb96140be87cdccdd0bea472ba0b089cf04/src-tauri/src/services/kernel_settings.rs) |
| 受管内核启动与恢复 | 无代理配置时保留管理入口；启动确认健康 IPC，升级失败进入恢复路径 | [功能总览](/projects/znet-sink/guides/features)；[内核接入与恢复](https://github.com/zerodenet/znet-sink/blob/6d822fb96140be87cdccdd0bea472ba0b089cf04/docs/gui/core.md) |

0.0.1 已发布 Windows x86_64、macOS Intel/Apple Silicon 和 Linux x86_64 安装包。该版本的[发布记录](https://github.com/zerodenet/znet-sink/blob/6d822fb96140be87cdccdd0bea472ba0b089cf04/docs/releases/v0.0.1.md)明确保留四个平台安装运行验收的豁免：DNS 与接管模式组合、升级中断恢复、退出清理及跨资源故障注入等仍待补验。不能把发布成功写成这些场景已经安装验收通过。

## ZBoard

::: info 文档迁移与开发版补充（2026-09-10）
以下表格保留 2026-09-09 的 main 核对记录。新迁入的[插件说明](/projects/zboard/plugins/)覆盖 0.0.1 发布后的开发分支能力；不代表原始 0.0.1 安装包已包含插件运行时。ZBoard 定位为基础面板，在线支付等业务扩展通过插件实现，当前尚未开放支付业务接口。
:::

| 已实现能力 | 对运营者的实际作用 | 使用说明与源码依据 |
| --- | --- | --- |
| 前置转发与节点共享代理池 | 在协议服务中管理 A 到 B 的 TCP/UDP 路径，多入口共用代理池 | [协议服务](/projects/zboard/guides/protocol-services)；[前置交付实现](https://github.com/zerodenet/zboard/blob/e1b7246cc4ef805bf39b22d634ba209114eb3b14/backend/internal/handler/network_entry_delivery.go) |
| 持久化节点发布队列 | 权益变更与发布请求一同落库；失败和服务重启后继续重试 | [节点发布](/projects/zboard/guides/node-management)；[工作线程](https://github.com/zerodenet/zboard/blob/e1b7246cc4ef805bf39b22d634ba209114eb3b14/backend/internal/handler/node_publish_worker.go) |
| 管理员分配订单 | 为指定用户创建待付款订单、调整应付金额并保留原因，确认后开通权益 | [订单操作](/projects/zboard/guides/plans-and-orders)；[分配实现](https://github.com/zerodenet/zboard/blob/e1b7246cc4ef805bf39b22d634ba209114eb3b14/backend/internal/handler/admin_order_assignment.go) |
| 本地删除与独立远端清理 | 节点或供应商不可达时可清理面板记录；远端停机另行执行 | [节点清理](/projects/zboard/guides/node-management#删除节点与远端清理)；[删除实现](https://github.com/zerodenet/zboard/blob/e1b7246cc4ef805bf39b22d634ba209114eb3b14/backend/internal/handler/node_delete_cascade.go) |
| 规则集按客户端能力交付 | Clash/sing-box 可保留进程条件，Zero 模板拒绝不支持的规则集 | [规则兼容](/projects/zboard/guides/subscriptions-and-traffic#规则集与客户端兼容性)；[兼容检查](https://github.com/zerodenet/zboard/blob/e1b7246cc4ef805bf39b22d634ba209114eb3b14/backend/internal/handler/managed_rule_client_compatibility.go) |

当前提供用户、节点、订阅、基础订单和流量计量闭环。此 main 快照尚未包含后来在开发分支实现的插件运行时。在线支付属于插件扩展范围，支付业务接口仍待实现；历史范围见[当前范围](https://github.com/zerodenet/zboard/blob/e1b7246cc4ef805bf39b22d634ba209114eb3b14/docs/core-baseline.md)。[0.0.1 发布记录](https://github.com/zerodenet/zboard/blob/e1b7246cc4ef805bf39b22d634ba209114eb3b14/docs/release/v0.0.1.md)也未将 24 小时长稳、500 events/s 突发或完整多节点恢复标为验收完成。

## 本轮核对范围

本轮读取 main 的配置模型、路由和监听实现、客户端设置与迁移代码、面板处理器和相关测试源码，并同步相关使用页。未运行三个产品的全量测试、安装包或真实节点操作；文档检查与构建结果记录在 [CONTENT_SYNC.md](https://github.com/zerodenet/docs/blob/develop/CONTENT_SYNC.md)。
