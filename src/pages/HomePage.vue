<template>
  <main class="home">
    <!-- Центральный блок -->
    <div class="search-hero" :class="{ compact: history.length > 0 || searched }">
      <div class="brand">
        <span class="brand-icon">▶</span>
        <h1 class="brand-name">Kino<span class="gradient-text">Flow</span></h1>
      </div>
      <p class="brand-sub">Смотри фильмы и сериалы онлайн</p>

      <!-- Табы типа поиска -->
      <nav class="search-tabs">
        <button
          class="search-tab"
          :class="{ active: searchType === 'title' }"
          @click="setType('title')"
        >Название</button>
        <button
          class="search-tab"
          :class="{ active: searchType === 'kinopoisk' }"
          @click="setType('kinopoisk')"
        >ID Кинопоиск</button>
        <button class="random-btn" :disabled="randomLoading" @click="goRandom">
          <span>🎲</span>
          {{ randomLoading ? 'Подбираем...' : 'Случайный' }}
        </button>
      </nav>

      <!-- Поисковая строка -->
      <div class="search-box" :class="{ focused }">
        <span class="search-ico" aria-hidden="true">⌕</span>
        <input
          ref="inputRef"
          v-model="query"
          :placeholder="placeholder"
          :inputmode="searchType === 'kinopoisk' ? 'numeric' : 'text'"
          @focus="focused = true"
          @blur="focused = false"
          @keydown.enter="handleEnter"
          @input="handleInput"
          aria-label="Поиск фильмов"
        />
        <button v-if="query" class="clear-btn" @click="clearSearch" aria-label="Очистить поиск">✕</button>
      </div>
    </div>

    <div class="content-area container">
      <!-- Загрузка -->
      <div v-if="loading" class="movies-grid">
        <div v-for="i in 12" :key="i" class="skeleton card-skeleton"></div>
      </div>

      <!-- Результаты поиска -->
      <template v-else-if="searched">
        <h2 class="section-title" v-if="movies.length">
          Результаты поиска <span>🔍</span>
        </h2>
        <div v-if="movies.length" class="movies-grid fade-in">
          <MovieCard v-for="m in movies" :key="m.id" :movie="m" />
        </div>
        <div v-else class="empty-state fade-in">
          <span>🎬</span>
          <p>Ничего не найдено. Попробуй другое название.</p>
        </div>
      </template>

      <!-- История просмотра -->
      <template v-else>
        <div v-if="history.length" class="section fade-in">
          <div class="section-header">
            <h2 class="section-title">История просмотра <span>🕐</span></h2>
            <button class="clear-history-btn" @click="clearHistory">Очистить всё</button>
          </div>
          <!-- Карточки истории с кнопкой удаления -->
          <div class="history-grid">
            <div
              v-for="m in history"
              :key="m.id"
              class="history-card-wrap"
            >
              <MovieCard :movie="m" />
              <!-- Кнопка удаления появляется при наведении -->
              <button
                class="delete-card-btn"
                title="Удалить из истории"
                @click.prevent.stop="deleteFromHistory(m.id)"
              >🗑</button>
            </div>
          </div>
        </div>
        <div v-else class="empty-history fade-in">
          <span>🎬</span>
          <p>Твоя история просмотров появится здесь</p>
          <p class="hint">Начни поиск фильма выше</p>
        </div>
      </template>
    </div>
  </main>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import MovieCard from '@/components/MovieCard.vue'
import { searchKP, getKPTop } from '@/api/kp'

const router = useRouter()
const route = useRoute()

const searchType = ref('title')
const query = ref('')
const movies = ref([])
const loading = ref(false)
const searched = ref(false)
const focused = ref(false)
const randomLoading = ref(false)
const history = ref([])
const inputRef = ref(null)

const placeholder = computed(() =>
  searchType.value === 'kinopoisk'
    ? 'Пример: 301, 435'
    : 'Введите название фильма...'
)

const loadHistory = () => {
  try {
    history.value = JSON.parse(localStorage.getItem('kf_history') || '[]')
  } catch {
    history.value = []
  }
}

const clearHistory = () => {
  localStorage.removeItem('kf_history')
  history.value = []
}

const deleteFromHistory = (id) => {
  history.value = history.value.filter((m) => String(m.id) !== String(id))
  localStorage.setItem('kf_history', JSON.stringify(history.value))
}

const setType = (type) => {
  searchType.value = type
  query.value = ''
  movies.value = []
  searched.value = false
  inputRef.value?.focus()
}

let debounceTimer = null
const handleInput = () => {
  if (searchType.value === 'kinopoisk') {
    query.value = query.value.replace(/\D/g, '')
    return
  }
  clearTimeout(debounceTimer)
  if (query.value.trim().length >= 2) {
    debounceTimer = setTimeout(() => performSearch(), 700)
  } else if (!query.value.trim()) {
    movies.value = []
    searched.value = false
  }
}

const handleEnter = () => {
  clearTimeout(debounceTimer)
  if (searchType.value === 'kinopoisk') {
    if (query.value.trim()) router.push(`/movie/${query.value.trim()}`)
  } else {
    performSearch()
  }
}

const performSearch = async () => {
  if (!query.value.trim()) return
  loading.value = true
  searched.value = true
  movies.value = []
  try {
    const data = await searchKP(query.value.trim())
    movies.value = data.results
  } catch (e) {
    console.error('Ошибка поиска:', e)
  } finally {
    loading.value = false
  }
}

const clearSearch = () => {
  query.value = ''
  movies.value = []
  searched.value = false
  clearTimeout(debounceTimer)
  inputRef.value?.focus()
}

const goRandom = async () => {
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

onMounted(() => {
  loadHistory()
  inputRef.value?.focus()
})

// Перезагружаем историю при каждом возврате на главную
watch(
  () => route.path,
  (path) => {
    if (path === '/' || path === '/kinoflow/' || path === '/kinoflow') {
      loadHistory()
    }
  }
)
</script>

<style scoped>
.home {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

/* ---- Герой-поиск ---- */
.search-hero {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 4rem 1.5rem 2.5rem;
  text-align: center;
  transition: all var(--transition);
}

.brand {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  font-size: 2.8rem;
  font-weight: 900;
  letter-spacing: -2px;
  margin-bottom: 0.4rem;
  transition: all var(--transition);
}

.brand-icon {
  color: var(--accent);
  filter: drop-shadow(0 0 12px var(--accent));
  font-size: 2.2rem;
}

.brand-sub {
  color: var(--text-muted);
  font-size: 1rem;
  margin-bottom: 2rem;
  transition: all var(--transition);
}

/* Компактный режим при наличии истории или поиске */
.search-hero.compact {
  padding: 2rem 1.5rem 1.3rem;
}
.search-hero.compact .brand {
  font-size: 1.8rem;
  margin-bottom: 0.2rem;
}
.search-hero.compact .brand-icon {
  font-size: 1.4rem;
}
.search-hero.compact .brand-sub {
  font-size: 0.9rem;
  margin-bottom: 1.25rem;
}

.search-tabs {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 1.5rem;
  width: 100%;
  max-width: 780px;
  overflow-x: auto;
  padding: 0 10px 10px;
  scrollbar-width: none;
  -webkit-overflow-scrolling: touch;
}
.search-tabs::-webkit-scrollbar { display: none; }

.search-tab {
  flex-shrink: 0;
  white-space: nowrap;
  background: var(--bg-card);
  border: 1px solid var(--border);
  color: var(--text-muted);
  font-family: inherit;
  font-size: 0.88rem;
  font-weight: 700;
  padding: 0.6rem 1.2rem;
  border-radius: var(--radius-xl);
  cursor: pointer;
  transition: all var(--transition);
}

.search-tab.active {
  background: var(--accent);
  border-color: var(--accent);
  color: #fff;
  box-shadow: 0 4px 12px var(--accent-glow);
}

.random-btn {
  flex-shrink: 0;
  white-space: nowrap;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: var(--bg-card);
  border: 1px solid var(--border);
  color: var(--text-primary);
  padding: 0.6rem 1.2rem;
  border-radius: var(--radius-xl);
  font-family: inherit;
  font-size: 0.88rem;
  font-weight: 700;
  cursor: pointer;
  transition: all var(--transition);
}

.random-btn:hover:not(:disabled) {
  border-color: var(--accent-2);
  color: var(--accent-2);
}

.search-box {
  display: flex;
  align-items: center;
  width: 100%;
  max-width: 780px;
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: var(--radius-xl);
  padding: 0 1.2rem;
  gap: 0.75rem;
  transition: border-color var(--transition), box-shadow var(--transition);
}

.search-box.focused {
  border-color: var(--accent);
  box-shadow: 0 0 24px var(--accent-glow);
}

.search-ico { font-size: 1.3rem; color: var(--text-muted); user-select: none; flex-shrink: 0; }

.search-box input {
  flex: 1;
  background: none;
  border: none;
  outline: none;
  color: var(--text-primary);
  font-family: inherit;
  font-size: 1rem;
  padding: 0.9rem 0;
}

/* ---- Контент ---- */
.content-area { flex: 1; padding: 0 1.5rem 5rem; }

.section { display: flex; flex-direction: column; gap: 1.25rem; }

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.clear-history-btn {
  font-size: 0.82rem;
  font-weight: 700;
  color: var(--text-muted);
  background: none;
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  padding: 0.3rem 0.8rem;
  cursor: pointer;
  font-family: inherit;
  transition: color var(--transition), border-color var(--transition);
}
.clear-history-btn:hover { color: var(--text-primary); border-color: var(--border-hover); }

/* ---- Обычные результаты ---- */
.movies-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: var(--gap);
}

/* ---- История — большие карточки с кнопкой удаления ---- */
.history-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 1.5rem;
}

.history-card-wrap {
  position: relative;
}

/* Кнопка удаления — появляется при наведении на обёртку */
.delete-card-btn {
  position: absolute;
  top: 8px;
  right: 8px;
  z-index: 10;
  width: 32px;
  height: 32px;
  background: rgba(10, 10, 20, 0.8);
  backdrop-filter: blur(6px);
  border: 1px solid rgba(239, 68, 68, 0.4);
  border-radius: 8px;
  color: #ef4444;
  font-size: 0.9rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transform: scale(0.8);
  transition: opacity 0.2s ease, transform 0.2s ease, background 0.2s ease;
}

.history-card-wrap:hover .delete-card-btn {
  opacity: 1;
  transform: scale(1);
}

.delete-card-btn:hover {
  background: rgba(239, 68, 68, 0.85);
  border-color: #ef4444;
  color: #fff;
}

.card-skeleton { aspect-ratio: 2 / 3; border-radius: var(--radius-md); }

.empty-state,
.empty-history {
  text-align: center;
  padding: 4rem 0;
  color: var(--text-muted);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.75rem;
}

.empty-state span, .empty-history span { font-size: 4rem; }
.empty-state p, .empty-history p { font-size: 1.05rem; font-weight: 600; }
.hint { font-size: 0.88rem !important; font-weight: 400 !important; }

@media (max-width: 768px) {
  .search-hero { padding: 3rem 1rem 2rem; }
  .brand { font-size: 2.2rem; }
  .search-tabs { justify-content: flex-start; }
  .history-grid { grid-template-columns: repeat(auto-fill, minmax(140px, 1fr)); gap: 1rem; }
  .movies-grid { grid-template-columns: repeat(auto-fill, minmax(140px, 1fr)); gap: 1rem; }
}

@media (max-width: 480px) {
  .history-grid { grid-template-columns: repeat(2, 1fr); gap: 0.75rem; }
  .movies-grid { grid-template-columns: repeat(2, 1fr); gap: 0.75rem; }
}
</style>
