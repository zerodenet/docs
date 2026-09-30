# 安装与首次启动

ZNet Sink 是桌面应用，Zero 是实际代理内核。首次使用需要分别准备这两个组件，以及自己的订阅链接或 Zero JSON 配置。安装客户端本身不会提供代理节点。

## 下载安装包

打开[客户端下载页](/download)，页面会根据浏览器识别 Windows、macOS 或 Linux，并优先显示适合当前设备的安装包。无法确认芯片架构时，可以手动选择。

正式版：[v0.0.1](https://github.com/zerodenet/znet-sink/releases/tag/v0.0.1)。当前候选版：[v0.0.2-rc.202609291414](https://github.com/zerodenet/znet-sink/releases/tag/v0.0.2-rc.202609291414)。本指南按候选版核对；选择正式版时，插件和部分设置功能不同。详见[版本范围](../#文档适用版本)。

源码地址：<https://github.com/zerodenet/znet-sink>

下载与你的平台和架构匹配的安装包，并按系统提示完成安装：

| 平台 | 架构 | 安装包 |
| --- | --- | --- |
| Windows 10/11 | x86_64 | NSIS 或 MSI |
| macOS | Intel、Apple Silicon | DMG |
| Linux | x86_64 | DEB、RPM 或 AppImage |

选择安装包本身；`.sig`、`latest.json` 和更新用压缩包不是独立安装程序。当前没有官方 Android/iOS 安装包，也没有 Linux ARM 桌面包。

Linux 系统代理使用 GNOME `gsettings`，不保证其他桌面环境自动接管代理。TUN 另需系统权限。跨平台安装运行的验证范围见[版本与使用限制](/progress)，不能只凭安装包存在判断所有功能都已验收。

不要从非项目发布页下载二次打包程序。升级前先保留原配置，详见[迁移设置与管理内核](./settings-transfer)。

## macOS：提示应用“已损坏”

当前 macOS 安装包尚未完成 Apple 开发者签名和公证。即使文件本身下载完整，macOS 也可能提示“ZNet Sink 已损坏，无法打开”或无法验证开发者。

请先确认 DMG 来自上方 ZeroDeNet 官方 GitHub Releases，并且架构选择正确：Apple 芯片使用 `aarch64.dmg`，Intel Mac 使用 `x64.dmg`。将 ZNet Sink 拖入“应用程序”后，关闭系统提示并打开“终端”，执行：

```bash
sudo xattr -rd com.apple.quarantine "/Applications/ZNet Sink.app"
```

输入当前 Mac 的登录密码后重新打开 ZNet Sink。终端输入密码时不会显示字符，这是正常现象。如果应用放在其他目录，请把命令中的路径改为实际位置。

该命令只移除 ZNet Sink 的下载隔离标记。不要关闭整个系统的 Gatekeeper，也不要对来源不明的应用执行此命令。

## Linux：通过终端安装或运行

Linux 桌面环境不一定会在双击安装包时自动完成安装，建议先打开终端，再根据下载的文件类型执行命令。以下文件名以 `0.0.1` 为例；下载其他版本时，请替换为实际文件名。

### Ubuntu / Debian（DEB）

```bash
cd ~/Downloads
sudo apt install ./ZNet.Sink_0.0.1_amd64.deb
```

`apt install ./文件名.deb` 会同时处理软件包依赖。安装完成后，可以从桌面应用菜单打开 ZNet Sink。

### Fedora / RHEL 系（RPM）

```bash
cd ~/Downloads
sudo dnf install ./ZNet.Sink-0.0.1-1.x86_64.rpm
```

安装完成后，从桌面应用菜单启动。如果系统使用 `yum`，可以把 `dnf` 替换为 `yum`。

### 通用 AppImage

AppImage 不写入系统软件包数据库，需要先授予执行权限，再从终端启动：

```bash
cd ~/Downloads
chmod +x ZNet.Sink_0.0.1_amd64.AppImage
./ZNet.Sink_0.0.1_amd64.AppImage
```

以后仍可执行同一个 AppImage 文件启动客户端；如果移动了文件，需要从新位置运行。当前官方 Linux 桌面安装包仅提供 x86_64 版本。

## 完成首次引导

首次引导介绍界面模式、内核、代理来源和开启服务。完成引导只表示进入应用，内核和订阅仍需实际安装或添加。

第一次建议选**专业模式**，按[第一次连接](./first-connection)只开启系统代理，确认浏览器可用后再配置 TUN。简约模式的电源按钮同时管理系统代理和 TUN；它更省操作，但需要具备 TUN 权限。两种模式以后仍可在标题栏或设置中切换。

<figure class="product-screenshot">
  <img src="/screenshots/znet-sink-settings.png" alt="ZNet Sink 专业模式中的 DNS 设置界面" loading="lazy">
  <figcaption>实机截图 · 设置页会集中展示常用网络选项</figcaption>
</figure>

<figure class="product-screenshot">
  <img src="/screenshots/znet-sink-about.png" alt="ZNet Sink 关于页面，展示客户端版本、构建标识与项目资源" loading="lazy">
  <figcaption>实机截图 · “关于”页可核对客户端版本、构建标识和项目来源</figcaption>
</figure>

## 准备内核组件

打开“设置 → 版本管理”，选择以下任一方式：

- 打开“版本管理”，选择渠道及对应平台的 Zero 版本，点击安装并等待成功。渠道显示为稳定版、测试版、开发版；日常使用优先选择稳定版。
- 手动选择已经存在的 `zero` 或 `zero.exe` 可执行文件。

**完成标志：页面显示有效的内核路径和版本。** 仅下载压缩包或显示一条版本记录，不代表已安装。安装失败时检查页面错误、下载连接和磁盘空间；不要反复切换客户端模式。

内核版本与客户端版本独立，不必具有相同编号。当前稳定内核不一定支持候选客户端的全部功能；遇到“不支持”时先核对内核能力和该功能的要求，不要仅根据版本号猜测。

## 下一步

继续阅读[完成第一次连接](./first-connection)。
