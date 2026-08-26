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

const isActive = (id) => s.bg === presets.find(p => p.id === id)?.css || (id === '' && !s.bg)

function select(id) {
  const p = presets.find(x => x.id === id)
  if (p) app.setBg(p.css)
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
          <span>设置主页背景</span>
          <button class="modal-close" @click="app.closeBg()">×</button>
        </div>
        <p class="bg-modal-tip">选择预设背景，或上传自己的图片（建议竖图或深色图）</p>
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