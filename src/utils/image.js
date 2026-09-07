// 缩略图代理：把 artofpkm CDN 原图（~430KB WebP）压缩为指定宽度，降低列表加载流量
const PROXY = 'https://wsrv.nl/?url='

// 按天更新的指纹，避免固定 URL 让坏缓存/旧缓存长期卡死；同一天内 URL 保持稳定不抖动
function dayStamp() {
  const d = new Date()
  return `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`
}

export function thumbUrl(url, width = 300) {
  if (!url) return ''
  return `${PROXY}${encodeURIComponent(url)}&w=${width}&output=webp&_v=${dayStamp()}`
}