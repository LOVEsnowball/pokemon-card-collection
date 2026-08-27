<script setup>
import { ref, watch } from 'vue'
import { useAppStore } from '../store/useAppStore.js'
import { cn, ja } from '../i18n/translate.js'

const app = useAppStore()
const s = app.state

const card = s.cardModalCard
const isCollected = ref(!!s.collection[card.id])
const priceInput = ref(app.getPrice(card.id) || '')
const loading = ref(false)

watch(() => s.collection[card.id], (v) => { isCollected.value = !!v })

function onPriceInput() {
  app.setPrice(card.id, priceInput.value)
}
async function collect() {
  loading.value = true
  await app.toggleCollection(card, true)
  loading.value = false
  // 标记后不关闭，直接展示已收藏款式
}
async function remove() {
  loading.value = true
  await app.toggleCollection(card, false)
  loading.value = false
  app.closeCardModal()
}
async function save() {
  if (loading.value) return
  loading.value = true
  app.setPrice(card.id, priceInput.value)
  app.syncPricesToCloud()
  loading.value = false
  app.showToast('花费已保存')
  app.closeCardModal()
}
</script>

<template>
  <div class="modal-overlay" @click.self="app.closeCardModal()">
    <div class="modal">
      <div v-if="card.thumb_url" class="modal-img-wrap" @click.stop="app.openLightbox(card.thumb_url)">
        <img class="modal-img" :src="card.thumb_url" :alt="card.name">
        <span class="modal-img-hint">点击放大</span>
      </div>
      <div class="modal-body">
        <div class="modal-name">{{ cn(card.name) }}</div>
        <div class="modal-ja">{{ ja(card.name) }}</div>
        <div class="modal-meta">{{ card.number }}</div>
        <div class="modal-set">{{ card.set_name }}</div>

        <div v-if="isCollected" class="modal-price">
          <span class="modal-price-label">卡牌花费</span>
          <div class="modal-price-input">
            <span>¥</span>
            <input v-model="priceInput" type="number" min="0" step="0.01" placeholder="0.00" @input="onPriceInput">
          </div>
        </div>

        <div class="modal-actions">
          <template v-if="isCollected">
            <button class="modal-btn modal-btn-save" :disabled="loading" @click="save">{{ loading ? '保存中…' : '确认修改' }}</button>
            <button class="modal-btn modal-btn-remove" :disabled="loading" @click="remove">{{ loading ? '处理中…' : '移除收藏' }}</button>
          </template>
          <button v-else class="modal-btn modal-btn-collect" :disabled="loading" @click="collect">{{ loading ? '标记中…' : '标记为已收集' }}</button>
        </div>
      </div>
    </div>
  </div>
</template>