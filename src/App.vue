<template>
  <NavBar @random="goRandom" />
  <main class="main-layout">
    <RouterView />
  </main>

  <!-- Модалка рекомендации блокировщика -->
  <AdBlockModal v-model="showAdBlock" />

  <!-- Кнопка наверх -->
  <ScrollToTop />

  <!-- Баннер саппортеров -->
  <SupportersBanner />
</template>

<script setup>
import { ref, onMounted, provide } from 'vue'
import { useRouter } from 'vue-router'
import NavBar from '@/components/NavBar.vue'
import AdBlockModal from '@/components/AdBlockModal.vue'
import ScrollToTop from '@/components/ScrollToTop.vue'
import SupportersBanner from '@/components/SupportersBanner.vue'
import { getRandomKPFilm } from '@/api/kp'

const router = useRouter()
const randomLoading = ref(false)
const showAdBlock = ref(false)

// Предоставляем метод открытия модалки глобально
const openAdBlockModal = () => {
  showAdBlock.value = true
}
provide('openAdBlockModal', openAdBlockModal)

const goRandom = async () => {
  if (randomLoading.value) return
  randomLoading.value = true
  try {
    const movie = await getRandomKPFilm()
    if (movie) {
      router.push(`/movie/${movie.id}`)
    }
  } catch (e) {
    console.error(e)
  } finally {
    randomLoading.value = false
  }
}
</script>

<style>
:root {
  --banner-height: 70px;
}

.main-layout {
  min-height: 100vh;
  padding-top: var(--nav-height);
  padding-bottom: var(--banner-height);
}

@media (max-width: 768px) {
  .main-layout {
    /* 64px (bottom-nav) + ~70px (banner on mobile) */
    padding-bottom: 140px;
  }
}
</style>
