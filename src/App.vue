<template>
  <NavBar @random="goRandom" />
  <main class="main-layout">
    <RouterView />
  </main>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import NavBar from '@/components/NavBar.vue'
import { getKPTop } from '@/api/kp'

const router = useRouter()
const randomLoading = ref(false)

const goRandom = async () => {
  if (randomLoading.value) return
  randomLoading.value = true
  try {
    const page = Math.floor(Math.random() * 5) + 1
    const films = await getKPTop(page)
    const filtered = films.filter((f) => f.posterUrl)
    if (filtered.length) {
      const movie = filtered[Math.floor(Math.random() * filtered.length)]
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
.main-layout {
  min-height: 100vh;
  padding-top: var(--nav-height);
  /* отступ снизу для мобильной панели навигации */
  padding-bottom: 0;
}

@media (max-width: 768px) {
  .main-layout {
    padding-bottom: 60px;
  }
}
</style>
