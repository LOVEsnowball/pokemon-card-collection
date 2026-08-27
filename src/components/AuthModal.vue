<script setup>
import { ref } from 'vue'
import { useAppStore } from '../store/useAppStore.js'

const app = useAppStore()
const s = app.state

const email = ref('')
const password = ref('')
const error = ref('')
const loading = ref(false)

function toggleMode() {
  app.setAuthMode(s.authMode === 'login' ? 'signup' : 'login')
  error.value = ''
}
async function submit() {
  if (!email.value.trim() || !password.value) {
    error.value = '请填写邮箱和密码'
    return
  }
  error.value = ''
  loading.value = true
  const err = await app.doAuth(email.value.trim(), password.value)
  loading.value = false
  if (err) {
    error.value = err
  }
}
function onKey(e) {
  if (e.key === 'Enter') submit()
}
</script>

<template>
  <div v-if="s.authOpen" class="auth-page" @click.self="app.closeAuth()">
    <div class="auth-card">
      <button class="auth-close" @click="app.closeAuth()">×</button>
      <h1>TCG查询</h1>
      <p class="sub">{{ s.authMode === 'login' ? '登录后即可同步收藏' : '注册新账号' }}</p>
      <div class="input-group">
        <label>邮箱</label>
        <input v-model="email" type="email" placeholder="your@email.com" @keydown="onKey">
      </div>
      <div class="input-group">
        <label>密码</label>
        <input v-model="password" type="password" placeholder="至少6位" @keydown="onKey">
      </div>
      <button class="btn btn-primary" :disabled="loading" @click="submit">
        {{ loading ? (s.authMode === 'login' ? '登录中...' : '注册中...') : (s.authMode === 'login' ? '登录' : '注册') }}
      </button>
      <p v-if="error" class="auth-error">{{ error }}</p>
      <button class="btn btn-outline" @click="toggleMode">
        {{ s.authMode === 'login' ? '还没有账号？注册' : '已有账号？登录' }}
      </button>
    </div>
  </div>
</template>