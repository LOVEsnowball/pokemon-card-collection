<script setup>
import { ref, computed, watch } from 'vue'
import { useAppStore } from '../store/useAppStore.js'
import { fmtMoney } from '../i18n/translate.js'

const app = useAppStore()
const s = app.state
const q = ref('')
const dq = ref('') // 防抖后的搜索词
let qTimer = null
watch(q, (v) => {
  clearTimeout(qTimer)
  qTimer = setTimeout(() => { dq.value = v }, 200)
})

const filtered = computed(() => {
  const kw = dq.value.toLowerCase().trim()
  if (!kw) return s.illustrators
  return s.illustrators.filter(i => (i.name || '').toLowerCase().includes(kw))
})

const spent = computed(() => app.mineSpentTotal())

function pick(ill) {
  app.selectIllustrator(ill.id, ill.name)
}
function openCollection() {
  app.openCollection()
}
</script>

<template>
  <div>
    <!-- 收藏列表入口：带背景的卡片，点击进入收藏列表页 -->
    <div class="collection-entry" @click="openCollection">
      <div class="collection-entry-inner">
        <div class="collection-entry-left">
          <div class="collection-entry-title">我的收藏</div>
          <div class="collection-entry-nums">
            <span class="collection-entry-num">{{ s.collectedTotal }}</span>
            <span class="collection-entry-unit">张</span>
            <span class="collection-entry-sep">·</span>
            <span class="collection-entry-amount">¥{{ fmtMoney(spent) }}</span>
          </div>
        </div>
        <div class="collection-entry-arrow">›</div>
      </div>
    </div>

    <div class="sticky-bar">
      <div class="search-wrap">
        <input v-model="q" class="search-input" placeholder="搜索画师...">
      </div>
    </div>
    <div class="illustrator-list">
      <div
        v-for="ill in filtered"
        :key="ill.id"
        class="illustrator-item"
        :class="{ featured: ill.id === 22 }"
        @click="pick(ill)"
      >
        <div class="ill-name">{{ ill.name }}</div>
      </div>
    </div>
    <div v-if="filtered.length === 0" class="empty">没有匹配的画师</div>
  </div>
</template>