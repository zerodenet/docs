---
layout: home
title: ZeroDeNet

hero:
  name: ZeroDeNet
  text: 从第一次连接开始
  tagline: 用 ZNet Sink 连接已有节点，用 Zero Core 运行自己的代理，用 ZBoard 管理自用与分享。选择你的任务，按步骤完成配置和验证。
  actions:
    - theme: brand
      text: 开始使用
      link: /projects/
    - theme: alt
      text: 下载客户端
      link: /download
---

<section class="home-product" aria-labelledby="home-product-title">
  <div class="home-product__copy">
    <p class="home-section-kicker">DESKTOP CLIENT</p>
    <h2 id="home-product-title">从桌面开始，连接更直观</h2>
    <p>已经有订阅链接或代理配置？安装 ZNet Sink，导入配置、选择节点，再开启系统代理。需要接管更多应用时，再设置 TUN。</p>
    <nav aria-label="ZNet Sink 快捷入口">
      <a class="home-product__primary" href="/download">为当前设备下载 <span aria-hidden="true">↓</span></a>
      <a href="/projects/znet-sink/guides/first-connection">完成第一次连接 <span aria-hidden="true">→</span></a>
    </nav>
  </div>
  <figure class="home-product__visual">
    <img src="/screenshots/znet-sink-rules.png" alt="ZNet Sink 专业模式的规则管理界面" loading="eager">
    <figcaption>专业模式界面示例 · 操作位置以所用版本指南为准</figcaption>
  </figure>
</section>

<section class="home-section home-projects" aria-labelledby="home-products-title">
  <p class="home-section-kicker">PROJECTS</p>
  <h2 id="home-products-title">选择适合你的工具</h2>

  <ProjectCatalog compact />
</section>

<section class="home-section home-work" aria-labelledby="home-solutions-title">
  <p class="home-section-kicker">HELP</p>
  <h2 id="home-solutions-title">连接遇到问题？</h2>

  <div class="home-work-list" aria-label="按项目排查问题">
    <div>
      <span>
        <strong><a href="/projects/znet-sink/guides/troubleshooting">客户端无法连接</a></strong>
        <small>依次检查内核、订阅、节点与代理开关。</small>
      </span>
    </div>
    <div>
      <span>
        <strong><a href="/projects/core/guides/troubleshooting">内核或配置报错</a></strong>
        <small>从启动错误、监听端口和请求日志定位问题。</small>
      </span>
    </div>
    <div>
      <span>
        <strong><a href="/projects/zboard/guides/troubleshooting">面板线路无法使用</a></strong>
        <small>检查订阅权限、节点发布、客户端配置和流量上报。</small>
      </span>
    </div>
  </div>
</section>

<section class="home-section home-work" aria-labelledby="home-community-title">
  <p class="home-section-kicker">COMMUNITY</p>
  <h2 id="home-community-title">社区</h2>

  <div class="home-work-list" aria-label="ZeroDeNet 社区入口">
    <div>
      <span>
        <strong><a href="/community/">社区</a></strong>
        <small>讨论、问题反馈、合作与社区入口。</small>
      </span>
    </div>
    <div>
      <span>
        <strong><a href="https://t.me/zerodenet" target="_blank" rel="noreferrer">Telegram</a></strong>
        <small>ZeroDeNet Telegram 群组。</small>
      </span>
    </div>
    <div>
      <span>
        <strong><a href="https://github.com/zerodenet" target="_blank" rel="noreferrer">GitHub</a></strong>
        <small>源码、Issue、Pull Request 和发布记录。</small>
      </span>
    </div>
  </div>
</section>
