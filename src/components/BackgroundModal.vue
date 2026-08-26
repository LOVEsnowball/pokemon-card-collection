<script setup>
import { ref, computed } from 'vue'
import { useAppStore } from '../store/useAppStore.js'

const app = useAppStore()
const s = app.state
const fileInput = ref(null)

const presets = [
  { id: '', name: '默认深色', css: '' },
  { id: 'aurora', name: '极光紫', css: 'linear-gradient(160deg,#1b1b3a 0%,#4a3f8f 45%,#8a6be8 100%)' },
  { id: 'ocean', name: '海洋蓝', css: 'linear-gradient(160deg,#0f2d4a 0%,#1e5a86 55%,#48a9d6 100%)' },
  { id: 'sunset', name: '日落橙', css: 'linear-gradient(160deg,#3a1b2e 0%,#a04a5a 50%,#e8a06b 100%)' },
  { id: 'forest', name: '森林绿', css: 'linear-gradient(160deg,#0f2b24 0%,#2f6b4f 55%,#69b58a 100%)' },
  { id: 'sakura', name: '樱花粉', css: 'linear-gradient(160deg,#2b1b2e 0%,#a05578 50%,#e8a0b0 100%)' }
]

const accents = [
  { id: '', name: '默认紫', color: '#8b6cfc', css: '' },
  { id: 'cyan', name: '青蓝', color: '#38bdf8', css: '#38bdf8' },
  { id: 'emerald', name: '翡翠', color: '#34d399', css: '#34d399' },
  { id: 'rose', name: '玫红', color: '#f472b6', css: '#f472b6' },
  { id: 'orange', name: '暖橙', color: '#fb923c', css: '#fb923c' },
  { id: 'gold', name: '金黄', color: '#fbbf24', css: '#fbbf24' }
]

const isActive = (id) => s.bg === presets.find(p => p.id === id)?.css || (id === '' && !s.bg)
const isAccentActive = (id) => (id === '' ? !s.accent : s.accent === accents.find(a => a.id === id)?.css)

function select(id) {
  const p = presets.find(x => x.id === id)
  if (p) app.setBg(p.css)
}
function selectAccent(id) {
  const a = accents.find(x => x.id === id)
  if (a) app.setAccent(a.css)
}
function pickFile() {
  fileInput.value && fileInput.value.click()
}
async function onFile(e) {
  const file = e.target.files[0]
  e.target.value = ''
  if (!file) return
  try {
    const url = await resizeImage(file, 1280)
    app.setBg(`url("${url}")`)
    app.showToast('背景已更新')
  } catch (err) {
    app.showToast('读取图片失败')
  }
}
function resizeImage(file, size) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const reader = new FileReader()
    reader.onerror = reject
    reader.onload = () => {
      img.onload = () => {
        const canvas = document.createElement('canvas')
        const ratio = Math.max(size / img.width, size / img.height, 1)
        canvas.width = Math.round(img.width * ratio)
        canvas.height = Math.round(img.height * ratio)
        const ctx = canvas.getContext('2d')
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
        resolve(canvas.toDataURL('image/jpeg', 0.82))
      }
      img.onerror = reject
      img.src = reader.result
    }
    reader.readAsDataURL(file)
  })
}
</script>

<template>
  <div class="modal-overlay" @click.self="app.closeBg()">
    <div class="modal bg-modal">
      <div class="modal-body">
        <div class="bg-modal-title">
          <span>调色板</span>
          <button class="modal-close" @click="app.closeBg()">×</button>
        </div>
        <p class="bg-modal-tip">自定义主题色与全局背景，打造你的专属配色</p>

        <div class="palette-section-title">主题色</div>
        <div class="accent-swatches">
          <button
            v-for="a in accents"
            :key="a.id || 'default'"
            class="accent-swatch"
            :class="{ active: isAccentActive(a.id) }"
            :style="{ background: a.color }"
            :title="a.name"
            @click="selectAccent(a.id)"
          >
            <span v-if="isAccentActive(a.id)" class="accent-swatch-check">✓</span>
          </button>
        </div>

        <div class="palette-section-title">背景</div>
        <div class="bg-presets">
          <div
            v-for="p in presets"
            :key="p.id || 'default'"
            class="bg-preset"
            :class="{ active: isActive(p.id) }"
            :style="p.css ? { background: p.css } : { background: '#0f0f14' }"
            @click="select(p.id)"
          >
            <span class="bg-preset-check" v-if="isActive(p.id)">✓</span>
          </div>
          <div class="bg-preset bg-preset-upload" @click="pickFile">
            <span class="bg-preset-plus">＋</span>
          </div>
        </div>
        <div class="bg-preset-names">{{ presets.find(p => isActive(p.id))?.name || '自定义' }}</div>
        <input ref="fileInput" type="file" accept="image/*" style="display:none" @change="onFile">
      </div>
    </div>
  </div>
</template>