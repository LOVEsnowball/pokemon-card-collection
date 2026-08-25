<script setup>
import { useAppStore } from '../store/useAppStore.js'

const app = useAppStore()
const s = app.state
</script>

<template>
  <div class="tab-bar">
    <button class="tab-btn" :class="{ active: s.currentTab === 'home' }" @click="app.switchTab('home')">
      <svg viewBox="0 0 24 24"><path d="M12 3 2 12h3v8h6v-6h2v6h6v-8h3z"/></svg>
      <span>首页</span>
    </button>
    <button class="tab-btn" :class="{ active: s.currentTab === 'mine' }" @click="app.switchTab('mine')">
      <svg viewBox="0 0 24 24"><path d="M12 12a4.5 4.5 0 1 0 0-9 4.5 4.5 0 0 0 0 9zm0 2.5c-4.42 0-8 2.24-8 5V21a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-1.5c0-2.76-3.58-5-8-5z"/></svg>
      <span>我的</span>
    </button>
  </div>
</template>