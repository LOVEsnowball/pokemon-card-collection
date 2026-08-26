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
const loaded = ref(false)

function openCard() { app.openCardModal(card.value) }
function onLoad() { loaded.value = true }
function onError() { loaded.value = true }
</script>

<template>
  <div class="card-item" :class="{ 'collected-card': isCollected }" @click="openCard">
    <div v-if="isCollected" class="collected-badge"><img :src="checkIcon" alt="已收集"></div>
    <div class="card-img-wrap" :class="{ loaded }">
      <img
        class="card-img"
        :src="card.thumb_url"
        :alt="cn(card.name)"
        loading="lazy"
        decoding="async"
        @load="onLoad"
        @error="onError"
      >
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
/* 骨架微光占位：图片加载完成前显示，消除空白 */
.card-img-wrap::before {
  content: ""; position: absolute; inset: 0; z-index: 0;
  background: linear-gradient(100deg, transparent 30%, rgba(255,255,255,.06) 50%, transparent 70%);
  background-size: 200% 100%;
  animation: cardShimmer 1.2s linear infinite;
}
.card-img-wrap.loaded::before { display: none; }
.card-img {
  position: relative; z-index: 1;
  opacity: 0; transition: opacity .25s ease;
}
.card-img-wrap.loaded .card-img { opacity: 1; }
@keyframes cardShimmer {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}
.pocket-badge {
  position: absolute; top: 8px; left: 8px; z-index: 2;
  background: rgba(59, 130, 246, 0.92); color: #fff;
  font-size: 10px; font-weight: 700; letter-spacing: 0.3px;
  padding: 2px 6px; border-radius: 6px;
}
</style>