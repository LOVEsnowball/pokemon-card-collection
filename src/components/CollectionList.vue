<script setup>
import { ref, computed, onMounted } from 'vue'
import { useAppStore } from '../store/useAppStore.js'
import { fmtMoney, cardGame } from '../i18n/translate.js'
import CardItem from './CardItem.vue'
import { useInfiniteList } from '../composables/useInfiniteList.js'

const app = useAppStore()
const s = app.state

const collectedCards = computed(() => s.mineCards.filter(c => s.collection[c.id]))
const spent = computed(() => app.mineSpentTotal())
const game = ref('all')

const gameStats = computed(() => {
  let tcg = 0, pocket = 0
  for (const c of collectedCards.value) { if (cardGame(c) === 'pocket') pocket++; else tcg++ }
  return { tcg, pocket }
})
const gameTabs = computed(() => [
  { key: 'all', label: '全部', count: collectedCards.value.length },
  { key: 'tcg', label: 'TCG', count: gameStats.value.tcg },
  { key: 'pocket', label: 'Pocket', count: gameStats.value.pocket }
])

const filtered = computed(() => {
  let list = collectedCards.value
  if (game.value === 'pocket') list = list.filter(c => cardGame(c) === 'pocket')
  else if (game.value === 'tcg') list = list.filter(c => cardGame(c) !== 'pocket')
  return list
})

onMounted(() => {
  if (s.currentUser) app.loadMineCards()
})

// 收藏列表渐进渲染
const { visible, hasMore } = useInfiniteList(filtered)
</script>

<template>
  <div class="collection-page">
    <header class="header">
      <div class="header-top">
        <button class="header-back" @click="app.closeCollection()">←</button>
        <h1>我的收藏</h1>
        <div class="header-spacer"></div>
      </div>
    </header>

    <div class="collection-hero">
      <div class="collection-hero-item">
        <span class="collection-hero-num">{{ collectedCards.length }}</span>
        <span class="collection-hero-label">已收藏卡牌</span>
      </div>
      <div class="collection-hero-divider"></div>
      <div class="collection-hero-item">
        <span class="collection-hero-num">¥{{ fmtMoney(spent) }}</span>
        <span class="collection-hero-label">累计金额</span>
      </div>
    </div>

    <div class="tabs game-tabs">
      <button
        v-for="f in gameTabs"
        :key="f.key"
        class="tab"
        :class="{ active: game === f.key }"
        @click="game = f.key"
      >{{ f.label }} {{ f.count }}</button>
    </div>

    <div v-if="!s.currentUser" class="empty">登录后即可查看你的收藏</div>
    <div v-else-if="collectedCards.length" class="card-list mine-list">
      <CardItem
        v-for="card in visible"
        :key="card.id"
        :card="card"
        v-memo="[card, s.collection[card.id], s.priceMap[card.id]]"
      />
    </div>
    <div v-if="hasMore" class="list-more">上滑加载更多…</div>
    <div v-else-if="!collectedCards.length" class="empty">还没有收藏任何卡牌<br>去「首页」浏览并标记吧</div>
  </div>
</template>