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
      <div class="header-actions">
        <button class="header-bg-btn" title="调色板" @click="app.openBg()">
          <svg viewBox="0 0 24 24" width="18" height="18"><path fill="currentColor" d="M12 3a9 9 0 1 0 0 18 1.5 1.5 0 0 0 1.18-.57l.6-.7h-3.56l.6.7A1.5 1.5 0 0 0 12 21a9 9 0 0 0 9-9 9 9 0 0 0-9-9zm-5 7.5A1.5 1.5 0 1 1 7 12a1.5 1.5 0 0 1 0-1.5zm5 0a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3zm5 0a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3z"/></svg>
        </button>
        <button class="header-logout" @click="onLogout">{{ s.currentUser ? '退出' : '登录' }}</button>
      </div>
    </div>
    <div v-if="isCardView" class="stats">
      <div class="stat collected"><strong>{{ stats.collected }}</strong> 已收集</div>
      <div class="stat remaining"><strong>{{ stats.remaining }}</strong> 未收集</div>
      <div class="stat"><strong style="color:var(--accent)">{{ stats.pct }}%</strong></div>
    </div>
  </header>
</template>