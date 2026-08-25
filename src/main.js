import { createApp } from 'vue'
import App from './App.vue'
import './style.css'

// PWA: 注册 Service Worker（离线缓存）
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('sw.js')
      .catch(err => console.warn('SW registration failed:', err))
  })
}

createApp(App).mount('#app')