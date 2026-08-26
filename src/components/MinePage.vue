<script setup>
import { ref, computed, onMounted } from 'vue'
import { useAppStore } from '../store/useAppStore.js'
import { fmtMoney } from '../i18n/translate.js'
import defaultAvatar from '../assets/favicon-180.png'

const app = useAppStore()
const s = app.state

const avatarSrc = ref(app.loadProfile().avatar || defaultAvatar)
const profile = ref(app.loadProfile())
const nameInput = ref(profile.value.name || '')
const avatarFile = ref(null)
const importFile = ref(null)

const collectedCards = computed(() => s.mineCards.filter(c => s.collection[c.id]))
const spent = computed(() => Object.values(s.priceMap).reduce((a, b) => a + (parseFloat(b) || 0), 0))
const pct = computed(() => (s.mineTotal ? Math.round((collectedCards.value.length / s.mineTotal) * 100) : 0))

onMounted(() => {
  if (s.currentUser) app.loadMineCards()
})

function onNameChange() {
  const p = app.loadProfile()
  p.name = nameInput.value.trim()
  app.saveProfile(p)
  profile.value = p
  app.showToast('昵称已保存')
}
function pickAvatar() {
  if (s.currentUser && avatarFile.value) avatarFile.value.click()
}
async function onAvatarChange(e) {
  const file = e.target.files[0]
  e.target.value = ''
  if (!file) return
  try {
    const url = await resizeSquareImage(file, 256)
    const p = app.loadProfile()
    p.avatar = url
    app.saveProfile(p)
    profile.value = p
    avatarSrc.value = url
    app.showToast('头像已更新')
  } catch (err) {
    app.showToast('读取图片失败')
  }
}
function resizeSquareImage(file, size) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const reader = new FileReader()
    reader.onerror = reject
    reader.onload = () => {
      img.onload = () => {
        const canvas = document.createElement('canvas')
        canvas.width = size; canvas.height = size
        const ctx = canvas.getContext('2d')
        ctx.imageSmoothingQuality = 'high'
        const sq = Math.min(img.width, img.height)
        ctx.drawImage(img, (img.width - sq) / 2, (img.height - sq) / 2, sq, sq, 0, 0, size, size)
        resolve(canvas.toDataURL('image/jpeg', 0.85))
      }
      img.onerror = reject
      img.src = reader.result
    }
    reader.readAsDataURL(file)
  })
}
function onImportChange(e) {
  const file = e.target.files[0]
  e.target.value = ''
  if (file) app.importBackup(file)
}
</script>

<template>
  <div class="profile-page">
    <!-- 未登录 -->
    <div v-if="!s.currentUser" class="mine-guest">
      <p style="font-size:26px;margin-bottom:12px">👤</p>
      <p>登录后即可编辑头像、昵称，<br>并查看你的全部收藏。</p>
      <button class="btn btn-primary" @click="app.openAuth()">登录 / 注册</button>
    </div>

    <!-- 已登录 -->
    <template v-else>
      <div class="profile-card">
        <div class="avatar-wrap" @click="pickAvatar">
          <img class="avatar-img" :src="avatarSrc" alt="头像">
          <div class="avatar-edit">编辑</div>
          <input ref="avatarFile" type="file" accept="image/*" style="display:none" @change="onAvatarChange">
        </div>
        <input v-model="nameInput" class="profile-name-input" placeholder="点击设置昵称" maxlength="16" @change="onNameChange">
        <div class="profile-email">{{ s.currentUser.email || '' }}</div>
      </div>

      <div class="mine-stats">
        <div class="stat"><strong>{{ collectedCards.length }}</strong> 已收藏卡</div>
        <div class="stat"><strong>¥{{ fmtMoney(spent) }}</strong> 累计花费</div>
      </div>

      <div class="mine-progress">
        <div class="mine-progress-bar"><div class="mine-progress-fill" :style="{ width: pct + '%' }"></div></div>
        <div class="mine-progress-label">
          <span>总收集进度（全部卡牌）</span>
          <span><strong>{{ pct }}%</strong></span>
        </div>
      </div>

      <div class="mine-section-title">我的收藏</div>
      <button class="mine-collection-link" @click="app.openCollection()">
        <span>已收藏 {{ s.collectedTotal }} 张 · 累计 ¥{{ fmtMoney(spent) }}</span>
        <span class="mine-collection-link-arrow">查看收藏列表 ›</span>
      </button>

      <div class="mine-section-title">数据工具</div>
      <div class="mine-toolbar">
        <button class="btn-sm btn-sm-primary" @click="app.exportBackup()">导出备份</button>
        <button class="btn-sm btn-sm-outline" @click="importFile.click()">导入恢复</button>
        <button class="btn-sm btn-danger" @click="app.clearAll()">清空全部收藏</button>
      </div>
      <input ref="importFile" type="file" accept=".json" style="display:none" @change="onImportChange">
      <button class="btn btn-outline" @click="app.logout()">退出登录</button>
    </template>
  </div>
</template>