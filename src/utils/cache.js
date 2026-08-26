// 简易 TTL 缓存：内存优先，localStorage 持久化（带体积上限保护，避免撑爆配额）
const MEM = new Map()

// 超过该体积的数据只存内存，不写 localStorage
const MAX_PERSIST_BYTES = 800 * 1024

function getCache(key) {
  const mem = MEM.get(key)
  if (mem) {
    if (mem.exp > Date.now()) return mem.value
    MEM.delete(key)
  }
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return null
    const item = JSON.parse(raw)
    if (!item || typeof item.exp !== 'number') return null
    if (item.exp > Date.now()) {
      MEM.set(key, item)
      return item.value
    }
    localStorage.removeItem(key)
  } catch (e) { /* ignore */ }
  return null
}

function setCache(key, value, ttlMs) {
  const item = { value, exp: Date.now() + ttlMs }
  MEM.set(key, item)
  try {
    const raw = JSON.stringify(item)
    if (raw.length <= MAX_PERSIST_BYTES) {
      localStorage.setItem(key, raw)
    }
  } catch (e) { /* 配额超限时仅保留内存缓存 */ }
}

function removeCache(key) {
  MEM.delete(key)
  try { localStorage.removeItem(key) } catch (e) { /* ignore */ }
}

export { getCache, setCache, removeCache }