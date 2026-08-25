import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  // 相对路径，方便部署到任意子路径（Cloudflare Pages / Netlify 等）
  base: './',
  server: {
    host: true,
    port: 5173
  }
})