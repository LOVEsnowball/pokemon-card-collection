<script setup>
import { ref, computed, watch } from 'vue'
import { useAppStore } from '../store/useAppStore.js'

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

function pick(ill) {
  app.selectIllustrator(ill.id, ill.name)
}
</script>

<template>
  <div>
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