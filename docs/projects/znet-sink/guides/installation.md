# 安装与首次启动

ZNet Sink 是桌面代理客户端。安装应用后，还需要在首次引导或设置中完成内核组件准备。

## 下载安装包

打开[客户端下载页](/download)，页面会根据浏览器识别 Windows、macOS 或 Linux，并优先显示适合当前设备的安装包。无法确认芯片架构时，可以手动选择。

GitHub 发布页：<https://github.com/zerodenet/znet-sink/releases/latest>

源码地址：<https://github.com/zerodenet/znet-sink>

下载与你的平台和架构匹配的安装包，并按系统提示完成安装：

| 平台 | 架构 | 安装包 |
| --- | --- | --- |
| Windows 10/11 | x86_64 | NSIS 或 MSI |
| macOS | Intel、Apple Silicon | DMG |
| Linux | x86_64 | DEB、RPM 或 AppImage |

不要从非项目发布页下载二次打包程序。升级前如需保留诊断或配置快照，请先查看[数据与诊断](./data-and-diagnostics)。

## macOS：提示应用“已损坏”

当前 macOS 安装包尚未完成 Apple 开发者签名和公证。即使文件本身下载完整，macOS 也可能提示“ZNet Sink 已损坏，无法打开”或无法验证开发者。

请先确认 DMG 来自上方 ZeroDeNet 官方 GitHub Releases，并且架构选择正确：Apple 芯片使用 `aarch64.dmg`，Intel Mac 使用 `x64.dmg`。将 ZNet Sink 拖入“应用程序”后，关闭系统提示并打开“终端”，执行：

```bash
sudo xattr -rd com.apple.quarantine "/Applications/ZNet Sink.app"
```

输入当前 Mac 的登录密码后重新打开 ZNet Sink。终端输入密码时不会显示字符，这是正常现象。如果应用放在其他目录，请把命令中的路径改为实际位置。

该命令只移除 ZNet Sink 的下载隔离标记。不要关闭整个系统的 Gatekeeper，也不要对来源不明的应用执行此命令。

## Linux：通过终端安装或运行

Linux 桌面环境不一定会在双击安装包时自动完成安装，建议先打开终端，再根据下载的文件类型执行命令。以下文件名以 `0.0.15` 为例；下载其他版本时，请替换为实际文件名。

### Ubuntu / Debian（DEB）

```bash
cd ~/Downloads
sudo apt install ./ZNet.Sink_0.0.15_amd64.deb
```

`apt install ./文件名.deb` 会同时处理软件包依赖。安装完成后，可以从桌面应用菜单打开 ZNet Sink。

### Fedora / RHEL 系（RPM）

```bash
cd ~/Downloads
sudo dnf install ./ZNet.Sink-0.0.15-1.x86_64.rpm
```

安装完成后，从桌面应用菜单启动。如果系统使用 `yum`，可以把 `dnf` 替换为 `yum`。

### 通用 AppImage

AppImage 不写入系统软件包数据库，需要先授予执行权限，再从终端启动：

```bash
cd ~/Downloads
chmod +x ZNet.Sink_0.0.15_amd64.AppImage
./ZNet.Sink_0.0.15_amd64.AppImage
```

以后仍可执行同一个 AppImage 文件启动客户端；如果移动了文件，需要从新位置运行。当前官方 Linux 桌面安装包仅提供 x86_64 版本。

## 完成首次引导

首次启动包含三个步骤：

1. 检查当前平台和应用数据目录。
2. 选择简约模式或专业模式。
3. 进入应用后准备内核组件、代理配置或订阅。

界面模式以后仍可在应用内切换。

<figure class="product-screenshot">
  <img src="/screenshots/znet-sink-settings.png" alt="ZNet Sink 专业模式中的 DNS 设置界面" loading="lazy">
  <figcaption>实机截图 · 设置页会集中展示常用网络选项</figcaption>
</figure>

<figure class="product-screenshot">
  <img src="/screenshots/znet-sink-about.png" alt="ZNet Sink 关于页面，展示客户端版本、构建标识与项目资源" loading="lazy">
  <figcaption>实机截图 · “关于”页可核对客户端版本、构建标识和项目来源</figcaption>
</figure>

## 准备内核组件

打开“设置 → 内核”，选择以下任一方式：

- 使用版本管理安装对应平台的内核组件；版本列表按稳定版、测试版和每日构建区分。
- 手动选择已经存在的 `zero` 或 `zero.exe` 可执行文件。

完成后确认页面能够识别内核路径和版本。若当前版本不受支持，客户端会在版本管理或能力信息中给出提示。

## 下一步

继续阅读[完成第一次连接](./first-connection)。
