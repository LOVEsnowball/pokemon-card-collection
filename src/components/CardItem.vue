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

function openCard() { app.openCard(card.value) }
</script>

<template>
  <div class="card-item" @click="openCard">
    <div class="thumb">
      <img :src="card.thumb_url" :alt="cn(card.name)" loading="lazy">
      <div v-if="isCollected" class="collected-badge"><img :src="checkIcon" alt="已收集"></div>
      <div v-if="cardGame(card) === 'pocket'" class="pocket-badge">Pocket</div>
    </div>
    <div class="card-info">
      <div class="card-name">{{ cn(card.name) }}</div>
      <div class="card-en">{{ card.name }}</div>
      <div class="card-sub">{{ card.number }} · {{ ja(card.name) }}</div>
      <div class="card-set">{{ card.set_name }}</div>
    </div>
  </div>
</template>

<style scoped>
.thumb { position: relative; }
.pocket-badge {
  position: absolute; top: 8px; left: 8px; z-index: 2;
  background: rgba(59, 130, 246, 0.92); color: #fff;
  font-size: 10px; font-weight: 700; letter-spacing: 0.3px;
  padding: 2px 6px; border-radius: 6px;
}
</style>