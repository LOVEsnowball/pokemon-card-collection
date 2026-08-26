import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { readFileSync, writeFileSync, existsSync } from 'node:fs'

// 构建时向 sw.js 注入版本号（用构建时间戳），避免手动升级 CACHE_NAME
function swVersion() {
  return {
    name: 'sw-version',
    apply: 'build',
    closeBundle() {
      const p = 'dist/sw.js'
      if (!existsSync(p)) return
      let s = readFileSync(p, 'utf8')
      s = s.replace(/__BUILD_ID__/g, Date.now().toString(36))
      writeFileSync(p, s)
    }
  }
}

export default defineConfig({
  plugins: [vue(), swVersion()],
  // 相对路径，方便部署到任意子路径（Cloudflare Pages / Netlify 等）
  base: './',
  server: {
    host: true,
    port: 5173
  }
})