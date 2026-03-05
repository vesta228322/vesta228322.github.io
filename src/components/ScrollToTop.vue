<template>
  <Transition name="fade">
    <button
      v-show="isVisible"
      class="scroll-to-top"
      @click="scrollToTop"
      aria-label="Наверх"
      title="Наверх"
    >
      <ArrowUp :size="24" />
    </button>
  </Transition>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { ArrowUp } from 'lucide-vue-next'

const isVisible = ref(false)

const checkScroll = () => {
  isVisible.value = window.scrollY > 400
}

const scrollToTop = () => {
  window.scrollTo({
    top: 0,
    behavior: 'smooth'
  })
}

onMounted(() => {
  window.addEventListener('scroll', checkScroll, { passive: true })
})

onUnmounted(() => {
  window.removeEventListener('scroll', checkScroll)
})
</script>

<style scoped>
.scroll-to-top {
  position: fixed;
  bottom: 2rem;
  right: 2rem;
  width: 50px;
  height: 50px;
  border-radius: 50%;
  background: var(--accent);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 16px var(--accent-glow);
  z-index: 99;
  transition: transform 0.2s ease, background 0.2s ease, box-shadow 0.2s ease;
  cursor: pointer;
}

@media (hover: hover) {
  .scroll-to-top:hover {
    transform: translateY(-4px);
    background: var(--accent-2);
    box-shadow: 0 8px 24px rgba(0, 212, 255, 0.4);
  }
}

@media (max-width: 768px) {
  .scroll-to-top {
    bottom: 1.5rem;
    right: 1.5rem;
    width: 44px;
    height: 44px;
  }
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease, transform 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: translateY(20px);
}
</style>
