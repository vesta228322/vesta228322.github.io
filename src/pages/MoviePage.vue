<template>
  <div class="movie-page" v-if="movie">
    <!-- Фоновый постер -->
    <div class="backdrop" :style="backdropStyle"></div>
    <div class="backdrop-overlay"></div>

    <div class="container movie-layout fade-in">
      <!-- ПОСТЕР -->
      <aside class="sidebar">
        <div class="poster-box">
          <img v-if="posterUrl" :src="posterUrl" :alt="movie.nameRu || movie.nameEn" />
          <div v-else class="no-poster-big">🎬</div>
        </div>
        <div class="score-box">
          <div v-if="alloha?.rating_kp" class="score-row">
            <span class="score-label">Кинопоиск</span>
            <span class="score-num kp">{{ Number(alloha.rating_kp).toFixed(1) }}</span>
          </div>
          <div v-else-if="movie.ratingKinopoisk" class="score-row">
            <span class="score-label">Кинопоиск</span>
            <span class="score-num kp">{{ movie.ratingKinopoisk.toFixed(1) }}</span>
          </div>
          <div v-if="alloha?.rating_imdb || movie.ratingImdb" class="score-row">
            <span class="score-label">IMDb</span>
            <span class="score-num imdb">{{ (alloha?.rating_imdb || movie.ratingImdb).toFixed(1) }}</span>
          </div>
          <span v-if="movie.ratingKinopoiskVoteCount" class="score-votes">
            {{ movie.ratingKinopoiskVoteCount.toLocaleString() }} голосов
          </span>
        </div>
      </aside>

      <!-- ИНФОРМАЦИЯ -->
      <main class="movie-details">
        <div class="movie-header">
          <div class="badges">
            <span
              v-for="g in movie.genres?.slice(0, 3)"
              :key="g.genre"
              class="genre-badge"
            >{{ g.genre }}</span>
            <span v-if="movie.ratingAgeLimits" class="age-badge">
              {{ movie.ratingAgeLimits.replace('age', '') }}+
            </span>
          </div>
          <h1 class="movie-title">{{ movie.nameRu || movie.nameEn || movie.nameOriginal }}</h1>
          <p class="original-title" v-if="movie.nameOriginal && movie.nameOriginal !== movie.nameRu">
            {{ movie.nameOriginal }}
          </p>

          <div class="movie-meta">
            <span v-if="movie.year">📅 {{ movie.year }}</span>
            <span v-if="movie.filmLength">⏱ {{ movie.filmLength }}</span>
            <span v-if="movie.countries?.[0]">🌍 {{ movie.countries[0].country }}</span>
            <span v-if="alloha?.quality" class="quality-badge">{{ alloha.quality }}</span>
          </div>

          <p class="movie-overview">
            {{ movie.description || alloha?.description || 'Описание отсутствует.' }}
          </p>

          <p class="movie-slogan" v-if="movie.slogan">«{{ movie.slogan }}»</p>
        </div>

        <!-- Плеер -->
        <div class="player-section">
          <h2 class="section-title">Плеер <span>▶</span></h2>

          <!-- Загрузка -->
          <div v-if="allohaLoading" class="player-placeholder">
            <div class="spinner"></div>
            <p>Загружаем плеер...</p>
          </div>

          <!-- Выбор озвучки -->
          <template v-else-if="translations.length">
            <div class="player-tabs">
              <button
                v-for="t in translations"
                :key="t.id"
                class="player-tab"
                :class="{ active: activeTranslation === t.id }"
                @click="activeTranslation = t.id"
              >
                {{ t.name }}
                <span v-if="t.uhd" class="uhd-badge">4K</span>
              </button>
            </div>

            <div class="player-wrap">
              <iframe
                :src="activeIframe"
                frameborder="0"
                allowfullscreen
                allow="autoplay; fullscreen"
              ></iframe>
            </div>
          </template>

          <!-- Плеер без вкладок озвучек -->
          <template v-else-if="alloha?.iframe">
            <div class="player-wrap">
              <iframe
                :src="alloha.iframe"
                frameborder="0"
                allowfullscreen
                allow="autoplay; fullscreen"
              ></iframe>
            </div>
          </template>

          <!-- Нет плеера -->
          <div v-else class="player-placeholder">
            <div class="placeholder-icon">▶</div>
            <h3>Плеер недоступен</h3>
            <p>Фильм не найден в базе плеера. Попробуй позже.</p>
          </div>

          <!-- Трейлер -->
          <div v-if="alloha?.iframe_trailer && !allohaLoading" class="trailer-section">
            <button class="trailer-btn" @click="showTrailer = !showTrailer">
              {{ showTrailer ? '✕ Закрыть трейлер' : '🎬 Трейлер' }}
            </button>
            <div v-if="showTrailer" class="player-wrap" style="margin-top: 1rem;">
              <iframe
                :src="alloha.iframe_trailer"
                frameborder="0"
                allowfullscreen
                allow="autoplay; fullscreen"
              ></iframe>
            </div>
          </div>
        </div>

        <!-- Актёры -->
        <div class="cast-section" v-if="cast.length">
          <h2 class="section-title">В ролях <span>🎭</span></h2>
          <div class="cast-grid">
            <div v-for="actor in cast" :key="actor.staffId" class="cast-card">
              <div class="cast-photo">
                <img v-if="actor.posterUrl" :src="actor.posterUrl" :alt="actor.nameRu" />
                <span v-else class="cast-no-photo">👤</span>
              </div>
              <div class="cast-info">
                <span class="cast-name">{{ actor.nameRu || actor.nameEn }}</span>
                <span class="cast-char">{{ actor.description }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Похожие -->
        <div class="similar-section" v-if="similar.length">
          <h2 class="section-title">Похожие <span>🎬</span></h2>
          <div class="similar-grid">
            <MovieCard v-for="m in similar" :key="m.id" :movie="m" />
          </div>
        </div>
      </main>
    </div>
  </div>

  <!-- Загрузка -->
  <div v-else class="loading-page">
    <div class="spinner"></div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import MovieCard from '@/components/MovieCard.vue'
import { getKPFilm, getKPStaff, getKPSimilars } from '@/api/kp'
import { getAllohaByKp } from '@/api/alloha'

const route = useRoute()
const movie = ref(null)
const cast = ref([])
const similar = ref([])
const alloha = ref(null)
const allohaLoading = ref(false)
const activeTranslation = ref('')
const showTrailer = ref(false)

// Озвучки из Alloha
const translations = computed(() => {
  if (!alloha.value?.translation_iframe) return []
  return Object.entries(alloha.value.translation_iframe).map(([id, t]) => ({
    id,
    name: t.name,
    iframe: t.iframe,
    quality: t.quality,
    uhd: t.uhd,
  }))
})

const activeIframe = computed(() => {
  if (!activeTranslation.value || !alloha.value) return null
  return alloha.value.translation_iframe?.[activeTranslation.value]?.iframe || null
})

const posterUrl = computed(() => {
  // Приоритет: Alloha постер (kitnopoisk CDN) → KP API постер
  return alloha.value?.poster || movie.value?.posterUrl || null
})

const backdropStyle = computed(() => {
  const url = posterUrl.value
  return url ? { backgroundImage: `url(${url})` } : {}
})

// Сохранение в историю
const saveToHistory = (m, allohaData) => {
  try {
    const stored = JSON.parse(localStorage.getItem('kf_history') || '[]')
    const id = route.params.id
    const filtered = stored.filter((item) => String(item.id) !== String(id))
    const entry = {
      id,
      title: m.nameRu || m.nameEn || m.nameOriginal,
      name: m.nameRu,
      // сохраняем полный URL постера
      posterUrl: allohaData?.poster || m.posterUrl || null,
      poster_path: null,
      vote_average: m.ratingKinopoisk || null,
      release_date: m.year ? `${m.year}-01-01` : null,
    }
    const updated = [entry, ...filtered].slice(0, 20)
    localStorage.setItem('kf_history', JSON.stringify(updated))
  } catch (e) {
    console.error('Ошибка сохранения истории:', e)
  }
}

const load = async (id) => {
  movie.value = null
  alloha.value = null
  cast.value = []
  similar.value = []
  showTrailer.value = false
  activeTranslation.value = ''

  // Загружаем данные о фильме из KP + Alloha параллельно
  allohaLoading.value = true
  try {
    const [kpData, allohaData, staffData, similarsData] = await Promise.allSettled([
      getKPFilm(id),
      getAllohaByKp(id),
      getKPStaff(id),
      getKPSimilars(id),
    ])

    if (kpData.status === 'fulfilled') {
      movie.value = kpData.value
    }

    if (allohaData.status === 'fulfilled') {
      alloha.value = allohaData.value
      // Выбираем дублированную озвучку по умолчанию
      const trans = Object.entries(allohaData.value.translation_iframe || {})
      if (trans.length) {
        const dubbed = trans.find(([, t]) => t.name.toLowerCase().includes('дубл'))
        activeTranslation.value = dubbed ? dubbed[0] : trans[0][0]
      }
    } else {
      console.warn('Alloha:', allohaData.reason?.message)
    }

    if (staffData.status === 'fulfilled') {
      cast.value = staffData.value
    }

    if (similarsData.status === 'fulfilled') {
      similar.value = similarsData.value.slice(0, 6)
    }

    // Сохраняем в историю если данные загрузились
    if (movie.value) {
      saveToHistory(movie.value, alloha.value)
    }
  } catch (e) {
    console.error('Ошибка загрузки фильма:', e)
  } finally {
    allohaLoading.value = false
  }
}

watch(
  () => route.params.id,
  (id) => id && load(id),
)
onMounted(() => load(route.params.id))
</script>

<style scoped>
.movie-page {
  position: relative;
  min-height: 100vh;
  padding: 2.5rem 0 4rem;
}

.backdrop {
  position: fixed;
  inset: 0;
  background-size: cover;
  background-position: center;
  filter: blur(18px) brightness(0.15);
  transform: scale(1.05);
  z-index: 0;
}

.backdrop-overlay {
  position: fixed;
  inset: 0;
  background: linear-gradient(to bottom, transparent 0%, var(--bg-primary) 70%);
  z-index: 0;
}

.movie-layout {
  position: relative;
  z-index: 1;
  display: grid;
  grid-template-columns: 260px 1fr;
  gap: 2.5rem;
  align-items: flex-start;
}

.sidebar {
  position: sticky;
  top: calc(var(--nav-height) + 1.5rem);
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.poster-box {
  border-radius: var(--radius-lg);
  overflow: hidden;
  border: 1px solid var(--border);
  box-shadow: var(--shadow-card);
  aspect-ratio: 2 / 3;
  background: var(--bg-card);
}

.poster-box img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.no-poster-big {
  width: 100%; height: 100%;
  display: flex; align-items: center; justify-content: center;
  font-size: 5rem; color: var(--text-muted);
}

.score-box {
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  padding: 1rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
}

.score-row {
  display: flex; flex-direction: column; align-items: center; width: 100%;
}

.score-label {
  font-size: 0.7rem; text-transform: uppercase;
  color: var(--text-muted); letter-spacing: 1px;
}

.score-num { font-size: 2rem; font-weight: 900; color: var(--rating-gold); line-height: 1; }
.score-num.kp { color: #ff6b00; }
.score-num.imdb { color: var(--rating-gold); }
.score-votes { font-size: 0.75rem; color: var(--text-muted); }

.movie-details { display: flex; flex-direction: column; gap: 2.5rem; }

.badges { display: flex; flex-wrap: wrap; gap: 0.5rem; margin-bottom: 0.75rem; }

.genre-badge {
  background: rgba(108, 99, 255, 0.15);
  border: 1px solid var(--border-hover);
  color: var(--accent-2);
  padding: 3px 12px; border-radius: var(--radius-xl);
  font-size: 0.78rem; font-weight: 700;
}

.age-badge {
  background: rgba(239, 68, 68, 0.15); border: 1px solid rgba(239, 68, 68, 0.3);
  color: #ef4444; padding: 3px 10px; border-radius: var(--radius-xl);
  font-size: 0.78rem; font-weight: 700;
}

.movie-title {
  font-size: clamp(1.6rem, 3.5vw, 2.4rem);
  font-weight: 900; letter-spacing: -1px; line-height: 1.15; margin-bottom: 0.3rem;
}

.original-title { color: var(--text-muted); font-size: 0.9rem; margin-bottom: 0.75rem; }

.movie-meta {
  display: flex; flex-wrap: wrap; gap: 1rem; margin-bottom: 1rem;
  color: var(--text-secondary); font-size: 0.9rem; font-weight: 600;
}

.quality-badge {
  background: linear-gradient(135deg, var(--accent), var(--accent-2));
  color: #fff; padding: 2px 10px; border-radius: var(--radius-sm); font-size: 0.78rem;
}

.movie-overview { color: var(--text-secondary); line-height: 1.8; font-size: 0.97rem; }
.movie-slogan { color: var(--text-muted); font-style: italic; font-size: 0.9rem; margin-top: -1rem; }

/* Плеер */
.player-tabs { 
  display: flex; 
  gap: 0.5rem; 
  margin-bottom: 1.25rem; 
  overflow-x: auto; 
  padding-bottom: 8px;
  scrollbar-width: none;
}
.player-tabs::-webkit-scrollbar { display: none; }

.player-tab {
  flex-shrink: 0;
  white-space: nowrap;
  background: var(--bg-card); border: 1px solid var(--border);
  color: var(--text-secondary); padding: 0.5rem 1.2rem; border-radius: var(--radius-xl);
  font-family: inherit; font-weight: 700; font-size: 0.88rem; cursor: pointer;
  transition: all var(--transition); display: flex; align-items: center; gap: 0.4rem;
}

.player-tab.active, .player-tab:hover {
  background: var(--accent); border-color: var(--accent);
  color: #fff; box-shadow: 0 4px 12px var(--accent-glow);
}

.uhd-badge {
  background: rgba(255,255,255,0.2); padding: 1px 6px; border-radius: 4px; font-size: 0.7rem;
}

.player-wrap {
  width: 100%; aspect-ratio: 16 / 9; border-radius: var(--radius-lg);
  overflow: hidden; border: 1px solid var(--border); background: #000; box-shadow: var(--shadow-card);
}

.player-wrap iframe { width: 100%; height: 100%; border: none; }

.player-placeholder {
  width: 100%; aspect-ratio: 16 / 9; border-radius: var(--radius-lg);
  border: 2px dashed var(--border-hover); display: flex; flex-direction: column;
  align-items: center; justify-content: center; gap: 0.75rem;
  color: var(--text-muted); text-align: center; background: var(--bg-card); padding: 2rem;
}

.placeholder-icon { font-size: 3rem; color: var(--accent); opacity: 0.4; }
.player-placeholder h3 { color: var(--text-secondary); font-size: 1.1rem; }
.player-placeholder p { font-size: 0.85rem; line-height: 1.7; max-width: 420px; }

.trailer-section { margin-top: 1rem; }

.trailer-btn {
  background: var(--bg-card); border: 1px solid var(--border); color: var(--text-secondary);
  padding: 0.5rem 1.2rem; border-radius: var(--radius-xl);
  font-family: inherit; font-weight: 700; font-size: 0.88rem; cursor: pointer;
  transition: all var(--transition);
}

.trailer-btn:hover { border-color: var(--accent-2); color: var(--accent-2); }

/* Актёры */
.cast-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(110px, 1fr)); gap: 0.75rem; }

.cast-card {
  background: var(--bg-card); border: 1px solid var(--border);
  border-radius: var(--radius-md); overflow: hidden; transition: transform var(--transition);
}

.cast-card:hover { transform: translateY(-3px); }

.cast-photo {
  aspect-ratio: 2 / 3; background: var(--bg-secondary); display: flex;
  align-items: center; justify-content: center;
}

.cast-photo img { width: 100%; height: 100%; object-fit: cover; }
.cast-no-photo { font-size: 3rem; color: var(--text-muted); }

.cast-info { padding: 0.5rem; display: flex; flex-direction: column; gap: 2px; }
.cast-name { font-size: 0.78rem; font-weight: 700; line-height: 1.2; }
.cast-char { font-size: 0.7rem; color: var(--text-muted); }

/* Похожие */
.similar-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(110px, 1fr)); gap: var(--gap); }

/* Загрузка */
.loading-page { min-height: 80vh; display: flex; align-items: center; justify-content: center; }

.spinner {
  width: 48px; height: 48px;
  border: 3px solid var(--border); border-top-color: var(--accent);
  border-radius: 50%; animation: spin 0.8s linear infinite;
}

@keyframes spin { to { transform: rotate(360deg); } }

@media (max-width: 900px) {
  .movie-page { padding: 1.5rem 0 4rem; }
  .movie-layout { grid-template-columns: 1fr; gap: 1.5rem; }
  .sidebar { 
    order: 2; /* Постер после заголовка */
    flex-direction: row; 
    align-items: center; 
    gap: 1.5rem;
    max-width: none;
  }
  .poster-box { width: 120px; flex-shrink: 0; }
  .score-box { flex: 1; align-items: flex-start; padding: 0.75rem 1rem; }
  .score-row { align-items: flex-start; }
  .score-num { font-size: 1.6rem; }
  .movie-header { order: 1; }
  .player-section { order: 3; }
  .cast-section { order: 4; }
  .similar-section { order: 5; }
  .movie-title { font-size: 1.8rem; }
  .backdrop, .backdrop-overlay { position: fixed; }
}
</style>
