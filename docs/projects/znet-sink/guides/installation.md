# 安装包与平台说明 {#安装与首次启动}

这里补充安装包选择、macOS 提示和 Linux 命令行安装。第一次从零开始使用，请按[完成第一次连接](./first-connection)走完整流程；不必先读完本页。

## 下载安装包

打开[客户端下载页](/download)，页面会根据浏览器识别 Windows、macOS 或 Linux，并优先显示适合当前设备的安装包。无法确认芯片架构时，可以手动选择。

也可从[官方发布页](https://github.com/zerodenet/znet-sink/releases)选择安装包。日常使用优先正式版，只有需要测试新功能时再选预发布版本。

下载与你的平台和架构匹配的安装包，并按系统提示完成安装：

| 平台 | 架构 | 安装包 |
| --- | --- | --- |
| Windows 10/11 | x86_64 | NSIS 或 MSI |
| macOS | Intel、Apple Silicon | DMG |
| Linux | x86_64 | DEB、RPM 或 AppImage |

选择安装包本身；`.sig`、`latest.json` 和更新用压缩包不是独立安装程序。当前没有官方 Android/iOS 安装包，也没有 Linux ARM 桌面包。

Linux 系统代理使用 GNOME `gsettings`，其他桌面环境可能需要在应用中手动填写代理。TUN 另需系统权限。

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

Linux 桌面环境不一定会在双击安装包时自动完成安装，建议先打开终端，再根据下载的文件类型执行命令。先进入下载文件所在目录，将以下命令中的“文件名”替换为实际名称。

### Ubuntu / Debian（DEB）

```bash
cd ~/Downloads
sudo apt install ./文件名.deb
```

`apt install ./文件名.deb` 会同时处理软件包依赖。安装完成后，可以从桌面应用菜单打开 ZNet Sink。

### Fedora / RHEL 系（RPM）

```bash
cd ~/Downloads
sudo dnf install ./文件名.rpm
```

安装完成后，从桌面应用菜单启动。如果系统使用 `yum`，可以把 `dnf` 替换为 `yum`。

### 通用 AppImage

AppImage 不写入系统软件包数据库，需要先授予执行权限，再从终端启动：

```bash
cd ~/Downloads
chmod +x 文件名.AppImage
./文件名.AppImage
```

以后仍可执行同一个 AppImage 文件启动客户端；如果移动了文件，需要从新位置运行。当前官方 Linux 桌面安装包仅提供 x86_64 版本。

## 完成首次引导

完成引导只表示进入应用，内核和订阅仍需实际准备。为便于先验证系统代理，在首次引导中选择专业模式；以后可在标题栏或设置中更改。

## 准备内核组件

客户端安装成功但提示没有内核时，打开“设置 → 版本管理”安装 Zero，或选择已有的 `zero` / `zero.exe`。安装后应显示有效路径和版本。

内核和客户端分别更新。安装、导入来源和连接的连续步骤见[第一次连接](./first-connection#_2-安装-zero-内核)；已有内核需要升级时，见[安装与选择内核](./settings-transfer#安装与选择内核)。

## 下一步

安装完成后，回到[第一次连接](./first-connection)继续准备内核和代理来源。
