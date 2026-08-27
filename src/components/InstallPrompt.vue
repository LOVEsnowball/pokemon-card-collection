<script setup>
import { ref, onMounted } from 'vue'

// 打开网页时提示「生成桌面端」。桌面/Android Chrome 走 beforeinstallprompt → prompt() 原生安装；
// iOS Safari 无该事件，改为展示「添加到主屏幕」指引。
const DISMISSED_KEY = 'pk_install_dismissed'
const DAY_MS = 24 * 60 * 60 * 1000

const visible = ref(false)
const iosGuide = ref(false)
let deferredPrompt = null

function detectIOS() {
  const ua = navigator.userAgent
  const isIOS = /iPad|iPhone|iPod/.test(ua)
  const standalone = window.navigator.standalone === true || window.matchMedia('(display-mode: standalone)').matches
  return isIOS && !standalone
}
function shouldShow() {
  try {
    const d = localStorage.getItem(DISMISSED_KEY)
    return !d || Date.now() - Number(d) > DAY_MS
  } catch (e) { return true }
}
function dismiss() {
  try { localStorage.setItem(DISMISSED_KEY, String(Date.now())) } catch (e) { /* ignore */ }
}

function onBeforeInstall(e) {
  e.preventDefault()
  deferredPrompt = e
  if (shouldShow()) visible.value = true
}

onMounted(() => {
  if (window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone) return
  window.addEventListener('beforeinstallprompt', onBeforeInstall)
  // iOS 无 beforeinstallprompt，直接检测并展示
  if (detectIOS() && shouldShow()) visible.value = true
})

async function install() {
  if (!deferredPrompt) return
  await deferredPrompt.prompt()
  deferredPrompt = null
  dismiss()
  visible.value = false
}
function close() {
  dismiss()
  visible.value = false
  iosGuide.value = false
}
</script>

<template>
  <transition name="inst">
    <div v-if="visible" class="inst-card">
      <button class="inst-close" @click="close">×</button>
      <div v-if="!iosGuide" class="inst-body">
        <div class="inst-title">生成桌面端</div>
        <div class="inst-desc">安装为桌面应用，启动更快、随时取用</div>
        <div class="inst-actions">
          <button v-if="deferredPrompt" class="inst-btn" @click="install">一键生成</button>
          <button v-else class="inst-btn" @click="iosGuide = true">查看安装说明</button>
        </div>
      </div>
      <div v-else class="inst-body">
        <div class="inst-title">添加到主屏幕</div>
        <ol class="inst-steps">
          <li>点底部 <b>分享</b> 按钮</li>
          <li>选择 <b>添加到主屏幕</b></li>
          <li>点右上角 <b>添加</b> 即可</li>
        </ol>
      </div>
    </div>
  </transition>
</template>

<style scoped>
.inst-card{
  position:fixed;left:14px;right:14px;bottom:76px;z-index:140;
  background:var(--card-bg);border:1px solid var(--border);border-radius:16px;
  box-shadow:0 8px 30px rgba(0,0,0,.45);padding:16px;position:relative;
}
.inst-close{
  position:absolute;top:8px;right:10px;background:none;border:none;
  color:var(--text-dim);font-size:20px;line-height:1;cursor:pointer;
}
.inst-title{font-size:16px;font-weight:700;margin-bottom:4px;padding-right:24px}
.inst-desc{font-size:13px;color:var(--text-dim);margin-bottom:12px}
.inst-actions{display:flex;gap:10px}
.inst-btn{
  flex:1;padding:11px;border:none;border-radius:12px;
  background:var(--accent);color:#fff;font-size:14px;font-weight:600;cursor:pointer;
}
.inst-steps{margin:6px 0 0;padding-left:20px;font-size:13px;color:var(--text);line-height:1.9}
.inst-steps b{color:var(--accent)}
.inst-enter-active,.inst-leave-active{transition:opacity .25s,transform .25s}
.inst-enter-from,.inst-leave-to{opacity:0;transform:translateY(16px)}
</style>