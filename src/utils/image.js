// 缩略图代理：把 artofpkm CDN 原图（~430KB WebP）压缩为指定宽度，降低列表加载流量
const PROXY = 'https://wsrv.nl/?url='

export function thumbUrl(url, width = 300) {
  if (!url) return ''
  return `${PROXY}${encodeURIComponent(url)}&w=${width}&output=webp`
}