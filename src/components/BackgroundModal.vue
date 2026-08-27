<script setup>
import { useAppStore } from '../store/useAppStore.js'

const app = useAppStore()
const s = app.state

const accents = [
  { id: '', name: '默认紫', color: '#8b6cfc', css: '' },
  { id: 'cyan', name: '青蓝', color: '#38bdf8', css: '#38bdf8' },
  { id: 'emerald', name: '翡翠', color: '#34d399', css: '#34d399' },
  { id: 'rose', name: '玫红', color: '#f472b6', css: '#f472b6' },
  { id: 'orange', name: '暖橙', color: '#fb923c', css: '#fb923c' },
  { id: 'gold', name: '金黄', color: '#fbbf24', css: '#fbbf24' }
]

const isAccentActive = (id) => (id === '' ? !s.accent : s.accent === accents.find(a => a.id === id)?.css)

function selectAccent(id) {
  const a = accents.find(x => x.id === id)
  if (a) app.setAccent(a.css)
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
        <p class="bg-modal-tip">选择主题色，打造你的专属配色</p>

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
      </div>
    </div>
  </div>
</template>