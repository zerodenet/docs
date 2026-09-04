<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'

type Platform = 'windows' | 'macos' | 'linux' | 'other'
type Architecture = 'x64' | 'arm64' | 'unknown'

interface ReleaseAsset {
  name: string
  browser_download_url: string
  size: number
}

interface ReleaseData {
  tag_name: string
  html_url: string
  published_at: string
  assets: ReleaseAsset[]
}

interface DownloadOption {
  platform: Exclude<Platform, 'other'>
  architecture: Exclude<Architecture, 'unknown'>
  format: string
  label: string
  asset: ReleaseAsset
}

const RELEASE_API = 'https://api.github.com/repos/zerodenet/znet-sink/releases/latest'
const RELEASES_URL = 'https://github.com/zerodenet/znet-sink/releases/latest'
const CACHE_KEY = 'zerodenet:znet-sink:latest-release'
const CACHE_TTL = 6 * 60 * 60 * 1000

const platform = ref<Platform>('other')
const architecture = ref<Architecture>('unknown')
const activePlatform = ref<Exclude<Platform, 'other'>>('windows')
const release = ref<ReleaseData | null>(null)
const loading = ref(true)
const loadFailed = ref(false)

const platformLabels: Record<Platform, string> = {
  windows: 'Windows',
  macos: 'macOS',
  linux: 'Linux',
  other: '当前设备',
}

function detectPlatform(): Platform {
  const value = `${navigator.userAgent} ${navigator.platform}`.toLowerCase()
  if (/iphone|ipad|android/.test(value)) return 'other'
  if (/windows|win32|win64/.test(value)) return 'windows'
  if (/macintosh|mac os|macintel/.test(value)) return 'macos'
  if (/linux|x11/.test(value)) return 'linux'
  return 'other'
}

async function detectArchitecture(): Promise<Architecture> {
  const nav = navigator as Navigator & {
    userAgentData?: {
      getHighEntropyValues?: (hints: string[]) => Promise<{ architecture?: string; bitness?: string }>
    }
  }

  try {
    const values = await nav.userAgentData?.getHighEntropyValues?.(['architecture', 'bitness'])
    const value = `${values?.architecture ?? ''} ${values?.bitness ?? ''}`.toLowerCase()
    if (/arm|aarch64/.test(value)) return 'arm64'
    if (/x86|x64|amd64/.test(value)) return 'x64'
  } catch {
    // Privacy-conscious browsers may withhold architecture. The page keeps both choices visible.
  }

  const fallback = navigator.userAgent.toLowerCase()
  if (/arm64|aarch64/.test(fallback)) return 'arm64'
  if (/x86_64|win64|x64|amd64/.test(fallback)) return 'x64'
  return 'unknown'
}

function classifyAsset(asset: ReleaseAsset): DownloadOption | null {
  const name = asset.name
  const lower = name.toLowerCase()
  if (lower.endsWith('.sig') || lower.endsWith('.zip') || lower.endsWith('.tar.gz')) return null

  if (lower.endsWith('-setup.exe')) {
    return { platform: 'windows', architecture: 'x64', format: 'EXE', label: 'Windows 安装程序', asset }
  }
  if (lower.endsWith('.msi')) {
    return { platform: 'windows', architecture: 'x64', format: 'MSI', label: 'Windows MSI', asset }
  }
  if (lower.endsWith('.dmg')) {
    const assetArchitecture = /aarch64|arm64/.test(lower) ? 'arm64' : 'x64'
    return {
      platform: 'macos',
      architecture: assetArchitecture,
      format: 'DMG',
      label: assetArchitecture === 'arm64' ? 'macOS · Apple 芯片' : 'macOS · Intel',
      asset,
    }
  }
  if (lower.endsWith('.appimage')) {
    return { platform: 'linux', architecture: 'x64', format: 'AppImage', label: 'Linux AppImage', asset }
  }
  if (lower.endsWith('.deb')) {
    return { platform: 'linux', architecture: 'x64', format: 'DEB', label: 'Debian / Ubuntu', asset }
  }
  if (lower.endsWith('.rpm')) {
    return { platform: 'linux', architecture: 'x64', format: 'RPM', label: 'Fedora / RHEL', asset }
  }
  return null
}

function readCachedRelease(): ReleaseData | null {
  try {
    const cached = JSON.parse(sessionStorage.getItem(CACHE_KEY) ?? 'null')
    if (cached && Date.now() - cached.savedAt < CACHE_TTL) return cached.release
  } catch {
    // Ignore storage restrictions and request the release normally.
  }
  return null
}

function cacheRelease(value: ReleaseData) {
  try {
    sessionStorage.setItem(CACHE_KEY, JSON.stringify({ savedAt: Date.now(), release: value }))
  } catch {
    // The download page works without browser storage.
  }
}

async function loadRelease() {
  const cached = readCachedRelease()
  if (cached) {
    release.value = cached
    loading.value = false
    return
  }

  try {
    const response = await fetch(RELEASE_API, { headers: { Accept: 'application/vnd.github+json' } })
    if (!response.ok) throw new Error(`GitHub API returned ${response.status}`)
    const value = await response.json() as ReleaseData
    release.value = value
    cacheRelease(value)
  } catch {
    loadFailed.value = true
  } finally {
    loading.value = false
  }
}

const options = computed(() => (
  release.value?.assets.map(classifyAsset).filter((item): item is DownloadOption => item !== null) ?? []
))

const activeOptions = computed(() => options.value.filter((item) => item.platform === activePlatform.value))

const recommended = computed(() => {
  const candidates = options.value.filter((item) => item.platform === platform.value)
  if (candidates.length === 0) return null
  if (platform.value === 'windows') return candidates.find((item) => item.format === 'EXE') ?? candidates[0]
  if (platform.value === 'linux') return candidates.find((item) => item.format === 'AppImage') ?? candidates[0]
  if (platform.value === 'macos' && architecture.value !== 'unknown') {
    return candidates.find((item) => item.architecture === architecture.value) ?? null
  }
  return null
})

const releaseDate = computed(() => {
  if (!release.value?.published_at) return ''
  return new Intl.DateTimeFormat('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' })
    .format(new Date(release.value.published_at))
})

function formatBytes(bytes: number) {
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}

onMounted(async () => {
  platform.value = detectPlatform()
  architecture.value = await detectArchitecture()
  if (platform.value !== 'other') activePlatform.value = platform.value
  await loadRelease()
})
</script>

<template>
  <section class="download-chooser" aria-labelledby="download-chooser-title">
    <div class="download-chooser__intro">
      <p class="download-chooser__eyebrow">SMART DOWNLOAD</p>
      <h2 id="download-chooser-title">为你的设备准备好安装包</h2>
      <p>页面只判断设备平台与浏览器可提供的架构信息；无法可靠识别时，会把可选安装包全部列出。</p>
    </div>

    <div v-if="loading" class="download-chooser__status" role="status">
      <span class="download-chooser__spinner" aria-hidden="true"></span>
      正在读取最新稳定版…
    </div>

    <div v-else-if="loadFailed" class="download-chooser__status download-chooser__status--error">
      <strong>暂时无法读取安装包列表</strong>
      <span>可以前往 GitHub Releases 继续下载。</span>
      <a :href="RELEASES_URL" target="_blank" rel="noreferrer">打开发布页 <span aria-hidden="true">↗</span></a>
    </div>

    <template v-else-if="release">
      <div class="download-chooser__release">
        <span>最新稳定版 {{ release.tag_name }}</span>
        <span>{{ releaseDate }}</span>
      </div>

      <div v-if="recommended" class="download-chooser__recommendation">
        <div>
          <span class="download-chooser__detected">已识别 {{ platformLabels[platform] }}</span>
          <strong>{{ recommended.label }}</strong>
          <small>{{ recommended.format }} · {{ recommended.architecture === 'arm64' ? 'ARM64' : 'x86-64' }} · {{ formatBytes(recommended.asset.size) }}</small>
        </div>
        <a :href="recommended.asset.browser_download_url">立即下载</a>
      </div>

      <div v-else-if="platform === 'macos'" class="download-chooser__hint">
        <strong>已识别 macOS</strong>
        <span>浏览器没有提供芯片信息，请在下方选择 Apple 芯片或 Intel。</span>
      </div>

      <div v-else-if="platform === 'other'" class="download-chooser__hint">
        <strong>这是桌面客户端</strong>
        <span>请在 Windows、macOS 或 Linux 电脑上打开本页，或从下方手动选择。</span>
      </div>

      <div class="download-chooser__all">
        <div class="download-chooser__tabs" role="tablist" aria-label="选择操作系统">
          <button
            v-for="item in (['windows', 'macos', 'linux'] as const)"
            :id="`download-tab-${item}`"
            :key="item"
            type="button"
            role="tab"
            :aria-selected="activePlatform === item"
            :aria-controls="`download-panel-${item}`"
            :class="{ active: activePlatform === item }"
            @click="activePlatform = item"
          >{{ platformLabels[item] }}</button>
        </div>

        <div
          :id="`download-panel-${activePlatform}`"
          class="download-chooser__options"
          role="tabpanel"
          :aria-labelledby="`download-tab-${activePlatform}`"
        >
          <a
            v-for="item in activeOptions"
            :key="item.asset.name"
            :href="item.asset.browser_download_url"
            class="download-option"
          >
            <span class="download-option__format">{{ item.format }}</span>
            <span class="download-option__copy">
              <strong>{{ item.label }}</strong>
              <small>{{ item.architecture === 'arm64' ? 'ARM64' : 'x86-64' }} · {{ formatBytes(item.asset.size) }}</small>
            </span>
            <span class="download-option__arrow" aria-hidden="true">↓</span>
          </a>
        </div>
      </div>

      <p class="download-chooser__footer">
        安装包由 ZeroDeNet 的 GitHub Releases 提供。
        <a :href="release.html_url" target="_blank" rel="noreferrer">查看发布说明 <span aria-hidden="true">↗</span></a>
      </p>
    </template>
  </section>
</template>

<style scoped>
.download-chooser { overflow: hidden; margin: 34px 0 48px; border: 1px solid var(--vp-c-divider); border-radius: 24px; background: var(--vp-c-bg-elv); box-shadow: var(--zd-shadow-soft); }
.download-chooser__intro { padding: clamp(28px, 5vw, 52px); background: radial-gradient(circle at 92% 0, color-mix(in srgb, var(--zd-accent-cyan) 18%, transparent), transparent 34%), linear-gradient(135deg, color-mix(in srgb, var(--vp-c-brand-soft) 72%, var(--vp-c-bg-elv)), var(--vp-c-bg-elv) 72%); }
.download-chooser__eyebrow { margin: 0 0 12px; color: var(--vp-c-brand-1); font-size: .72rem; font-weight: 800; letter-spacing: .15em; }
.download-chooser__intro h2 { margin: 0; border: 0; padding: 0; font-size: clamp(1.65rem, 4vw, 2.45rem); letter-spacing: -.045em; }
.download-chooser__intro > p:last-child { max-width: 650px; margin: 14px 0 0; color: var(--vp-c-text-2); font-size: 1rem; line-height: 1.7; }
.download-chooser__status { display: flex; align-items: center; gap: 12px; min-height: 150px; padding: 32px 52px; color: var(--vp-c-text-2); }
.download-chooser__status--error { align-items: flex-start; flex-direction: column; }
.download-chooser__status--error strong { color: var(--vp-c-text-1); }
.download-chooser__spinner { width: 20px; height: 20px; border: 2px solid var(--vp-c-divider); border-top-color: var(--vp-c-brand-1); border-radius: 50%; animation: spin .8s linear infinite; }
.download-chooser__release { display: flex; justify-content: space-between; gap: 20px; border-top: 1px solid var(--vp-c-divider); border-bottom: 1px solid var(--vp-c-divider); padding: 12px clamp(24px, 5vw, 52px); color: var(--vp-c-text-3); font-size: .78rem; font-weight: 650; }
.download-chooser__recommendation { display: flex; align-items: center; justify-content: space-between; gap: 28px; margin: clamp(24px, 5vw, 48px); border: 1px solid color-mix(in srgb, var(--vp-c-brand-1) 26%, var(--vp-c-divider)); border-radius: 17px; padding: 22px 24px; background: color-mix(in srgb, var(--vp-c-brand-soft) 58%, var(--vp-c-bg-elv)); }
.download-chooser__recommendation > div { display: grid; gap: 4px; }
.download-chooser__detected { color: var(--vp-c-brand-1); font-size: .74rem; font-weight: 800; letter-spacing: .04em; }
.download-chooser__recommendation strong { font-size: 1.2rem; }
.download-chooser__recommendation small, .download-option small { color: var(--vp-c-text-2); font-size: .78rem; }
.download-chooser__recommendation > a { display: inline-flex; align-items: center; justify-content: center; min-width: 132px; min-height: 46px; border-radius: 11px; color: #fff; background: var(--vp-c-brand-1); font-weight: 750; text-decoration: none; box-shadow: 0 12px 26px color-mix(in srgb, var(--vp-c-brand-1) 24%, transparent); }
.download-chooser__hint { display: grid; gap: 5px; margin: clamp(24px, 5vw, 48px); border-left: 3px solid var(--vp-c-brand-1); padding: 7px 0 7px 18px; }
.download-chooser__hint span { color: var(--vp-c-text-2); font-size: .9rem; }
.download-chooser__all { padding: 0 clamp(24px, 5vw, 52px) 36px; }
.download-chooser__tabs { display: flex; gap: 5px; width: fit-content; margin-bottom: 18px; border-radius: 12px; padding: 4px; background: var(--vp-c-bg-alt); }
.download-chooser__tabs button { min-height: 38px; border: 0; border-radius: 9px; padding: 0 16px; color: var(--vp-c-text-2); background: transparent; cursor: pointer; font: inherit; font-size: .85rem; font-weight: 700; }
.download-chooser__tabs button.active { color: var(--vp-c-text-1); background: var(--vp-c-bg-elv); box-shadow: 0 5px 16px rgba(22, 48, 82, .08); }
.download-chooser__tabs button:focus-visible { outline: 2px solid var(--vp-c-brand-1); outline-offset: 2px; }
.download-chooser__options { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px; }
.download-option { display: grid; grid-template-columns: 50px minmax(0, 1fr) auto; align-items: center; gap: 14px; min-height: 76px; border: 1px solid var(--vp-c-divider); border-radius: 13px; padding: 12px 16px; color: var(--vp-c-text-1); text-decoration: none; transition: border-color .18s ease, transform .18s ease, background-color .18s ease; }
.download-option:hover { border-color: color-mix(in srgb, var(--vp-c-brand-1) 38%, var(--vp-c-divider)); background: var(--zd-row-hover); transform: translateY(-2px); text-decoration: none; }
.download-option__format { display: inline-flex; align-items: center; justify-content: center; width: 50px; height: 34px; border-radius: 8px; color: var(--vp-c-brand-1); background: var(--vp-c-brand-soft); font-size: .68rem; font-weight: 850; letter-spacing: .04em; }
.download-option__copy { display: grid; min-width: 0; gap: 3px; }
.download-option__copy strong { overflow: hidden; font-size: .91rem; text-overflow: ellipsis; white-space: nowrap; }
.download-option__arrow { color: var(--vp-c-text-3); font-size: 1.15rem; }
.download-chooser__footer { margin: 0; border-top: 1px solid var(--vp-c-divider); padding: 16px clamp(24px, 5vw, 52px); color: var(--vp-c-text-3); font-size: .78rem; }
@keyframes spin { to { transform: rotate(360deg); } }
@media (max-width: 680px) {
  .download-chooser { border-radius: 18px; }
  .download-chooser__recommendation { align-items: stretch; flex-direction: column; }
  .download-chooser__recommendation > a { width: 100%; }
  .download-chooser__options { grid-template-columns: minmax(0, 1fr); }
  .download-chooser__release { align-items: flex-start; flex-direction: column; gap: 3px; }
  .download-chooser__tabs { width: 100%; }
  .download-chooser__tabs button { flex: 1; padding-inline: 8px; }
}
@media (prefers-reduced-motion: reduce) {
  .download-chooser__spinner { animation: none; }
  .download-option { transition: none; }
}
</style>
