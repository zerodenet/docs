<script setup lang="ts">
import { computed, ref } from 'vue'

type TabId = 'overview' | 'nodes' | 'profiles' | 'subscriptions' | 'rules' | 'connections' | 'logs' | 'settings' | 'debug'

interface TourStep {
  tab: TabId
  kicker: string
  title: string
  description: string
  hint: string
}

const tabs: { id: TabId; label: string }[] = [
  { id: 'overview', label: '概览' },
  { id: 'nodes', label: '节点' },
  { id: 'profiles', label: '配置' },
  { id: 'subscriptions', label: '订阅' },
  { id: 'rules', label: '规则' },
  { id: 'connections', label: '连接' },
  { id: 'logs', label: '日志' },
  { id: 'settings', label: '设置' },
  { id: 'debug', label: '调试' },
]

const modes = ['全局', '规则', '直连'] as const
const connectionFilters = ['全部', '活动', '已完成'] as const

const steps: TourStep[] = [
  {
    tab: 'overview',
    kicker: '01 · 建立连接',
    title: '先确认内核、配置与接管入口',
    description: '概览页把当前配置、代理模式、系统代理、TUN 和实时流量放在同一处。连接前先看绿色状态，再开启需要的入口。',
    hint: '试试切换系统代理、TUN 或代理模式。',
  },
  {
    tab: 'subscriptions',
    kicker: '02 · 导入配置',
    title: '通过订阅生成可用配置',
    description: '订阅同步后会生成或更新本地配置。演示地址使用 example.net，不会发起真实请求，也不包含任何凭据。',
    hint: '点击“同步全部”，观察同步状态变化。',
  },
  {
    tab: 'nodes',
    kicker: '03 · 选择出口',
    title: '测速并切换策略组选中项',
    description: '节点页展示策略组、协议、延迟和可用状态。选择节点会更新当前策略，但不会改写订阅源。',
    hint: '选择任意节点，或运行一次模拟测速。',
  },
  {
    tab: 'rules',
    kicker: '04 · 理解分流',
    title: '规则决定请求走代理、直连或阻断',
    description: '规则集可以来自内置数据、远程订阅或本地覆盖。规则模式下，越明确的业务规则越容易排查。',
    hint: '这里的数据全部是保留域名和示例网段。',
  },
  {
    tab: 'connections',
    kicker: '05 · 观察连接',
    title: '从连接记录确认实际路由结果',
    description: '连接页把目标、协议、出站、规则和流量放在一行。排障时先筛选异常状态，再打开详情检查完整生命周期。',
    hint: '使用状态筛选器查看活动或已完成连接。',
  },
  {
    tab: 'debug',
    kicker: '06 · 定位问题',
    title: '最后使用日志与诊断工具',
    description: '当状态与预期不一致时，再检查 DNS、路由追踪、控制事件和日志。公开材料前仍应复核其中的地址与路径。',
    hint: '诊断按钮只更新演示结果，不访问本机或网络。',
  },
]

const activeTab = ref<TabId>('overview')
const stepIndex = ref(0)
const serviceOn = ref(true)
const systemProxyOn = ref(true)
const tunOn = ref(false)
const mode = ref<'全局' | '规则' | '直连'>('规则')
const selectedNode = ref('Tokyo Edge')
const probing = ref(false)
const syncing = ref(false)
const syncLabel = ref('刚刚同步')
const connectionFilter = ref<'全部' | '活动' | '已完成'>('全部')
const diagnosticResult = ref('等待检查')
const notice = ref('')
let noticeTimer: ReturnType<typeof setTimeout> | undefined

const nodes = ref([
  { name: 'Tokyo Edge', region: 'JP', protocol: 'VLESS', latency: 42, alive: true },
  { name: 'Singapore Relay', region: 'SG', protocol: 'Hysteria2', latency: 68, alive: true },
  { name: 'Frankfurt Core', region: 'DE', protocol: 'Trojan', latency: 156, alive: true },
  { name: 'Offline Sample', region: 'TEST', protocol: 'Shadowsocks', latency: 0, alive: false },
])

const connections = [
  { target: 'docs.example.com:443', protocol: 'TCP', route: '开发文档', outbound: 'Tokyo Edge', traffic: '2.4 MB', state: '活动' },
  { target: 'api.example.net:443', protocol: 'TCP', route: '规则集 / Proxy', outbound: 'Tokyo Edge', traffic: '860 KB', state: '活动' },
  { target: 'updates.example.org:443', protocol: 'TCP', route: '软件更新', outbound: 'Singapore Relay', traffic: '14.8 MB', state: '已完成' },
  { target: '192.0.2.25:53', protocol: 'UDP', route: 'DNS 劫持', outbound: 'Direct', traffic: '3.2 KB', state: '已完成' },
]

const visibleConnections = computed(() => connectionFilter.value === '全部'
  ? connections
  : connections.filter(item => item.state === connectionFilter.value))

const activeStep = computed(() => steps[stepIndex.value])

function showNotice(message: string) {
  notice.value = message
  if (noticeTimer) window.clearTimeout(noticeTimer)
  noticeTimer = window.setTimeout(() => { notice.value = '' }, 2200)
}

function selectStep(index: number) {
  stepIndex.value = Math.max(0, Math.min(index, steps.length - 1))
  activeTab.value = steps[stepIndex.value].tab
}

function selectTab(tab: TabId) {
  activeTab.value = tab
  const matchingStep = steps.findIndex(step => step.tab === tab)
  if (matchingStep >= 0) stepIndex.value = matchingStep
}

function toggleService() {
  serviceOn.value = !serviceOn.value
  if (!serviceOn.value) {
    systemProxyOn.value = false
    tunOn.value = false
  }
  showNotice(serviceOn.value ? '演示服务已启动' : '演示服务已停止')
}

function toggleCapture(target: 'proxy' | 'tun') {
  if (!serviceOn.value) serviceOn.value = true
  if (target === 'proxy') systemProxyOn.value = !systemProxyOn.value
  else tunOn.value = !tunOn.value
}

function runProbe() {
  if (probing.value) return
  probing.value = true
  showNotice('正在进行模拟测速…')
  window.setTimeout(() => {
    nodes.value = nodes.value.map((node, index) => node.alive
      ? { ...node, latency: [38, 64, 149][index] ?? node.latency }
      : node)
    probing.value = false
    showNotice('模拟测速完成')
  }, 850)
}

function syncSubscriptions() {
  if (syncing.value) return
  syncing.value = true
  syncLabel.value = '同步中…'
  window.setTimeout(() => {
    syncing.value = false
    syncLabel.value = '刚刚同步'
    showNotice('演示订阅同步完成，配置已更新')
  }, 900)
}

function runDiagnostic(label: string) {
  diagnosticResult.value = `${label}：正常 · 18 ms`
  showNotice(`${label}模拟检查完成`)
}
</script>

<template>
  <section class="client-tour" aria-label="ZNet Sink 交互式客户端导览">
    <div class="tour-notice">
      <span class="tour-notice__dot" aria-hidden="true"></span>
      交互演示 · 页面仅使用假数据，不会调用本机客户端、内核或网络
    </div>

    <div class="tour-layout">
      <aside class="tour-guide" aria-label="使用流程">
        <div class="tour-guide__top">
          <span>{{ activeStep.kicker }}</span>
          <strong>{{ activeStep.title }}</strong>
          <p>{{ activeStep.description }}</p>
        </div>

        <ol class="tour-steps">
          <li v-for="(step, index) in steps" :key="step.title">
            <button
              type="button"
              :class="{ active: index === stepIndex }"
              :aria-current="index === stepIndex ? 'step' : undefined"
              @click="selectStep(index)"
            >
              <span>{{ String(index + 1).padStart(2, '0') }}</span>
              {{ step.title }}
            </button>
          </li>
        </ol>

        <div class="tour-guide__hint">
          <span>本步可操作</span>
          <p>{{ activeStep.hint }}</p>
        </div>

        <div class="tour-guide__actions">
          <button type="button" :disabled="stepIndex === 0" @click="selectStep(stepIndex - 1)">上一步</button>
          <button type="button" class="primary" @click="selectStep(stepIndex === steps.length - 1 ? 0 : stepIndex + 1)">
            {{ stepIndex === steps.length - 1 ? '重新开始' : '下一步' }}
          </button>
        </div>
      </aside>

      <div class="app-frame">
        <div class="app-titlebar">
          <div class="app-identity">
            <img src="/brand/znet-sink-app-icon.png" alt="" width="22" height="22">
            <strong>ZNet Sink</strong>
            <span>v0.0.16</span>
            <i aria-hidden="true"></i>
            <div class="app-segment" aria-label="界面模式">
              <button type="button">简约</button>
              <button type="button" class="active">专业</button>
            </div>
          </div>
          <div class="app-window-actions">
            <button type="button" class="status" :class="{ online: serviceOn }" @click="toggleService">
              <span></span>{{ serviceOn ? '服务中' : '已停止' }}
            </button>
            <i aria-hidden="true"></i><i aria-hidden="true"></i><b aria-hidden="true">×</b>
          </div>
        </div>

        <nav class="app-tabs" aria-label="演示页面">
          <button
            v-for="tab in tabs"
            :key="tab.id"
            type="button"
            :class="{ active: activeTab === tab.id }"
            @click="selectTab(tab.id)"
          >{{ tab.label }}</button>
        </nav>

        <div class="app-workspace">
          <template v-if="activeTab === 'overview'">
            <div class="workspace-toolbar">
              <div><span>当前配置</span><button type="button">Remote Demo ▾</button></div>
              <p>运行 18 分钟 · Zero 0.0.16</p>
            </div>
            <div class="overview-grid">
              <article class="app-card core-card">
                <div class="card-heading"><span>Zero Core</span><em :class="{ green: serviceOn }">{{ serviceOn ? '运行正常' : '已停止' }}</em></div>
                <strong>{{ serviceOn ? '内核已就绪' : '服务未运行' }}</strong>
                <p>{{ serviceOn ? '控制通道与本地入口均可用' : '启动后才能接管系统流量' }}</p>
                <button type="button" class="app-button" @click="toggleService">{{ serviceOn ? '停止服务' : '启动服务' }}</button>
              </article>
              <article class="app-card">
                <div class="card-heading"><span>代理模式</span><em>当前：{{ mode }}</em></div>
                <div class="mode-buttons">
                  <button v-for="item in modes" :key="item" type="button" :class="{ active: mode === item }" @click="mode = item">{{ item }}</button>
                </div>
                <p>{{ mode === '规则' ? '按规则选择直连或代理' : mode === '全局' ? '所有匹配流量使用代理出口' : '流量直接连接目标' }}</p>
                <div class="policy-row"><span>Proxy</span><strong>{{ selectedNode }}</strong><span>切换 ›</span></div>
              </article>
              <article class="app-card capture-card">
                <div class="card-heading"><span>流量接管</span><em>{{ systemProxyOn || tunOn ? '已启用' : '未启用' }}</em></div>
                <button type="button" class="switch-row" @click="toggleCapture('proxy')"><span><b>系统代理</b><small>浏览器与桌面应用</small></span><i :class="{ on: systemProxyOn }"></i></button>
                <button type="button" class="switch-row" @click="toggleCapture('tun')"><span><b>TUN 模式</b><small>全局网络与 UDP</small></span><i :class="{ on: tunOn }"></i></button>
              </article>
            </div>
            <div class="network-strip">
              <span>网络出口</span><strong>203.0.113.42</strong><em>示例地址 · IPv4 正常</em><button type="button" @click="selectTab('debug')">检查 DNS ›</button>
            </div>
            <article class="app-card traffic-card">
              <div class="card-heading"><span>实时流量</span><em>上传 312 KB/s · 下载 4.8 MB/s</em></div>
              <svg viewBox="0 0 700 150" role="img" aria-label="演示流量趋势图">
                <defs><linearGradient id="traffic-fill" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#818cf8" stop-opacity=".36"/><stop offset="1" stop-color="#818cf8" stop-opacity="0"/></linearGradient></defs>
                <path d="M0 132 C55 126 70 92 120 101 S190 122 236 82 S310 38 354 73 S420 120 470 87 S535 33 582 55 S646 103 700 44 L700 150 L0 150 Z" fill="url(#traffic-fill)"/>
                <path d="M0 132 C55 126 70 92 120 101 S190 122 236 82 S310 38 354 73 S420 120 470 87 S535 33 582 55 S646 103 700 44" fill="none" stroke="#a5b4fc" stroke-width="3" stroke-linecap="round"/>
              </svg>
            </article>
          </template>

          <template v-else-if="activeTab === 'nodes'">
            <div class="workspace-toolbar">
              <div><strong>策略组</strong><span>Proxy · Selector</span></div>
              <button type="button" class="app-button" :disabled="probing" @click="runProbe">{{ probing ? '测速中…' : '全部测速' }}</button>
            </div>
            <div class="node-layout">
              <aside class="group-list"><button class="active" type="button"><span>Proxy</span><em>4</em></button><button type="button"><span>Auto</span><em>3</em></button><button type="button"><span>Fallback</span><em>2</em></button></aside>
              <div class="node-grid">
                <button v-for="node in nodes" :key="node.name" type="button" :disabled="!node.alive" :class="['node-card', { selected: selectedNode === node.name }]" @click="selectedNode = node.name; showNotice(`已切换到 ${node.name}`)">
                  <div><span class="region">{{ node.region }}</span><em :class="{ green: node.alive }">{{ node.alive ? `${node.latency} ms` : '不可用' }}</em></div>
                  <strong>{{ node.name }}</strong><small>{{ node.protocol }} · UDP {{ node.alive ? '可用' : '未知' }}</small>
                </button>
              </div>
            </div>
          </template>

          <template v-else-if="activeTab === 'profiles'">
            <div class="workspace-toolbar"><div><strong>代理配置</strong><span>3 份本地配置</span></div><button type="button" class="app-button" @click="showNotice('演示：打开新建配置窗口')">＋ 新建配置</button></div>
            <div class="list-card profile-list">
              <div><span class="file-mark">JSON</span><p><strong>Remote Demo</strong><small>订阅生成 · 当前配置</small></p><em class="green">使用中</em><button type="button">查看</button></div>
              <div><span class="file-mark">JSON</span><p><strong>Office Routing</strong><small>本地文件 · 2 小时前修改</small></p><em>可用</em><button type="button">启用</button></div>
              <div><span class="file-mark">JSON</span><p><strong>Minimal Direct</strong><small>手动创建 · 仅本地入口</small></p><em>可用</em><button type="button">启用</button></div>
            </div>
          </template>

          <template v-else-if="activeTab === 'subscriptions'">
            <div class="workspace-toolbar"><div><strong>订阅管理</strong><span>2 项 · 自动检测格式</span></div><button type="button" class="app-button" :disabled="syncing" @click="syncSubscriptions">{{ syncing ? '同步中…' : '↻ 同步全部' }}</button></div>
            <div class="subscription-grid">
              <article class="app-card subscription-card"><div class="card-heading"><span>Demo Zero</span><em class="green">已启用</em></div><code>https://example.net/sub/demo-zero</code><dl><div><dt>格式</dt><dd>自动检测</dd></div><div><dt>更新周期</dt><dd>6 小时</dd></div><div><dt>关联配置</dt><dd>Remote Demo</dd></div></dl><footer><span>{{ syncLabel }}</span><button type="button" @click="syncSubscriptions">立即同步</button></footer></article>
              <article class="app-card subscription-card"><div class="card-heading"><span>Demo Clash</span><em class="green">已启用</em></div><code>https://example.org/sub/demo-clash</code><dl><div><dt>格式</dt><dd>Clash</dd></div><div><dt>更新周期</dt><dd>24 小时</dd></div><div><dt>关联配置</dt><dd>自动创建</dd></div></dl><footer><span>今天 09:30</span><button type="button" @click="syncSubscriptions">立即同步</button></footer></article>
            </div>
            <div class="info-bar">订阅 URL 可能包含凭据。文档演示统一使用 example.net / example.org 保留域名。</div>
          </template>

          <template v-else-if="activeTab === 'rules'">
            <div class="workspace-toolbar"><div><strong>规则集</strong><span>4 项 · 72,418 条规则</span></div><button type="button" class="app-button" @click="showNotice('演示规则集已刷新')">↻ 更新全部</button></div>
            <div class="list-card rules-list">
              <div><span class="rule-icon">⌁</span><p><strong>Private Networks</strong><small>内置 · 18 条 · 优先级 0</small></p><em>Direct</em><span class="green">已就绪</span></div>
              <div><span class="rule-icon">◎</span><p><strong>Developer Services</strong><small>远程 · 2,430 条 · 6 小时更新</small></p><em>Proxy</em><span class="green">已就绪</span></div>
              <div><span class="rule-icon">▦</span><p><strong>Regional Domains</strong><small>远程 · 69,962 条 · 24 小时更新</small></p><em>Direct</em><span class="green">已就绪</span></div>
              <div><span class="rule-icon">＋</span><p><strong>Local Overrides</strong><small>本地 · 8 条 · 可视化编辑</small></p><em>Final</em><span class="green">已就绪</span></div>
            </div>
          </template>

          <template v-else-if="activeTab === 'connections'">
            <div class="workspace-toolbar"><div><strong>连接</strong><span>2 个活动 · 4 条演示记录</span></div><div class="filter-buttons"><button v-for="item in connectionFilters" :key="item" type="button" :class="{ active: connectionFilter === item }" @click="connectionFilter = item">{{ item }}</button></div></div>
            <div class="connection-table" role="table" aria-label="演示连接列表">
              <div class="table-head" role="row"><span>目标</span><span>路由</span><span>出站</span><span>流量</span><span>状态</span></div>
              <button v-for="item in visibleConnections" :key="item.target" type="button" class="table-row" role="row" @click="showNotice(`演示详情：${item.target}`)"><span><strong>{{ item.target }}</strong><small>{{ item.protocol }}</small></span><span>{{ item.route }}</span><span>{{ item.outbound }}</span><span>{{ item.traffic }}</span><em :class="{ green: item.state === '活动' }">{{ item.state }}</em></button>
            </div>
          </template>

          <template v-else-if="activeTab === 'logs'">
            <div class="workspace-toolbar"><div><strong>运行日志</strong><span>应用与内核 · 演示内容</span></div><div class="filter-buttons"><button type="button" class="active">全部</button><button type="button">警告</button><button type="button">错误</button></div></div>
            <div class="log-console"><p><time>10:32:18.542</time><em class="green">INFO</em><span>system proxy enabled on 127.0.0.1:7890</span></p><p><time>10:32:19.104</time><em>DEBUG</em><span>policy snapshot applied · group=Proxy selected={{ selectedNode }}</span></p><p><time>10:32:21.880</time><em class="green">INFO</em><span>dns query completed · host=docs.example.com latency=18ms</span></p><p><time>10:32:25.312</time><em class="warn">WARN</em><span>sample probe skipped · target=Offline Sample</span></p></div>
          </template>

          <template v-else-if="activeTab === 'settings'">
            <div class="settings-layout"><aside><strong>设置</strong><button type="button">应用</button><button type="button">网络</button><button type="button">版本管理</button><button type="button" class="active">域名解析</button><button type="button">流量接管</button><button type="button">高级配置</button></aside><div><div class="workspace-toolbar"><div><strong>域名解析</strong><span>选择解析模式、DNS 服务和分流规则</span></div><button type="button" class="app-button" @click="showNotice('演示设置已保存')">保存并应用</button></div><article class="app-card settings-card"><div class="card-heading"><span>基础模式</span><em>Fake-IP</em></div><div class="mode-buttons"><button type="button">关闭</button><button type="button">Real DNS</button><button type="button" class="active">Fake-IP</button></div><button type="button" class="switch-row"><span><b>DNS 劫持</b><small>让 TUN 统一处理普通 DNS 查询</small></span><i class="on"></i></button></article><article class="app-card dns-card"><div class="card-heading"><span>DNS 服务器</span><button type="button">＋ 新增</button></div><div><strong>Primary DoH</strong><code>https://dns.example/dns-query</code><em class="green">默认</em></div><div><strong>Bootstrap</strong><code>192.0.2.53:53</code><em>UDP</em></div></article></div></div>
          </template>

          <template v-else-if="activeTab === 'debug'">
            <div class="workspace-toolbar"><div><strong>诊断工具</strong><span>DNS、缓存、路由与控制通道</span></div><span class="diagnostic-state">{{ diagnosticResult }}</span></div>
            <div class="diagnostic-grid"><article class="app-card"><span class="diagnostic-icon">DNS</span><strong>DNS 查询</strong><p>检查解析链和响应地址族。</p><button type="button" class="app-button" @click="runDiagnostic('DNS 查询')">运行检查</button></article><article class="app-card"><span class="diagnostic-icon">IP</span><strong>路由追踪</strong><p>查看目标恢复与出口选择。</p><button type="button" class="app-button" @click="runDiagnostic('路由追踪')">运行检查</button></article><article class="app-card"><span class="diagnostic-icon">IPC</span><strong>控制通道</strong><p>确认请求、响应和事件流。</p><button type="button" class="app-button" @click="runDiagnostic('IPC 通道')">运行检查</button></article></div>
            <div class="debug-timeline"><p><span class="green">接收</span><strong>事件：stats.sampled</strong><time>10:32:31</time></p><p><span>发送</span><strong>查询：active_flows</strong><time>10:32:30</time></p><p><span class="green">接收</span><strong>响应 OK · 18 ms</strong><time>10:32:30</time></p></div>
          </template>
        </div>

        <div v-if="notice" class="app-toast" role="status">✓ {{ notice }}</div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.client-tour { --demo-bg:#0f1014; --demo-panel:#15171d; --demo-card:rgba(255,255,255,.045); --demo-border:rgba(255,255,255,.08); --demo-text:#e8e8f0; --demo-muted:#9293a7; --demo-primary:#f4f4f5; --demo-green:#4ade80; --demo-indigo:#818cf8; margin:32px auto 72px; color:var(--vp-c-text-1); font-size:14px; }
.tour-notice { display:flex; align-items:center; gap:9px; width:fit-content; margin:0 0 18px; border:1px solid color-mix(in srgb,var(--vp-c-brand-1) 24%,var(--vp-c-divider)); border-radius:999px; padding:7px 12px; color:var(--vp-c-text-2); background:var(--vp-c-brand-soft); font-size:13px; }
.tour-notice__dot { width:7px; height:7px; border-radius:50%; background:var(--vp-c-brand-1); box-shadow:0 0 0 4px color-mix(in srgb,var(--vp-c-brand-1) 14%,transparent); }
.tour-layout { display:grid; grid-template-columns:260px minmax(0,1fr); gap:18px; align-items:start; width:min(1180px,calc(100vw - 340px)); margin-left:50%; transform:translateX(-50%); }
.tour-guide { position:sticky; top:92px; border:1px solid var(--vp-c-divider); border-radius:16px; padding:20px; background:color-mix(in srgb,var(--vp-c-bg-elv) 94%,transparent); box-shadow:var(--zd-shadow-soft); }
.tour-guide__top>span { color:var(--vp-c-brand-1); font-size:12px; font-weight:800; letter-spacing:.05em; }
.tour-guide__top strong { display:block; margin:9px 0 8px; font-size:20px; line-height:1.35; }
.tour-guide__top p,.tour-guide__hint p { margin:0; color:var(--vp-c-text-2); font-size:14px; line-height:1.65; }
.tour-steps { display:grid; gap:3px; margin:18px 0; padding:14px 0; border-top:1px solid var(--vp-c-divider); border-bottom:1px solid var(--vp-c-divider); list-style:none; }
.tour-steps button { display:grid; grid-template-columns:26px 1fr; gap:7px; width:100%; border:0; border-radius:8px; padding:8px; color:var(--vp-c-text-2); background:transparent; text-align:left; font-size:13px; line-height:1.35; cursor:pointer; }
.tour-steps button span { color:var(--vp-c-text-3); font-variant-numeric:tabular-nums; }
.tour-steps button:hover,.tour-steps button.active { color:var(--vp-c-text-1); background:var(--vp-c-brand-soft); }
.tour-steps button.active span { color:var(--vp-c-brand-1); font-weight:800; }
.tour-guide__hint { border-left:3px solid var(--vp-c-brand-1); padding-left:12px; }
.tour-guide__hint>span { display:block; margin-bottom:3px; color:var(--vp-c-brand-1); font-size:11px; font-weight:800; }
.tour-guide__actions { display:flex; gap:8px; margin-top:18px; }
.tour-guide__actions button { flex:1; border:1px solid var(--vp-c-divider); border-radius:8px; padding:8px 10px; color:var(--vp-c-text-1); background:var(--vp-c-bg); cursor:pointer; }
.tour-guide__actions button.primary { border-color:var(--vp-c-brand-1); color:#fff; background:var(--vp-c-brand-1); }
.tour-guide__actions button:disabled { opacity:.4; cursor:not-allowed; }
.app-frame { position:relative; overflow:hidden; min-width:0; border:1px solid rgba(255,255,255,.09); border-radius:16px; color:var(--demo-text); background:var(--demo-bg); box-shadow:0 26px 80px rgba(3,8,18,.28); font-family:Inter,ui-sans-serif,-apple-system,BlinkMacSystemFont,"Segoe UI","PingFang SC",sans-serif; }
.app-titlebar { display:flex; align-items:center; justify-content:space-between; min-height:48px; padding:0 14px; border-bottom:1px solid var(--demo-border); background:rgba(15,16,20,.92); }
.app-identity,.app-window-actions,.workspace-toolbar,.workspace-toolbar>div,.card-heading,.app-segment,.mode-buttons,.filter-buttons { display:flex; align-items:center; }
.app-identity { gap:9px; min-width:0; }
.app-identity img { width:22px; height:22px; border-radius:4px; object-fit:cover; }
.app-identity strong { font-size:13px; white-space:nowrap; }
.app-identity>span { color:var(--demo-muted); font-size:11px; white-space:nowrap; }
.app-identity>i,.app-window-actions>i { display:block; width:1px; height:17px; margin:0 3px; background:var(--demo-border); }
.app-segment { gap:2px; border-radius:7px; padding:2px; background:rgba(255,255,255,.06); }
.app-segment button,.app-tabs button,.mode-buttons button,.filter-buttons button { border:0; color:var(--demo-muted); background:transparent; cursor:pointer; }
.app-segment button { border-radius:5px; padding:5px 10px; font-size:11px; }
.app-segment button.active,.mode-buttons button.active,.filter-buttons button.active { color:var(--demo-text); background:rgba(255,255,255,.11); box-shadow:0 1px 3px rgba(0,0,0,.35); }
.app-window-actions { gap:7px; color:var(--demo-muted); }
.app-window-actions .status { display:flex; align-items:center; gap:7px; border:1px solid var(--demo-border); border-radius:7px; padding:6px 10px; color:var(--demo-muted); background:transparent; font-size:11px; cursor:pointer; }
.app-window-actions .status span { width:7px; height:7px; border-radius:50%; background:#6b7280; }
.app-window-actions .status.online { color:var(--demo-green); }.app-window-actions .status.online span { background:var(--demo-green); box-shadow:0 0 0 3px rgba(74,222,128,.1); }
.app-window-actions>i { width:10px; height:1px; }.app-window-actions>b { font-size:17px; font-weight:400; }
.app-tabs { display:flex; justify-content:center; gap:2px; overflow-x:auto; padding:10px 12px 8px; border-bottom:1px solid var(--demo-border); scrollbar-width:none; }
.app-tabs button { flex:0 0 auto; border-radius:6px; padding:7px 11px; font-size:12px; }.app-tabs button:hover,.app-tabs button.active { color:var(--demo-text); background:rgba(255,255,255,.09); }
.app-workspace { min-height:560px; padding:18px; background:radial-gradient(circle at 78% 0,rgba(99,102,241,.05),transparent 31%),var(--demo-bg); }
.workspace-toolbar { justify-content:space-between; gap:14px; min-height:34px; margin-bottom:14px; }.workspace-toolbar>div { gap:10px; }.workspace-toolbar strong { font-size:14px; }.workspace-toolbar span,.workspace-toolbar p { margin:0; color:var(--demo-muted); font-size:11px; }.workspace-toolbar button:not(.app-button) { border:1px solid var(--demo-border); border-radius:6px; padding:6px 9px; color:var(--demo-text); background:var(--demo-card); }
.overview-grid { display:grid; grid-template-columns:repeat(3,minmax(0,1fr)); gap:10px; }.app-card { border:1px solid var(--demo-border); border-radius:10px; padding:13px; background:var(--demo-card); }.card-heading { justify-content:space-between; gap:8px; margin-bottom:12px; }.card-heading>span { color:var(--demo-muted); font-size:11px; }.card-heading em { color:var(--demo-muted); font-size:10px; font-style:normal; }.app-card>strong { display:block; font-size:14px; }.app-card>p { min-height:34px; margin:5px 0 10px; color:var(--demo-muted); font-size:11px; line-height:1.55; }
.green { color:var(--demo-green)!important; }.warn { color:#fbbf24!important; }.app-button { border:1px solid var(--demo-border); border-radius:6px; padding:6px 10px; color:var(--demo-text); background:rgba(255,255,255,.07); font-size:11px; cursor:pointer; }.app-button:hover { background:rgba(255,255,255,.12); }.app-button:disabled { opacity:.55; cursor:wait; }
.mode-buttons { gap:3px; border-radius:7px; padding:3px; background:rgba(255,255,255,.055); }.mode-buttons button { flex:1; border-radius:5px; padding:6px; font-size:11px; }.policy-row { display:grid; grid-template-columns:auto 1fr auto; gap:7px; padding-top:9px; border-top:1px solid var(--demo-border); font-size:10px; }.policy-row strong { overflow:hidden; text-overflow:ellipsis; white-space:nowrap; text-align:center; }.policy-row span { color:var(--demo-muted); }
.switch-row { display:flex; align-items:center; justify-content:space-between; width:100%; border:0; border-top:1px solid var(--demo-border); padding:9px 0; color:var(--demo-text); background:transparent; text-align:left; cursor:pointer; }.switch-row span { display:flex; flex-direction:column; }.switch-row b { font-size:11px; }.switch-row small { margin-top:2px; color:var(--demo-muted); font-size:9px; }.switch-row i { position:relative; width:28px; height:16px; border-radius:999px; background:#3f414b; }.switch-row i::after { position:absolute; top:2px; left:2px; width:12px; height:12px; border-radius:50%; background:white; content:""; transition:transform .16s ease; }.switch-row i.on { background:#22c55e; }.switch-row i.on::after { transform:translateX(12px); }
.network-strip { display:flex; align-items:center; gap:10px; margin:10px 0; border:1px solid var(--demo-border); border-radius:8px; padding:8px 12px; background:var(--demo-card); font-size:10px; }.network-strip>span,.network-strip>em { color:var(--demo-muted); font-style:normal; }.network-strip button { margin-left:auto; border:0; color:#a5b4fc; background:transparent; cursor:pointer; }.traffic-card { padding-bottom:5px; }.traffic-card svg { display:block; width:100%; height:170px; }
.node-layout { display:grid; grid-template-columns:150px 1fr; gap:12px; }.group-list { display:grid; align-content:start; gap:5px; }.group-list button { display:flex; justify-content:space-between; border:0; border-radius:7px; padding:9px 10px; color:var(--demo-muted); background:transparent; text-align:left; }.group-list button.active { color:var(--demo-text); background:rgba(255,255,255,.08); }.group-list em { font-size:10px; font-style:normal; }.node-grid { display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:10px; }.node-card { display:grid; gap:7px; border:1px solid var(--demo-border); border-radius:9px; padding:13px; color:var(--demo-text); background:var(--demo-card); text-align:left; cursor:pointer; }.node-card:hover,.node-card.selected { border-color:rgba(129,140,248,.65); background:rgba(129,140,248,.09); }.node-card:disabled { opacity:.48; cursor:not-allowed; }.node-card>div { display:flex; justify-content:space-between; }.node-card em { color:var(--demo-muted); font-size:10px; font-style:normal; }.node-card small { color:var(--demo-muted); font-size:10px; }.region { display:inline-grid; place-items:center; width:34px; height:20px; border-radius:5px; color:#c7d2fe; background:rgba(129,140,248,.14); font-size:9px; font-weight:800; }
.list-card { overflow:hidden; border:1px solid var(--demo-border); border-radius:10px; background:var(--demo-card); }.list-card>div { display:grid; align-items:center; gap:12px; padding:13px; border-bottom:1px solid var(--demo-border); }.list-card>div:last-child { border-bottom:0; }.profile-list>div { grid-template-columns:48px 1fr auto auto; }.list-card p { display:flex; flex-direction:column; margin:0; }.list-card small { margin-top:3px; color:var(--demo-muted); font-size:10px; }.list-card em { color:var(--demo-muted); font-size:10px; font-style:normal; }.list-card button { border:1px solid var(--demo-border); border-radius:6px; padding:5px 9px; color:var(--demo-text); background:transparent; font-size:10px; }.file-mark { display:grid; place-items:center; height:28px; border-radius:6px; color:#c7d2fe; background:rgba(129,140,248,.13); font-size:9px; font-weight:800; }
.subscription-grid { display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:10px; }.subscription-card code { display:block; overflow:hidden; margin-bottom:12px; color:#c7d2fe; font-size:10px; text-overflow:ellipsis; white-space:nowrap; }.subscription-card dl { display:grid; gap:7px; margin:0; }.subscription-card dl div { display:flex; justify-content:space-between; }.subscription-card dt,.subscription-card dd { margin:0; color:var(--demo-muted); font-size:10px; }.subscription-card dd { color:var(--demo-text); }.subscription-card footer { display:flex; justify-content:space-between; align-items:center; margin-top:13px; padding-top:10px; border-top:1px solid var(--demo-border); color:var(--demo-muted); font-size:10px; }.subscription-card footer button { border:0; color:#a5b4fc; background:transparent; cursor:pointer; }.info-bar { margin-top:11px; border:1px solid rgba(251,191,36,.16); border-radius:8px; padding:9px 11px; color:#d6bd78; background:rgba(251,191,36,.05); font-size:10px; }
.rules-list>div { grid-template-columns:34px 1fr 70px 60px; }.rule-icon,.diagnostic-icon { display:grid; place-items:center; height:30px; border-radius:7px; color:#c7d2fe; background:rgba(129,140,248,.12); font-size:11px; font-weight:800; }
.filter-buttons { gap:3px; border-radius:7px; padding:3px; background:rgba(255,255,255,.055); }.filter-buttons button { border-radius:5px; padding:5px 9px; font-size:10px; }.connection-table { overflow:auto; border:1px solid var(--demo-border); border-radius:10px; }.table-head,.table-row { display:grid; grid-template-columns:1.6fr 1.15fr 1fr .65fr .55fr; gap:10px; align-items:center; min-width:650px; padding:10px 12px; }.table-head { color:var(--demo-muted); background:rgba(255,255,255,.035); font-size:9px; }.table-row { width:100%; border:0; border-top:1px solid var(--demo-border); color:var(--demo-text); background:transparent; text-align:left; font-size:10px; cursor:pointer; }.table-row:hover { background:rgba(255,255,255,.035); }.table-row>span:first-child { display:flex; flex-direction:column; }.table-row small { color:var(--demo-muted); }.table-row em { color:var(--demo-muted); font-style:normal; }
.log-console { overflow:hidden; border:1px solid var(--demo-border); border-radius:10px; background:#0b0c10; font-family:ui-monospace,SFMono-Regular,Menlo,monospace; }.log-console p { display:grid; grid-template-columns:90px 52px 1fr; gap:10px; margin:0; padding:11px 13px; border-bottom:1px solid rgba(255,255,255,.05); font-size:10px; }.log-console time { color:#686a78; }.log-console em { color:#9ca3af; font-style:normal; }.log-console span { overflow-wrap:anywhere; }
.settings-layout { display:grid; grid-template-columns:150px 1fr; gap:16px; }.settings-layout>aside { display:grid; align-content:start; gap:4px; border-right:1px solid var(--demo-border); padding-right:12px; }.settings-layout>aside strong { margin:4px 8px 10px; font-size:12px; }.settings-layout>aside button { border:0; border-radius:6px; padding:8px; color:var(--demo-muted); background:transparent; text-align:left; font-size:10px; }.settings-layout>aside button.active { color:var(--demo-text); background:rgba(255,255,255,.08); }.settings-card { margin-bottom:10px; }.dns-card>div:not(.card-heading) { display:grid; grid-template-columns:110px 1fr auto; gap:10px; padding:10px 0; border-top:1px solid var(--demo-border); font-size:10px; }.dns-card code { color:var(--demo-muted); }.dns-card em { font-style:normal; }.card-heading button { border:0; color:#a5b4fc; background:transparent; font-size:10px; }
.diagnostic-state { border-radius:999px; padding:5px 9px; background:rgba(74,222,128,.08); }.diagnostic-grid { display:grid; grid-template-columns:repeat(3,minmax(0,1fr)); gap:10px; }.diagnostic-grid .diagnostic-icon { width:42px; margin-bottom:12px; }.debug-timeline { margin-top:12px; border:1px solid var(--demo-border); border-radius:10px; }.debug-timeline p { display:grid; grid-template-columns:55px 1fr auto; gap:10px; margin:0; padding:10px 12px; border-bottom:1px solid var(--demo-border); font-size:10px; }.debug-timeline p:last-child { border-bottom:0; }.debug-timeline span,.debug-timeline time { color:var(--demo-muted); }
.app-toast { position:absolute; right:18px; bottom:18px; border:1px solid rgba(74,222,128,.25); border-radius:8px; padding:9px 12px; color:#bbf7d0; background:rgba(20,42,29,.96); box-shadow:0 12px 32px rgba(0,0,0,.32); font-size:11px; }
button:focus-visible { outline:2px solid var(--demo-indigo); outline-offset:2px; }
@media (max-width:1100px) { .tour-layout { width:min(900px,calc(100vw - 300px)); grid-template-columns:1fr; transform:translateX(-50%); }.tour-guide { position:static; }.tour-steps { grid-template-columns:repeat(3,minmax(0,1fr)); }.tour-guide__actions { max-width:280px; } }
@media (max-width:960px) { .tour-layout { width:100%; margin-left:0; transform:none; }.overview-grid,.diagnostic-grid { grid-template-columns:1fr 1fr; }.capture-card { grid-column:1/-1; } }
@media (max-width:700px) { .client-tour { margin-top:22px; }.tour-notice { border-radius:10px; }.tour-steps { grid-template-columns:1fr 1fr; }.app-titlebar { padding:0 10px; }.app-identity>span,.app-identity>i,.app-window-actions>i,.app-window-actions>b { display:none; }.app-workspace { min-height:620px; padding:12px; }.overview-grid,.subscription-grid,.diagnostic-grid { grid-template-columns:1fr; }.capture-card { grid-column:auto; }.node-layout,.settings-layout { grid-template-columns:1fr; }.group-list { grid-template-columns:repeat(3,1fr); }.settings-layout>aside { grid-template-columns:repeat(3,1fr); border-right:0; border-bottom:1px solid var(--demo-border); padding:0 0 10px; }.settings-layout>aside strong { grid-column:1/-1; }.traffic-card svg { height:120px; }.network-strip { flex-wrap:wrap; }.network-strip button { margin-left:0; }.log-console p { grid-template-columns:1fr; gap:4px; }.tour-guide__actions { max-width:none; } }
@media (max-width:480px) { .tour-steps { grid-template-columns:1fr; }.app-segment { display:none; }.app-tabs { justify-content:flex-start; }.node-grid { grid-template-columns:1fr; }.profile-list>div { grid-template-columns:40px 1fr auto; }.profile-list button { grid-column:2/-1; }.rules-list>div { grid-template-columns:30px 1fr auto; }.rules-list>div>em { display:none; }.dns-card>div:not(.card-heading) { grid-template-columns:1fr; }.app-workspace { min-height:700px; } }
</style>
