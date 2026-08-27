<script setup>
import { ref, onMounted, onUnmounted } from 'vue'

const show = ref(false)

function onScroll() {
  show.value = (window.scrollY || document.documentElement.scrollTop) > 300
}
function toTop() {
  window.scrollTo({ top: 0, behavior: 'smooth' })
}
onMounted(() => window.addEventListener('scroll', onScroll, { passive: true }))
onUnmounted(() => window.removeEventListener('scroll', onScroll))
</script>

<template>
  <transition name="btt">
    <button v-if="show" class="back-to-top" title="回到顶部" @click="toTop">
      <svg viewBox="0 0 24 24" width="22" height="22"><path fill="currentColor" d="M12 5l-7 7h4v6h6v-6h4z"/></svg>
    </button>
  </transition>
</template>

<style scoped>
.back-to-top{
  position:fixed;right:14px;bottom:88px;z-index:130;
  width:44px;height:44px;border-radius:50%;border:1px solid var(--border);
  background:var(--card-bg);color:var(--text-dim);
  display:flex;align-items:center;justify-content:center;
  box-shadow:0 4px 16px rgba(0,0,0,.4);cursor:pointer;
}
.btt-enter-active,.btt-leave-active{transition:opacity .2s,transform .2s}
.btt-enter-from,.btt-leave-to{opacity:0;transform:translateY(10px)}
</style>