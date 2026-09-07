<script setup>
import { ref, computed, watch } from 'vue'
import { useAppStore } from '../store/useAppStore.js'
import { cn, cardGame } from '../i18n/translate.js'
import CardItem from './CardItem.vue'
import { useInfiniteList } from '../composables/useInfiniteList.js'

const app = useAppStore()
const s = app.state
const q = ref('')
const dq = ref('') // 防抖后的搜索词
let qTimer = null
watch(q, (v) => {
  clearTimeout(qTimer)
  qTimer = setTimeout(() => { dq.value = v }, 200)
})

const gameStats = computed(() => {
  let tcg = 0, pocket = 0
  for (const c of s.allCards) { if (cardGame(c) === 'pocket') pocket++; else tcg++ }
  return { tcg, pocket }
})
const gameTabs = computed(() => [
  { key: 'all', label: '全部', count: s.allCards.length },
  { key: 'tcg', label: 'TCG', count: gameStats.value.tcg },
  { key: 'pocket', label: 'Pocket', count: gameStats.value.pocket }
])

const filtered = computed(() => {
  let list = [...s.allCards]
  if (s.currentGame === 'pocket') list = list.filter(c => cardGame(c) === 'pocket')
  else if (s.currentGame === 'tcg') list = list.filter(c => cardGame(c) !== 'pocket')
  if (s.currentFilter === 'collected') {
    list = list.filter(c => s.collection[c.id])
  } else if (s.currentFilter === 'uncollected') {
    list = list.filter(c => !s.collection[c.id])
  } else {
    list.sort((a, b) => (s.collection[b.id] ? 1 : 0) - (s.collection[a.id] ? 1 : 0))
  }
  const kw = dq.value.toLowerCase().trim()
  if (kw) {
    list = list.filter(c =>
      (c.name || '').toLowerCase().includes(kw) ||
      cn(c.name).includes(kw) ||
      String(c.number).toLowerCase().includes(kw) ||
      (c.set_name || '').toLowerCase().includes(kw)
    )
  }
  return list
})

// 当前游戏分组下的卡牌全集（不做搜索/收藏筛选），供筛选 tab 计数
const gameBase = computed(() => {
  if (s.currentGame === 'pocket') return s.allCards.filter(c => cardGame(c) === 'pocket')
  if (s.currentGame === 'tcg') return s.allCards.filter(c => cardGame(c) !== 'pocket')
  return s.allCards
})

const filters = computed(() => {
  let coll = 0
  for (const c of gameBase.value) if (s.collection[c.id]) coll++
  return [
    { key: 'all', label: '全部', count: gameBase.value.length },
    { key: 'collected', label: '已收集', count: coll },
    { key: 'uncollected', label: '未收集', count: gameBase.value.length - coll }
  ]
})

// 本地切片：全量卡牌已在进入画师页时一次取齐，滚动到底仅渐进渲染，计数始终正确
const { visible, hasMore, reset } = useInfiniteList(filtered, { pageSize: 60 })

// 仅在主动切换（画师/游戏/筛选/搜索）时回第一批；收藏操作不会触发，避免列表刷新跳动
watch(() => [s.currentGame, s.currentFilter, s.currentIllustrator, dq], () => reset())
</script>

<template>
  <div>
    <div class="sticky-bar">
      <div class="search-wrap">
        <input v-model="q" class="search-input" placeholder="搜索卡牌名称或编号...">
        <button v-if="q" class="search-clear" title="清空" @click="q = ''">×</button>
      </div>
      <div class="tabs game-tabs">
        <button
          v-for="f in gameTabs"
          :key="f.key"
          class="tab"
          :class="{ active: s.currentGame === f.key }"
          @click="app.setGame(f.key)"
        >{{ f.label }} {{ f.count }}</button>
      </div>
      <div class="tabs">
        <button
          v-for="f in filters"
          :key="f.key"
          class="tab"
          :class="{ active: s.currentFilter === f.key }"
          @click="app.setFilter(f.key)"
        >{{ f.label }} {{ f.count }}</button>
      </div>
    </div>
    <div class="card-list">
      <CardItem
        v-for="card in visible"
        :key="card.id"
        :card="card"
        v-memo="[card, s.collection[card.id], s.priceMap[card.id]]"
      />
    </div>
    <div v-if="hasMore" class="list-more">继续上滑加载更多卡牌…</div>
    <div v-if="filtered.length === 0" class="empty">没有匹配的卡牌</div>
  </div>
</template>