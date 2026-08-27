import { ref, computed, watch, onMounted, onUnmounted } from 'vue'

// 渐进式分页渲染：大列表只渲染前 N 项，滚动到底追加一批。
// 相比不定高虚拟滚动，对 grid 列表更稳、无跳动，同时显著降低首屏 DOM 与图片并发。
const DEFAULT_PAGE = 60
const OVERSHOOT = 500 // 距底部提前触发的像素

export function useInfiniteList(source, pageSize = DEFAULT_PAGE) {
  const slice = ref(pageSize)
  const visible = computed(() => source.value.slice(0, slice.value))
  const hasMore = computed(() => slice.value < source.value.length)

  // 数据源变化（换画师 / 切换筛选 / 搜索）时回到第一批
  watch(source, () => { slice.value = pageSize })

  function onScroll() {
    if (!hasMore.value) return
    const doc = document.documentElement
    if (window.innerHeight + doc.scrollTop >= doc.scrollHeight - OVERSHOOT) {
      slice.value = Math.min(source.value.length, slice.value + pageSize)
    }
  }
  onMounted(() => window.addEventListener('scroll', onScroll, { passive: true }))
  onUnmounted(() => window.removeEventListener('scroll', onScroll))

  return { visible, hasMore }
}