---
title: 下载 ZNet Sink
description: 自动识别 Windows、macOS 或 Linux，快速下载最新版 ZNet Sink 桌面客户端。
aside: false
outline: false
pageClass: download-page
---

# 下载 ZNet Sink

跨平台桌面代理客户端。选择与你的系统和处理器匹配的安装包，安装后即可导入配置或订阅。

## 先选发布渠道

下方自动下载器读取 GitHub 的最新**正式版**。截至 2026-09-30，正式版为 v0.0.1；较新的插件和设置界面见 [v0.0.2-rc.202609291414 候选版](https://github.com/zerodenet/znet-sink/releases/tag/v0.0.2-rc.202609291414)。候选版是预发布版本，请先备份设置，再从发布页选择对应平台的安装包。

不确定说明适用于哪个版本时，先看[版本与使用限制](/progress)。客户端版本与其运行的 Zero Core 版本需要分别确认。

<DownloadChooser />

## 安装前确认

- 当前核对的 Windows 10/11 安装包为 x86-64；日常安装优先选择 EXE。
- Apple 芯片 Mac 选择 ARM64，Intel Mac 选择 x86-64。
- macOS 安装包当前未完成 Apple 签名和公证；如果提示应用“已损坏”，请按[macOS 处理步骤](/projects/znet-sink/guides/installation#macos-提示应用-已损坏)移除该应用的隔离标记。
- 当前核对的 Linux 安装包为 x86-64。Ubuntu/Debian 使用 DEB，Fedora/RHEL 系使用 RPM；AppImage 需要先执行 `chmod +x`。完整命令见[Linux 安装说明](/projects/znet-sink/guides/installation#linux-通过终端安装或运行)。

安装完成后，继续阅读 [安装与首次启动](/projects/znet-sink/guides/installation) 和 [完成第一次连接](/projects/znet-sink/guides/first-connection)。

<figure class="download-preview">
  <img src="/screenshots/znet-sink-settings.png" alt="ZNet Sink 专业模式中的 DNS 与 Fake-IP 设置界面" loading="lazy">
  <figcaption>DNS 与 Fake-IP 设置界面示例 · 操作位置以所用版本指南为准</figcaption>
</figure>

::: tip 下载来源
所有安装包均来自 ZeroDeNet 官方 GitHub Releases。不要从第三方站点下载二次打包程序。
:::
