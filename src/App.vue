<script setup>
import { computed, onMounted, onUnmounted, nextTick, watch, defineAsyncComponent, h } from 'vue'
import { useAppStore } from './store/useAppStore.js'
import HeaderBar from './components/HeaderBar.vue'
import IllustratorView from './components/IllustratorView.vue'
import AuthModal from './components/AuthModal.vue'
import TabBar from './components/TabBar.vue'
import BackToTop from './components/BackToTop.vue'
import InstallPrompt from './components/InstallPrompt.vue'

// 非首屏组件异步分包，降低初始 JS 体积
const spinner = { render: () => h('div', { class: 'async-loading' }, [h('div', { class: 'spinner' })]) }
const asyncComp = (loader) => defineAsyncComponent({ loader, loadingComponent: spinner, delay: 150 })

const CardView = asyncComp(() => import('./components/CardView.vue'))
const MinePage = asyncComp(() => import('./components/MinePage.vue'))
const CollectionList = asyncComp(() => import('./components/CollectionList.vue'))
const CardModal = asyncComp(() => import('./components/CardModal.vue'))
const BackgroundModal = asyncComp(() => import('./components/BackgroundModal.vue'))

const app = useAppStore()
const s = app.state

const rootStyle = computed(() => {
  const style = {}
  if (s.accent) style['--accent'] = s.accent
  return style
})

// 吸顶偏移：动态跟随标题栏高度
function measureHeader() {
  const h = document.querySelector('.header')
  if (!h) return
  const hh = h.offsetHeight
  // 忽略无效/偏小的高度，避免把吸顶偏移写成 0 而让搜索栏被顶栏覆盖
  if (!hh || hh < 1) return
  document.documentElement.style.setProperty('--sticky-top', hh + 'px')
}
let ro = null
onMounted(() => {
  app.initSession()
  app.loadIllustrators()
  nextTick(() => requestAnimationFrame(measureHeader))
  if (window.ResizeObserver) {
    ro = new ResizeObserver(measureHeader)
    if (document.querySelector('.header')) ro.observe(document.querySelector('.header'))
  }
  window.addEventListener('resize', measureHeader)
  window.addEventListener('orientationchange', () => setTimeout(measureHeader, 120))
})
// 回到首页/卡牌列表等顶栏重挂载后再重新校准吸顶偏移
watch(
  () => [s.currentTab, s.collectionOpen, s.currentIllustrator],
  () => nextTick(() => requestAnimationFrame(measureHeader))
)
onUnmounted(() => {
  if (ro) ro.disconnect()
  window.removeEventListener('resize', measureHeader)
})

// toast 自动消失
let toastTimer = null
watch(() => s.toast, (val) => {
  clearTimeout(toastTimer)
  if (val) toastTimer = setTimeout(() => { app.showToast('') }, 2000)
})
</script>

<template>
  <div class="app-root" :style="rootStyle">
    <!-- 首页 / 卡牌视图 -->
    <HeaderBar v-if="s.currentTab === 'home' && !s.collectionOpen" />
    <div v-if="s.currentTab === 'home' && !s.collectionOpen">
      <IllustratorView v-if="!s.currentIllustrator" />
      <CardView v-else />
    </div>

    <!-- 收藏列表页（独立视图） -->
    <CollectionList v-if="s.collectionOpen" />

    <!-- 我的 -->
    <MinePage v-if="s.currentTab === 'mine' && !s.collectionOpen" />

    <TabBar />

    <!-- 长列表滚动时回到顶部 -->
    <BackToTop />

    <!-- 打开时提示生成桌面端（PWA 安装引导） -->
    <InstallPrompt />

    <AuthModal />
    <CardModal v-if="s.cardModalCard" />
    <BackgroundModal v-if="s.bgOpen" />

    <!-- 全屏 loading -->
    <div v-if="s.loading" class="loading-overlay"><div class="spinner"></div></div>

    <!-- Lightbox -->
    <div v-if="s.lightboxUrl" class="lightbox" @click="app.closeLightbox">
      <img :src="s.lightboxUrl" alt="大图">
    </div>

    <!-- Toast -->
    <div v-if="s.toast" class="toast">{{ s.toast }}</div>
  </div>
</template>