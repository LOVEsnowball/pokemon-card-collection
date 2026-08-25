<script setup>
import { ref, computed } from 'vue'
import { useAppStore } from '../store/useAppStore.js'
import { cn, ja, fmtMoney, cardGame } from '../i18n/translate.js'
import checkIcon from '../assets/check.svg'

const app = useAppStore()
const s = app.state

const props = defineProps({ card: { type: Object, required: true } })
const card = computed(() => props.card)

const isCollected = computed(() => !!(s.collection && s.collection[card.value.id]))
const price = computed(() => app.getPrice(card.value.id))

function openCard() { app.openCardModal(card.value) }
</script>

<template>
  <div class="card-item" :class="{ 'collected-card': isCollected }" @click="openCard">
    <div v-if="isCollected" class="collected-badge"><img :src="checkIcon" alt="已收集"></div>
    <div class="card-img-wrap">
      <img class="card-img" :src="card.thumb_url" :alt="cn(card.name)" loading="lazy" @error="e => e.target.style.display = 'none'">
      <div v-if="cardGame(card) === 'pocket'" class="pocket-badge">Pocket</div>
    </div>
    <div class="card-info">
      <div class="card-name">{{ cn(card.name) }}</div>
      <div class="card-ja">{{ ja(card.name) }}</div>
      <div class="card-number">{{ card.number }}</div>
      <div v-if="isCollected" class="card-price" :class="{ 'no-price': !price }">
        {{ price ? '¥' + fmtMoney(price) : '未记价' }}
      </div>
      <div class="card-set">{{ card.set_name }}</div>
    </div>
  </div>
</template>

<style scoped>
.card-img-wrap { position: relative; }
.pocket-badge {
  position: absolute; top: 8px; left: 8px; z-index: 2;
  background: rgba(59, 130, 246, 0.92); color: #fff;
  font-size: 10px; font-weight: 700; letter-spacing: 0.3px;
  padding: 2px 6px; border-radius: 6px;
}
</style>