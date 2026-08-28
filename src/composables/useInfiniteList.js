import { ref, computed, watch, onMounted, onUnmounted } from 'vue'

// 渐进式加载：大列表默认只渲染前 N 项，滚动到底追加。
// 当传入 onReachBottom 回调时切换为「网络分批」模式——列表数据本身由外部增量拉取，
// 触底时触发回调，visible 直接跟随 source（不再本地切片）。
const DEFAULT_PAGE = 60
const OVERSHOOT = 500 // 距底部提前触发的像素

export function useInfiniteList(source, options) {
  let pageSize = DEFAULT_PAGE
  let onReachBottom = null
  if (typeof options === 'function') {
    onReachBottom = options
  } else if (options) {
    pageSize = options.pageSize || DEFAULT_PAGE
    onReachBottom = options.onReachBottom || null
  }

  const slice = ref(pageSize)
  const visible = computed(() => onReachBottom ? source.value : source.value.slice(0, slice.value))
  const hasMore = computed(() => onReachBottom ? null : slice.value < source.value.length)

  // 数据源整体替换（换画师 / 切换筛选 / 搜索）时回到第一批
  watch(source, () => { if (!onReachBottom) slice.value = pageSize })

  function onScroll() {
    const doc = document.documentElement
    if (window.innerHeight + doc.scrollTop >= doc.scrollHeight - OVERSHOOT) {
      if (onReachBottom) onReachBottom()
      else if (hasMore.value) slice.value = Math.min(source.value.length, slice.value + pageSize)
    }
  }
  onMounted(() => window.addEventListener('scroll', onScroll, { passive: true }))
  onUnmounted(() => window.removeEventListener('scroll', onScroll))

  return { visible, hasMore }
}