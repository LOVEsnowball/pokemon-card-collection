<script setup>
import { computed } from 'vue'
import { useAppStore } from '../store/useAppStore.js'

const app = useAppStore()
const s = app.state

const isCardView = computed(() => !!s.currentIllustrator)
const title = computed(() => (s.currentIllustrator ? s.currentIllustrator.name : '画师'))

const stats = computed(() => {
  const total = s.allCards.length
  const collected = s.allCards.filter(c => s.collection[c.id]).length
  const pct = total > 0 ? Math.round((collected / total) * 100) : 0
  return { total, collected, remaining: total - collected, pct }
})

function onLogout() {
  app.logout()
}
</script>

<template>
  <header class="header">
    <div class="header-top">
      <button v-if="isCardView" class="header-back" @click="app.backToList()">←</button>
      <h1>{{ title }}</h1>
      <button class="header-logout" @click="onLogout">{{ s.currentUser ? '退出' : '登录' }}</button>
    </div>
    <div v-if="isCardView" class="stats">
      <div class="stat collected"><strong>{{ stats.collected }}</strong> 已收集</div>
      <div class="stat remaining"><strong>{{ stats.remaining }}</strong> 未收集</div>
      <div class="stat"><strong style="color:var(--accent)">{{ stats.pct }}%</strong></div>
    </div>
  </header>
</template>