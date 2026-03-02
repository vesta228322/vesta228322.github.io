<template>
  <div class="top-page">
    <div class="container">
      <div class="page-header fade-in">
        <h1 class="section-title">
          Популярное <Flame :size="24" style="display: inline-block; vertical-align: middle; margin-top: -4px;" />
        </h1>
        <p class="page-sub">Самые популярные фильмы прямо сейчас</p>
      </div>

      <div class="controls fade-in">
        <button
          v-for="t in tabs"
          :key="t.id"
          class="tab-btn"
          :class="{ active: activeTab === t.id }"
          @click="switchTab(t.id)"
        >
          <component :is="t.icon" :size="16" />
          {{ t.label }}
        </button>
      </div>

      <div v-if="loading" class="movies-grid">
        <div v-for="i in 20" :key="i" class="skeleton card-skeleton"></div>
      </div>

      <div v-else-if="movies.length" class="movies-grid fade-in">
        <MovieCard v-for="m in movies" :key="m.id" :movie="m" />
      </div>

      <div v-if="!loading && totalPages > 1" class="pagination">
        <button class="page-btn" :disabled="page <= 1" @click="changePage(page - 1)">← Назад</button>
        <span class="page-info">{{ page }} / {{ totalPages }}</span>
        <button class="page-btn" :disabled="page >= totalPages" @click="changePage(page + 1)">Вперёд →</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, markRaw } from 'vue'
import { Flame, Star, Tv } from 'lucide-vue-next'
import MovieCard from '@/components/MovieCard.vue'
import { getKPTop } from '@/api/kp'
import axios from 'axios'

const API_KEY = import.meta.env.VITE_KP_KEY || ''

const tabs = [
  { id: 'popular', label: 'Популярные', icon: markRaw(Flame) },
  { id: 'top250', label: 'Топ 250', icon: markRaw(Star) },
  { id: 'series', label: 'Сериалы', icon: markRaw(Tv) },
]

const activeTab = ref('popular')
const movies = ref([])
const loading = ref(false)
const page = ref(1)
const totalPages = ref(1)

const tabCollectionMap = {
  popular: 'TOP_POPULAR_ALL',
  top250: 'TOP_250_MOVIES',
  series: 'POPULAR_SERIES',
}

const kp = axios.create({
  baseURL: 'https://kinopoiskapiunofficial.tech/api',
  headers: { 'X-API-KEY': API_KEY },
})

const normalizeKP = (film) => ({
  id: film.kinopoiskId || film.filmId,
  title: film.nameRu || film.nameEn || film.nameOriginal || 'Без названия',
  name: film.nameRu,
  posterUrl: film.posterUrlPreview || film.posterUrl || null,
  poster_path: null,
  vote_average: film.ratingKinopoisk || film.rating ? parseFloat(film.ratingKinopoisk || film.rating) : null,
  release_date: film.year ? `${film.year}-01-01` : null,
})

const load = async () => {
  loading.value = true
  movies.value = []
  try {
    const collection = tabCollectionMap[activeTab.value]
    const { data } = await kp.get('/v2.2/films/collections', {
      params: { type: collection, page: page.value },
    })
    movies.value = (data.items || []).map(normalizeKP)
    totalPages.value = data.totalPages || 1
  } catch (e) {
    console.error(e)
  } finally {
    loading.value = false
  }
}

const switchTab = (id) => {
  activeTab.value = id
  page.value = 1
  load()
}

const changePage = (p) => {
  page.value = p
  load()
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

onMounted(load)
</script>

<style scoped>
.top-page {
  padding: 2.5rem 0 4rem;
}

.page-header {
  margin-bottom: 1.5rem;
}

.page-sub {
  color: var(--text-muted);
  font-size: 0.95rem;
  margin-top: 0.25rem;
}

.controls {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 2rem;
  flex-wrap: wrap;
}

.tab-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: var(--bg-card);
  border: 1px solid var(--border);
  color: var(--text-secondary);
  padding: 0.5rem 1.2rem;
  border-radius: var(--radius-xl);
  font-family: inherit;
  font-size: 0.9rem;
  font-weight: 700;
  cursor: pointer;
  transition: all var(--transition);
}

.tab-btn.active,
.tab-btn:hover {
  background: linear-gradient(135deg, var(--accent), var(--accent-2));
  border-color: transparent;
  color: #fff;
  box-shadow: 0 4px 16px var(--accent-glow);
}

.movies-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
  gap: 1.5rem;
}

.card-skeleton {
  aspect-ratio: 2 / 3;
  border-radius: var(--radius-md);
}

.pagination {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1.5rem;
  margin-top: 3rem;
}

.page-btn {
  background: var(--bg-card);
  border: 1px solid var(--border);
  color: var(--text-primary);
  padding: 0.6rem 1.4rem;
  border-radius: var(--radius-xl);
  font-family: inherit;
  font-weight: 700;
  transition: all var(--transition);
}

.page-btn:hover:not(:disabled) {
  border-color: var(--accent);
  background: var(--bg-secondary);
}

.page-btn:disabled {
  opacity: 0.4;
  cursor: default;
}

.page-info {
  color: var(--text-secondary);
  font-weight: 700;
  min-width: 80px;
  text-align: center;
}

@media (max-width: 768px) {
  .movies-grid {
    grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
    gap: 1rem;
  }
}

@media (max-width: 480px) {
  .movies-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 0.75rem;
  }
}
</style>
