// 全局注册卡名翻译数据表（原 names_*.js，内容不变）
import './names_cn.js'
import './names_ja.js'
import './names_adj.js'
import './names_tcg.js'

// 地区形态
const FORM_CN = {
  Alolan: '阿罗拉', Galarian: '伽勒尔', Hisuian: '洗翠',
  Paldean: '帕底亚', Kantonian: '关都'
}
const FORM_JA = {
  Alolan: 'アローラ', Galarian: 'ガラル', Hisuian: 'ヒスイ',
  Paldean: 'パルデア', Kantonian: 'カントー'
}

// 能量/招式学习器的元素属性
const ELEMENT_CN = { Grass: '草', Fire: '火', Water: '水', Lightning: '雷', Psychic: '超', Fighting: '格斗', Darkness: '恶', Metal: '钢', Fairy: '妖', Colorless: '无色', Ice: '冰', Rock: '岩', Steel: '钢', Dragon: '龙' }
const ELEMENT_JA = { Grass: 'くさ', Fire: 'ほのお', Water: 'みず', Lightning: 'でんき', Psychic: 'エスパー', Fighting: 'かくとう', Darkness: 'あく', Metal: 'はがね', Fairy: 'フェアリー', Colorless: 'ノーマル', Ice: 'こおり', Rock: 'いわ', Steel: 'はがね', Dragon: 'ドラゴン' }

// 招式学习器：<招式名>
const TM_CN = { Evolution: '进化', Devolution: '退化', 'Turbo Energize': '涡轮充能', 'Crisis Punch': '危机冲击', Blindside: '暗算', Fluorite: '萤石' }
const TM_JA = { Evolution: '進化', Devolution: '退化', 'Turbo Energize': 'エナジーターボ', 'Crisis Punch': 'かじばのいっぱつ', Blindside: 'やみうち', Fluorite: 'フローライト' }

// 技术机/队伍的 前缀
const TMH_CN = { Multi: '多变', 'Team Aqua': '海洋队', 'Team Magma': '熔岩队', 'Team Galactic': '银河队', Rocket: '火箭队' }
const TMH_JA = { Multi: 'マルチ', 'Team Aqua': 'アクア団', 'Team Magma': 'マグマ団', 'Team Galactic': 'ギンガ団', Rocket: 'ロケット団' }

function tmWho(name, isCN) {
  const map = isCN ? TMH_CN : TMH_JA
  if (map[name]) return map[name]
  return isCN ? cn(name) : ja(name)
}

function decodeEntities(str) {
  if (!str) return ''
  const t = document.createElement('textarea')
  t.innerHTML = str
  return t.value
}

export function cn(name) {
  if (!name) return ''
  const d = decodeEntities(name)
  if (window.CN && CN[d]) return CN[d]
  if (window.TCG_CN && TCG_CN[d]) return TCG_CN[d]
  if (d.indexOf(' & ') > 0) {
    const parts = d.split(' & ')
    const l = cn(parts[0]), r = cn(parts[1])
    if (l && r && l !== parts[0] && r !== parts[1]) return l + '与' + r
  }
  let sp = d.match(/^(.+?) Spirit Link$/)
  if (sp) {
    const pk = cn(sp[1])
    return (pk && pk !== sp[1] ? pk : sp[1]) + '心灵联结'
  }
  let tm = d.match(/^Ancient Technical Machine \[([^\]]+)\]$/)
  if (tm) return '古代招式学习器[' + (ELEMENT_CN[tm[1]] || tm[1]) + ']'
  tm = d.match(/^Technical Machine: (.+)$/)
  if (tm) return '招式学习器[' + (TM_CN[tm[1]] || tm[1]) + ']'
  tm = d.match(/^(.+?)'s Invention G-107 Technical Machine$/)
  if (tm) return tmWho(tm[1], true) + '的发明G-107招式学习器'
  tm = d.match(/^(.+?)'s Technical Machine(?: (\d+))?$/)
  if (tm) return tmWho(tm[1], true) + '的招式学习器' + (tm[2] || '')
  tm = d.match(/^(.+) Technical Machine(?: (\d+))?$/)
  if (tm) return tmWho(tm[1], true) + '的招式学习器' + (tm[2] || '')
  const w = d.split(' ')
  for (let i = w.length; i >= 1; i--) {
    const pre = w.slice(0, i).join(' ')
    if (window.ADJ_CN && ADJ_CN[pre]) {
      const base = w.slice(i).join(' ')
      if (!base) return ADJ_CN[pre]
      const bt = cn(base)
      return ADJ_CN[pre] + (bt && bt !== base ? bt : base)
    }
  }
  for (let i = 1; i <= w.length; i++) {
    const base = w.slice(0, i).join(' ')
    const suf = w.slice(i).join(' ')
    if (window.CN && CN[base] && suf && /^(V|VMAX|V MAX|VSTAR|V STAR|V-UNION|EX|ex|GX|G|☆|★|GL|FB|C|M|LV\.X|Lv\. X|\d+)$/i.test(suf)) {
      return CN[base] + ' ' + suf
    }
  }
  const hm = d.match(/^(.+?)(-?(EX|GX))$/i)
  if (hm && window.CN && CN[hm[1]]) return CN[hm[1]] + ' ' + hm[2]
  return d
}

export function ja(name) {
  if (!name) return ''
  const d = decodeEntities(name)
  if (window.JA && JA[d]) return JA[d]
  if (window.TCG_JA && TCG_JA[d]) return TCG_JA[d]
  if (d.indexOf(' & ') > 0) {
    const parts = d.split(' & ')
    const l = ja(parts[0]), r = ja(parts[1])
    if (l && r) return l + '＆' + r
  }
  let sp = d.match(/^(.+?) Spirit Link$/)
  if (sp) {
    const pk = ja(sp[1])
    return (pk ? pk : sp[1]) + 'ソウルリンク'
  }
  let tm = d.match(/^Ancient Technical Machine \[([^\]]+)\]$/)
  if (tm) return '古代のワザマシン[' + (ELEMENT_JA[tm[1]] || tm[1]) + ']'
  tm = d.match(/^Technical Machine: (.+)$/)
  if (tm) return 'ワザマシン[' + (TM_JA[tm[1]] || tm[1]) + ']'
  tm = d.match(/^(.+?)'s Invention G-107 Technical Machine$/)
  if (tm) return tmWho(tm[1], false) + 'の発明G-107ワザマシン'
  tm = d.match(/^(.+?)'s Technical Machine(?: (\d+))?$/)
  if (tm) return tmWho(tm[1], false) + 'のワザマシン' + (tm[2] || '')
  tm = d.match(/^(.+) Technical Machine(?: (\d+))?$/)
  if (tm) return tmWho(tm[1], false) + 'のワザマシン' + (tm[2] || '')
  const w = d.split(' ')
  for (let i = w.length; i >= 1; i--) {
    const pre = w.slice(0, i).join(' ')
    if (window.ADJ_JA && ADJ_JA[pre]) {
      const base = w.slice(i).join(' ')
      if (!base) return ADJ_JA[pre]
      const bt = ja(base)
      return ADJ_JA[pre] + (bt ? bt : base)
    }
  }
  for (let i = 1; i <= w.length; i++) {
    const base = w.slice(0, i).join(' ')
    const suf = w.slice(i).join(' ')
    if (window.JA && JA[base] && suf && /^(V|VMAX|V MAX|VSTAR|V STAR|V-UNION|EX|ex|GX|G|☆|★|GL|FB|C|M|LV\.X|Lv\. X|\d+)$/i.test(suf)) {
      return JA[base] + ' ' + suf
    }
  }
  const hm = d.match(/^(.+?)(-?(EX|GX))$/i)
  if (hm && window.JA && JA[hm[1]]) return JA[hm[1]] + ' ' + hm[2]
  return ''
}

export function escHtml(str) {
  if (!str) return ''
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

export function fmtMoney(n) {
  return (Math.round(n * 100) / 100).toLocaleString('zh-CN')
}

// 供 FORM 表引用（当前保留出口，后续可扩展）
// Pokémon TCG Pocket 专属扩展包白名单（对照 artofpkm.com 分组逻辑，与官方收录张数核对）
const POCKET_SETS = [
  'Promo-A', 'Genetic Apex', 'Mythical Island', 'Space-Time Smackdown', 'Triumphant Light',
  'Shining Revelry', 'Celestial Guardians', 'Extradimensional Crisis', 'Eevee Grove',
  'Wisdom of Sea and Sky', 'Secluded Springs', 'Deluxe Pack: ex', 'Promo-B', 'Mega Rising',
  'Crimson Blaze', 'Fantastical Parade', 'Paldean Wonders', 'Mega Shine', 'Pulsing Aura',
  'Paradox Drive', 'Everyday Wonders', 'Ruler of the Skies', "Team Rocket's Ambition"
]
const pocketSetLC = new Set(POCKET_SETS.map((x) => x.toLowerCase()))

// 依据卡组(set) 归属判定游戏类别：'pocket' | 'tcg'
export function cardGame(card) {
  const set = ((card && card.set_name) || '').trim().toLowerCase()
  return pocketSetLC.has(set) ? 'pocket' : 'tcg'
}

export { FORM_CN, FORM_JA }