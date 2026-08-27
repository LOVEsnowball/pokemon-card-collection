import { reactive, readonly } from 'vue'
import { sb } from '../supabaseClient.js'
import { fmtMoney } from '../i18n/translate.js'
import { getCache, setCache } from '../utils/cache.js'

// ===== localStorage 键 =====
const LS_VIEW = 'pk_view'
function collCacheKey() { return 'pk_coll_' + (state.currentUser ? state.currentUser.id : '') }
function priceKey() { return 'pk_price_' + (state.currentUser ? state.currentUser.id : '') }
function profileKey() { return 'pk_profile_' + (state.currentUser ? state.currentUser.id : '') }

const KOMIYA_ID = 22 // featured 画师

// ===== 响应式状态 =====
const state = reactive({
  currentUser: null,
  currentIllustrator: null, // { id, name }
  currentFilter: 'all', // all | collected | uncollected
  currentGame: 'all', // all | tcg | pocket（画师卡列表分组）
  allCards: [],
  illustrators: [],
  loading: false,
  collection: {}, // card_id -> true
  priceMap: {}, // card_id -> 金额
  currentTab: 'home', // home | mine
  collectionOpen: false, // 收藏列表页（独立视图）
  collectedTotal: 0, // 全量已收藏卡牌数（用于主页入口徽标）
  bgOpen: false, // 调色板弹层
  accent: '', // 主题色（空=默认紫色 #8b6cfc）
  mineCards: [],
  mineCardsById: {},
  mineTotal: null,

  // auth
  authOpen: false,
  authMode: 'login', // login | signup
  pendingToggle: null, // 未登录暂存的收藏操作

  // 弹层
  cardModalCard: null,
  lightboxUrl: '',

  // toast
  toast: ''
})

let mineChanged = false
let priceSyncTimer = null

// ===== Toast =====
function showToast(msg) {
  state.toast = msg
}

// ===== View（记住当前画师位置）=====
function saveView() {
  if (!state.currentIllustrator) return
  try {
    localStorage.setItem(LS_VIEW, JSON.stringify({
      id: state.currentIllustrator.id,
      name: state.currentIllustrator.name,
      filter: state.currentFilter
    }))
  } catch (e) { /* ignore */ }
}
function loadView() {
  try {
    const v = localStorage.getItem(LS_VIEW)
    return v ? JSON.parse(v) : null
  } catch (e) { return null }
}
function clearView() {
  try { localStorage.removeItem(LS_VIEW) } catch (e) { /* ignore */ }
}
function loadCollCache() {
  try {
    const v = localStorage.getItem(collCacheKey())
    return v ? JSON.parse(v) : {}
  } catch (e) { return {} }
}
function saveCollCache() {
  if (!state.currentUser) return
  try { localStorage.setItem(collCacheKey(), JSON.stringify(state.collection)) } catch (e) { /* ignore */ }
}

// ===== 画师 =====
const ILLUSTRATORS_CACHE = 'pk_illustrators'
const CARD_CACHE_PREFIX = 'pk_cards_'
const CACHE_TTL = 24 * 60 * 60 * 1000 // 静态数据缓存 24 小时

function sortIllustrators(list) {
  return [...list].sort((a, b) => {
    if (a.id === KOMIYA_ID) return -1
    if (b.id === KOMIYA_ID) return 1
    return 0
  })
}

async function loadIllustrators() {
  const cached = getCache(ILLUSTRATORS_CACHE)
  if (cached) {
    state.illustrators = sortIllustrators(cached)
    refreshIllustrators().catch(() => {}) // 后台静默刷新
    return
  }
  state.loading = true
  const { data, error } = await sb.from('illustrators').select('*').order('name')
  state.loading = false
  if (error) { showToast('加载画师失败: ' + error.message); return }
  state.illustrators = sortIllustrators(data || [])
  setCache(ILLUSTRATORS_CACHE, state.illustrators, CACHE_TTL)
}

async function refreshIllustrators() {
  const { data, error } = await sb.from('illustrators').select('*').order('name')
  if (error || !data) return
  state.illustrators = sortIllustrators(data)
  setCache(ILLUSTRATORS_CACHE, state.illustrators, CACHE_TTL)
}

// ===== 画师卡牌 =====
async function selectIllustrator(id, name) {
  const isSame = state.currentIllustrator && state.currentIllustrator.id === id
  state.currentIllustrator = { id, name }
  saveView()
  state.loading = true

  // 本地价格兜底读回（云端优先，仅补缺失项）
  loadPriceMapLocal()

  if (!isSame) {
    state.allCards = []
    state.currentFilter = 'all'
  }

  const cacheKey = CARD_CACHE_PREFIX + id
  let cards = getCache(cacheKey)
  if (!cards) {
    const { data, error } = await sb
      .from('cards')
      .select('*')
      .eq('illustrator_id', id)
      .order('name')
    if (error) {
      showToast('加载卡牌失败: ' + error.message)
      state.loading = false
      return
    }
    cards = data || []
    setCache(cacheKey, cards, CACHE_TTL)
  }
  state.allCards = cards

  // 收藏状态：已登录云端同步，未登录本地缓存
  state.collection = loadCollCache()
  const cardIds = state.allCards.map(c => c.id)
  if (state.currentUser && cardIds.length > 0) {
    const { data: coll } = await sb.from('user_collections')
      .select('card_id,collected')
      .eq('user_id', state.currentUser.id)
      .in('card_id', cardIds)
    if (coll) coll.forEach(c => { state.collection[c.card_id] = c.collected })
  }
  saveCollCache()
  state.loading = false
}

function backToList() {
  state.currentIllustrator = null
  state.allCards = []
  state.collection = {}
  clearView()
  state.currentFilter = 'all'
  loadIllustrators()
}

function setFilter(filter) {
  state.currentFilter = filter
  saveView()
}

function setGame(game) {
  state.currentGame = game
  saveView()
}

function switchTab(tab) {
  state.collectionOpen = false
  if (state.currentTab === tab) return
  state.currentTab = tab
}

// ===== 收藏列表页 =====
function openCollection() {
  if (state.currentUser) loadMineCards()
  state.collectionOpen = true
}
function closeCollection() {
  state.collectionOpen = false
}

// ===== 主题色 =====
const LS_ACCENT = 'pk_accent'
function loadAccent() {
  try { return localStorage.getItem(LS_ACCENT) || '' } catch (e) { return '' }
}
function setAccent(v) {
  state.accent = v || ''
  try { v ? localStorage.setItem(LS_ACCENT, v) : localStorage.removeItem(LS_ACCENT) } catch (e) { /* ignore */ }
  syncPrefsToCloud()
}
function openBg() { state.bgOpen = true }
function closeBg() { state.bgOpen = false }

// ===== 收藏切换（乐观更新：先改界面，请求失败再回滚）=====
async function toggleCollection(card, collect) {
  if (!state.currentUser) {
    state.pendingToggle = { card, collect }
    openAuth()
    return false
  }
  const had = !!state.collection[card.id]
  const hadPrice = state.priceMap[card.id]
  const prevTotal = state.collectedTotal

  // ---- 乐观更新 ----
  if (collect) {
    if (!had) state.collectedTotal++
    state.collection[card.id] = true
  } else {
    if (had) state.collectedTotal = Math.max(0, state.collectedTotal - 1)
    delete state.collection[card.id]
    delete state.priceMap[card.id]
  }
  saveCollCache()
  savePriceMap()

  try {
    const { error } = await sb.from('user_collections').upsert({
      user_id: state.currentUser.id,
      card_id: card.id,
      collected: collect
    }, { onConflict: 'user_id,card_id' })
    if (error) throw error
    if (state.priceMap[card.id]) syncPricesToCloud()
    if (state.currentTab === 'mine') await loadMineCards()
    showToast(collect ? '已标记为收集 ✓' : '已移除收藏')
    return true
  } catch (error) {
    // ---- 回滚 ----
    if (had) state.collection[card.id] = true; else delete state.collection[card.id]
    state.collectedTotal = prevTotal
    if (hadPrice !== undefined) state.priceMap[card.id] = hadPrice
    saveCollCache()
    savePriceMap()
    console.error('Collection error:', error)
    showToast('操作失败: ' + error.message)
    return false
  }
}

// ===== 价格 =====
function loadPriceMap() {
  try { return JSON.parse(localStorage.getItem(priceKey())) || {} } catch (e) { return {} }
}
// 把本地缓存价格并入内存（云端优先，仅补缺失项），覆盖离线/换设备兜底
function loadPriceMapLocal() {
  const local = loadPriceMap()
  for (const k in local) {
    if (!(k in state.priceMap)) state.priceMap[k] = local[k]
  }
}
function savePriceMap() {
  if (!state.currentUser) return
  try { localStorage.setItem(priceKey(), JSON.stringify(state.priceMap)) } catch (e) { /* ignore */ }
}
function queuePriceSync() {
  clearTimeout(priceSyncTimer)
  priceSyncTimer = setTimeout(syncPricesToCloud, 700)
}
async function syncPricesToCloud() {
  clearTimeout(priceSyncTimer)
  if (!state.currentUser) return
  try {
    await sb.auth.updateUser({ data: { prices: state.priceMap } })
  } catch (e) { console.error('syncPricesToCloud:', e) }
}
async function loadPricesFromCloud() {
  if (!state.currentUser) return
  try {
    const { data } = await sb.auth.getUser()
    const meta = (data && data.user && data.user.user_metadata) || {}
    if (meta && typeof meta.prices === 'object' && meta.prices !== null) {
      let changed = false
      for (const k in meta.prices) {
        const v = parseFloat(meta.prices[k])
        const nv = (!isNaN(v) && v > 0) ? Math.round(v * 100) / 100 : 0
        if (state.priceMap[k] !== nv) { state.priceMap[k] = nv; changed = true }
      }
      if (changed) savePriceMap()
    }
  } catch (e) { console.error('loadPricesFromCloud:', e) }
}
function getPrice(id) { return state.priceMap[id] || 0 }
function setPrice(id, v) {
  const n = parseFloat(v)
  state.priceMap[id] = (!isNaN(n) && n > 0) ? Math.round(n * 100) / 100 : 0
  savePriceMap()
  queuePriceSync()
}
function mineSpentTotal() {
  return Object.values(state.priceMap).reduce((s, v) => s + (parseFloat(v) || 0), 0)
}

// ===== 我的页 =====
async function loadCollectedTotal() {
  if (!state.currentUser) { state.collectedTotal = 0; return }
  try {
    const { count, error } = await sb.from('user_collections')
      .select('card_id', { count: 'exact', head: true })
      .eq('user_id', state.currentUser.id)
      .eq('collected', true)
    if (!error) state.collectedTotal = count || 0
  } catch (e) { /* ignore */ }
}

async function loadMineCards() {
  try {
    if (state.mineTotal == null) {
      try {
        const { count } = await sb.from('cards').select('id', { count: 'exact', head: true })
        state.mineTotal = count || 0
      } catch (e) { state.mineTotal = 0 }
    }
    const { data: coll, error } = await sb
      .from('user_collections')
      .select('card_id')
      .eq('user_id', state.currentUser.id)
      .eq('collected', true)
    if (error) { showToast('加载收藏失败: ' + error.message); return }

    const ids = (coll || []).map(c => c.card_id)
    state.collection = loadCollCache() || {}
    ids.forEach(id => { state.collection[id] = true })
    state.collectedTotal = ids.length

    await loadPricesFromCloud()

    state.mineCards = []
    state.mineCardsById = {}
    for (let i = 0; i < ids.length; i += 500) {
      const chunk = ids.slice(i, i + 500)
      const { data } = await sb.from('cards').select('*').in('id', chunk)
      if (data) data.forEach(c => { state.mineCards.push(c); state.mineCardsById[c.id] = c })
    }
    mineChanged = !mineChanged // 触发列表刷新
  } catch (e) {
    console.error('loadMineCards:', e)
    showToast('刷新收藏失败: ' + e.message)
  }
}

// ===== 全清 =====
async function clearAll() {
  if (!state.currentUser) { openAuth(); return }
  await sb.from('user_collections').delete().eq('user_id', state.currentUser.id)
  state.collection = {}
  state.collectedTotal = 0
  state.mineCards = []
  state.priceMap = {}
  saveCollCache()
  savePriceMap()
  if (state.currentTab === 'mine') await loadMineCards()
  showToast('已清空全部收藏')
}

// ===== 导出 / 导入 =====
async function exportBackup() {
  if (!state.currentUser) { openAuth(); return }
  const { data } = await sb.from('user_collections').select('*').eq('user_id', state.currentUser.id)
  const blob = new Blob([JSON.stringify(data || [], null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'collection-backup.json'
  a.click()
  URL.revokeObjectURL(url)
  showToast('导出成功')
}
async function importBackup(file) {
  if (!file) return
  if (!state.currentUser) { openAuth(); return }
  try {
    const text = await file.text()
    const records = JSON.parse(text)
    let count = 0
    for (const r of records) {
      if (r.collected && r.user_id === state.currentUser.id) {
        await sb.from('user_collections').upsert({
          user_id: state.currentUser.id,
          card_id: r.card_id,
          collected: true
        }, { onConflict: 'user_id,card_id' })
        count++
        state.collection[r.card_id] = true
      }
    }
    saveCollCache()
    if (state.currentTab === 'mine') await loadMineCards()
    showToast(`导入 ${count} 条记录`)
  } catch (err) {
    showToast('导入失败: 文件格式错误')
  }
}

// ===== Profile =====
function loadProfile() {
  try { return JSON.parse(localStorage.getItem(profileKey())) || {} } catch (e) { return {} }
}
function saveProfileRaw(p) {
  try { localStorage.setItem(profileKey(), JSON.stringify(p)) } catch (e) { /* ignore */ }
}
function saveProfile(p) {
  saveProfileRaw(p)
  syncProfileToCloud()
}

// ===== 云端同步（昵称/头像/主题色/背景 → user_metadata） =====
const STORAGE_BUCKET = 'user-assets'

function dataUrlToBlob(dataUrl) {
  const [head, b64] = dataUrl.split(',')
  const mime = (head.match(/data:([^;]+)/) || [])[1] || 'image/jpeg'
  const bin = atob(b64)
  const bytes = new Uint8Array(bin.length)
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i)
  return new Blob([bytes], { type: mime })
}

async function uploadImageToStorage(dataUrl, folder) {
  try {
    const blob = dataUrlToBlob(dataUrl)
    const ext = blob.type === 'image/png' ? 'png' : 'jpg'
    const path = `${folder}/${state.currentUser.id}.${ext}`
    const { error } = await sb.storage.from(STORAGE_BUCKET).upload(path, blob, { contentType: blob.type, upsert: true })
    if (error) throw error
    const { data } = sb.storage.from(STORAGE_BUCKET).getPublicUrl(path)
    return data.publicUrl
  } catch (e) {
    console.warn('Storage 上传失败（可能未配置 bucket）:', e)
    return null
  }
}

async function syncProfileToCloud() {
  if (!state.currentUser) return
  const profile = loadProfile()
  const data = { name: profile.name || '' }
  const avatar = profile.avatar || ''
  if (avatar.startsWith('data:')) {
    const url = await uploadImageToStorage(avatar, 'avatars')
    if (url) {
      data.avatar = url
      profile.avatar = url
      saveProfileRaw(profile)
    }
  } else if (avatar) {
    data.avatar = avatar
  }
  try {
    await sb.auth.updateUser({ data })
  } catch (e) { console.error('syncProfileToCloud:', e) }
}

async function syncPrefsToCloud() {
  if (!state.currentUser) return
  const data = { accent: state.accent || '' }
  try {
    await sb.auth.updateUser({ data })
  } catch (e) { console.error('syncPrefsToCloud:', e) }
}

async function loadUserMetaFromCloud() {
  if (!state.currentUser) return
  try {
    const { data } = await sb.auth.getUser()
    const meta = (data && data.user && data.user.user_metadata) || {}
    const profile = loadProfile()

    if (typeof meta.name === 'string' && meta.name) profile.name = meta.name
    if (typeof meta.avatar === 'string' && meta.avatar) profile.avatar = meta.avatar
    saveProfileRaw(profile)

    if (typeof meta.accent === 'string' && meta.accent) {
      state.accent = meta.accent
      try { localStorage.setItem(LS_ACCENT, meta.accent) } catch (e) { /* ignore */ }
    }

    // 首次登录：本地有、云端缺的小字段补推一次（base64 图片跳过，待下次变更经 Storage 上传）
    const push = {}
    if (!meta.name && profile.name) push.name = profile.name
    if (!meta.accent && state.accent) push.accent = state.accent
    if (!meta.avatar && profile.avatar && !profile.avatar.startsWith('data:')) push.avatar = profile.avatar
    if (Object.keys(push).length) {
      await sb.auth.updateUser({ data: push })
    }
  } catch (e) { console.error('loadUserMetaFromCloud:', e) }
}

// ===== Auth =====
function openAuth() { state.authOpen = true }
function closeAuth() { state.authOpen = false }
function setAuthMode(mode) { state.authMode = mode }
async function logout() {
  if (state.currentUser) {
    try { await sb.auth.signOut() } catch (e) { console.error('logout:', e) }
  } else {
    openAuth()
  }
}
async function doAuth(email, password) {
  if (state.authMode === 'login') {
    const result = await sb.auth.signInWithPassword({ email, password })
    if (result.error) return result.error.message
    return null
  }
  // signup
  const result = await sb.auth.signUp({ email, password })
  if (result.error) return result.error.message
  const loginResult = await sb.auth.signInWithPassword({ email, password })
  if (loginResult.error) return '注册成功！请手动登录'
  return null
}

// ===== 弹层 =====
function openCardModal(card) { state.cardModalCard = card }
function closeCardModal() { state.cardModalCard = null }
function openLightbox(url) { state.lightboxUrl = url }
function closeLightbox() { state.lightboxUrl = '' }

// ===== 会话初始化 =====
function initSession() {
  loadPriceMapLocal()
  state.accent = loadAccent()
  sb.auth.onAuthStateChange((event, session) => {
    if (session?.user) {
      state.currentUser = session.user
      closeAuth()
      loadPricesFromCloud()
      loadUserMetaFromCloud()
      loadCollectedTotal()
      if (state.pendingToggle) {
        const pt = state.pendingToggle
        state.pendingToggle = null
        toggleCollection(pt.card, pt.collect)
      }
      if (state.currentTab === 'mine') {
        loadMineCards()
      } else if (state.currentIllustrator) {
        // 登录后自动刷新当前画师卡牌列表的收藏状态
        selectIllustrator(state.currentIllustrator.id, state.currentIllustrator.name).catch(() => {})
      }
    } else {
      state.currentUser = null
      if (state.currentTab === 'mine') {
        loadMineCards()
      } else if (state.currentIllustrator) {
        // 登出后立即清除当前画师卡牌列表的收藏标记
        selectIllustrator(state.currentIllustrator.id, state.currentIllustrator.name).catch(() => {})
      }
    }
  })
  // 首屏：恢复最近浏览的画师
  const view = loadView()
  if (view) {
    state.currentFilter = view.filter || 'all'
    state.currentGame = view.game || 'all'
    selectIllustrator(view.id, view.name).catch(() => {})
  }
}

export function useAppStore() {
  return {
    state: readonly(state),
    // 工具
    showToast, fmtMoney: () => fmtMoney,
    getPrice, setPrice,
    syncPricesToCloud,
    mineSpentTotal,
    loadProfile, saveProfile,
    // 数据
    loadIllustrators, selectIllustrator, backToList, setFilter, setGame, switchTab,
    toggleCollection, clearAll, exportBackup, importBackup,
    loadMineCards, openCollection, closeCollection, loadCollectedTotal,
    openBg, closeBg, setBg, setAccent,
    // auth
    openAuth, closeAuth, setAuthMode, doAuth, logout, initSession,
    // 弹层
    openCardModal, closeCardModal, openLightbox, closeLightbox
  }
}

export { state }