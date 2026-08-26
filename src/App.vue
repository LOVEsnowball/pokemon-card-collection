<script setup>
import { onMounted, onUnmounted, nextTick, watch } from 'vue'
import { useAppStore } from './store/useAppStore.js'
import HeaderBar from './components/HeaderBar.vue'
import IllustratorView from './components/IllustratorView.vue'
import CardView from './components/CardView.vue'
import MinePage from './components/MinePage.vue'
import CollectionList from './components/CollectionList.vue'
import AuthModal from './components/AuthModal.vue'
import CardModal from './components/CardModal.vue'
import TabBar from './components/TabBar.vue'

const app = useAppStore()
const s = app.state

// 吸顶偏移：动态跟随标题栏高度
function measureHeader() {
  const h = document.querySelector('.header')
  if (!h) return
  document.documentElement.style.setProperty('--sticky-top', h.offsetHeight + 'px')
}
let ro = null
onMounted(() => {
  app.initSession()
  app.loadIllustrators()
  nextTick(measureHeader)
  if (window.ResizeObserver) {
    ro = new ResizeObserver(measureHeader)
    if (document.querySelector('.header')) ro.observe(document.querySelector('.header'))
  }
  window.addEventListener('resize', measureHeader)
  window.addEventListener('orientationchange', () => setTimeout(measureHeader, 120))
})
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
  <div>
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

    <AuthModal />
    <CardModal v-if="s.cardModalCard" />

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