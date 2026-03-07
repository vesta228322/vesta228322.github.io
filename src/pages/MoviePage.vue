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
          <div v-else class="no-poster-big">
            <Clapperboard :size="64" />
          </div>
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
          <div class="original-title-wrapper">
            <p class="original-title" v-if="movie.nameOriginal && movie.nameOriginal !== movie.nameRu">
              {{ movie.nameOriginal }}
            </p>
            <button class="share-btn" @click="shareMovie" :class="{ 'copied': shareCopied }" title="Поделиться">
              <component :is="shareCopied ? Check : Share2" :size="16" />
              <span>{{ shareCopied ? 'Скопировано' : 'Поделиться' }}</span>
            </button>
          </div>

          <div class="movie-meta">
            <span v-if="movie.year"><Calendar :size="16" class="meta-icon" /> {{ movie.year }}</span>
            <span v-if="movie.filmLength"><Clock :size="16" class="meta-icon" /> {{ movie.filmLength }} мин</span>
            <span v-if="movie.countries?.[0]"><Globe :size="16" class="meta-icon" /> {{ movie.countries[0].country }}</span>
            <span v-if="alloha?.quality" class="quality-badge">{{ alloha.quality }}</span>
          </div>

          <p class="movie-overview">
            {{ movie.description || alloha?.description || 'Описание отсутствует.' }}
          </p>

          <p class="movie-slogan" v-if="movie.slogan">«{{ movie.slogan }}»</p>
        </div>

        <!-- Плеер -->
        <div class="player-section">
          <h2 class="section-title">Плеер <Play :size="18" fill="currentColor" class="title-icon" /></h2>

          <!-- Загрузка -->
          <div v-if="allohaLoading" class="player-placeholder">
            <div class="spinner"></div>
            <p>Загружаем плеер...</p>
          </div>

          <!-- Плеер -->
          <template v-else-if="alloha?.iframe">
            <div class="player-wrap">
              <iframe
                :src="alloha.iframe"
                frameborder="0"
                allow="autoplay; fullscreen"
                sandbox="allow-forms allow-scripts allow-pointer-lock allow-same-origin allow-top-navigation"
              ></iframe>
            </div>
          </template>

          <!-- Нет плеера -->
          <div v-else class="player-placeholder">
            <Play :size="48" class="placeholder-icon" />
            <h3>Плеер недоступен</h3>
            <p>Фильм не найден в базе плеера. Попробуй позже.</p>
          </div>

          <!-- Трейлер -->
          <div v-if="alloha?.iframe_trailer && !allohaLoading" class="trailer-section">
            <button class="trailer-btn" @click="showTrailer = !showTrailer">
              <component :is="showTrailer ? X : Clapperboard" :size="16" />
              {{ showTrailer ? 'Закрыть трейлер' : 'Трейлер' }}
            </button>
            <div v-if="showTrailer" class="player-wrap" style="margin-top: 1rem;">
              <iframe
                :src="alloha.iframe_trailer"
                frameborder="0"
                allow="autoplay; fullscreen"
                sandbox="allow-forms allow-scripts allow-pointer-lock allow-same-origin allow-top-navigation"
              ></iframe>
            </div>
          </div>
        </div>

        <!-- Актёры -->
        <div class="cast-section" v-if="cast.length">
          <h2 class="section-title">В ролях <Users :size="20" class="title-icon" /></h2>
          <div class="cast-grid">
            <div 
              v-for="actor in cast" 
              :key="actor.staffId" 
              class="cast-card clickable"
              @click="router.push(`/actor/${actor.staffId}`)"
            >
              <div class="cast-photo">
                <img v-if="actor.posterUrl" :src="actor.posterUrl" :alt="actor.nameRu" />
                <User v-else :size="48" class="cast-no-photo" />
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
          <h2 class="section-title">Похожие <Clapperboard :size="18" class="title-icon" /></h2>
          <div class="similar-grid">
            <MovieCard v-for="m in similar" :key="m.id" :movie="m" />
          </div>
        </div>

        <!-- Комментарии -->
        <CommentsSection :movieId="route.params.id" class="movie-comments" />
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
import { useRoute, useRouter } from 'vue-router'
import { 
  Calendar, 
  Clock, 
  Globe, 
  Play, 
  Users, 
  User, 
  Clapperboard, 
  X,
  Share2,
  Check
} from 'lucide-vue-next'
import MovieCard from '@/components/MovieCard.vue'
import CommentsSection from '@/components/CommentsSection.vue'
import { getKPFilm, getKPStaff, getKPSimilars } from '@/api/kp'
import { getAllohaByKp } from '@/api/alloha'

import { useAuthStore } from '@/stores/auth'
import { supabase } from '@/api/supabase'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()
const movie = ref(null)
const cast = ref([])
const similar = ref([])
const alloha = ref(null)
const allohaLoading = ref(false)
const showTrailer = ref(false)
const shareCopied = ref(false)

const shareMovie = async () => {
  const url = window.location.href

  // Простая проверка на мобильное устройство
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)

  // Пробуем нативный шаринг только на мобилках
  if (isMobile && navigator.share) {
    const title = movie.value.nameRu || movie.value.nameEn || 'Смотреть онлайн'
    const text = `Фильм "${title}" — смотри бесплатно на KinoFlow!`
    
    try {
      await navigator.share({ title, text, url })
      return // Если успешно поделились через шторку, выходим
    } catch (err) {
      if (err.name !== 'AbortError') {
        console.error('Ошибка шаринга:', err)
        fallbackCopy(url) // Если ошибка шаринга, копируем
      }
    }
  } else {
    // Десктоп или нет поддержки Web Share — старый добрый буфер обмена
    fallbackCopy(url)
  }
}

const fallbackCopy = async (url) => {
  try {
    await navigator.clipboard.writeText(url)
    shareCopied.value = true
    setTimeout(() => { shareCopied.value = false }, 2000)
  } catch (err) {
    console.error('Failed to copy text: ', err)
  }
}

const posterUrl = computed(() => {
  // Приоритет: Alloha постер (kitnopoisk CDN) → KP API постер
  return alloha.value?.poster || movie.value?.posterUrl || null
})

const backdropStyle = computed(() => {
  const url = posterUrl.value
  return url ? { backgroundImage: `url(${url})` } : {}
})

// Сохранение в историю
const saveToHistory = async (m, allohaData) => {
  if (!m) return
  
  const movie_id = String(route.params.id)
  const entry = {
    id: movie_id,
    title: m.nameRu || m.nameEn || m.nameOriginal,
    name: m.nameRu,
    posterUrl: allohaData?.poster || m.posterUrl || null,
    poster_path: null,
    vote_average: m.ratingKinopoisk || null,
    release_date: m.year ? `${m.year}-01-01` : null,
  }

  // 1. Локальное сохранение (всегда)
  try {
    const stored = JSON.parse(localStorage.getItem('kf_history') || '[]')
    const filtered = stored.filter((item) => String(item.id) !== movie_id)
    const updated = [entry, ...filtered].slice(0, 20)
    localStorage.setItem('kf_history', JSON.stringify(updated))
  } catch (e) {
    console.error('Ошибка local history:', e)
  }

  // 2. Облачное сохранение (Supabase) - Ждем инициализацию auth
  if (auth.loading && !auth.isInitialized) {
    await auth.initialized
  }

  if (auth.user && supabase) {
    try {
      const { error } = await supabase
        .from('history')
        .upsert({
          user_id: auth.user.id,
          movie_id: movie_id,
          title: entry.title,
          poster_url: entry.posterUrl,
          vote_average: entry.vote_average,
          release_date: entry.release_date,
          viewed_at: new Date().toISOString()
        }, { onConflict: 'user_id, movie_id' })
      
      if (error) console.error('Supabase history error:', error)
    } catch (e) {
      console.error('Cloud save failed:', e)
    }
  }
}

// Следим за входом пользователя, чтобы сохранить историю, если он вошел прямо на этой странице
watch(() => auth.user, (newUser) => {
  if (newUser && movie.value) {
    saveToHistory(movie.value, alloha.value)
  }
})

const load = async (id) => {
  movie.value = null
  alloha.value = null
  cast.value = []
  similar.value = []
  showTrailer.value = false

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
      document.title = `KinoFlow — ${movie.value.nameRu || movie.value.nameEn || 'Фильм'}`
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

.original-title { color: var(--text-muted); font-size: 0.9rem; margin-bottom: 0; }

.original-title-wrapper {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 0.75rem;
  flex-wrap: wrap;
}

.share-btn {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  background: rgba(108, 99, 255, 0.1);
  border: 1px solid rgba(108, 99, 255, 0.2);
  color: var(--accent);
  padding: 0.25rem 0.6rem;
  border-radius: var(--radius-xl);
  font-family: inherit;
  font-weight: 700;
  font-size: 0.75rem;
  cursor: pointer;
  transition: all var(--transition);
}

@media (hover: hover) {
  .share-btn:hover {
    background: var(--accent);
    color: #fff;
    border-color: var(--accent);
  }
}

.share-btn.copied {
  background: rgba(34, 197, 94, 0.15);
  border-color: rgba(34, 197, 94, 0.3);
  color: #22c55e;
}


.movie-meta {
  display: flex; flex-wrap: wrap; gap: 1rem; margin-bottom: 1rem;
  color: var(--text-secondary); font-size: 0.9rem; font-weight: 600;
}

.quality-badge {
  background: linear-gradient(135deg, var(--accent), var(--accent-2));
  color: #fff; padding: 2px 10px; border-radius: var(--radius-sm); font-size: 0.78rem;
}

.movie-overview { color: var(--text-secondary); line-height: 1.8; font-size: 0.97rem; }
.movie-slogan { color: var(--text-muted); font-style: italic; font-size: 0.9rem; margin-top: 1rem; }



.player-wrap {
  width: 100%; 
  max-width: 900px;
  margin: 0 auto;
  aspect-ratio: 16 / 9; 
  border-radius: var(--radius-lg);
  overflow: hidden; 
  border: 1px solid var(--border); 
  background: #000; 
  box-shadow: var(--shadow-card);
}

.player-wrap iframe { width: 100%; height: 100%; border: none; }

.player-placeholder {
  width: 100%; 
  max-width: 900px;
  margin: 0 auto;
  aspect-ratio: 16 / 9; 
  border-radius: var(--radius-lg);
  border: 2px dashed var(--border-hover); display: flex; flex-direction: column;
  align-items: center; justify-content: center; gap: 0.75rem;
  color: var(--text-muted); text-align: center; background: var(--bg-card); padding: 2rem;
}

.placeholder-icon { font-size: 3rem; color: var(--accent); opacity: 0.4; }
.player-placeholder h3 { color: var(--text-secondary); font-size: 1.1rem; }
.player-placeholder p { font-size: 0.85rem; line-height: 1.7; max-width: 420px; }

.trailer-section { margin-top: 1rem; }

.trailer-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: var(--bg-card); border: 1px solid var(--border); color: var(--text-secondary);
  padding: 0.5rem 1.2rem; border-radius: var(--radius-xl);
  font-family: inherit; font-weight: 700; font-size: 0.88rem; cursor: pointer;
  transition: all var(--transition);
}

.title-icon {
  display: inline-block;
  vertical-align: middle;
  margin-top: -4px;
  margin-left: 4px;
}

.meta-icon {
  display: inline-block;
  vertical-align: middle;
  margin-top: -2px;
  margin-right: 4px;
  opacity: 0.8;
}

@media (hover: hover) {
  .trailer-btn:hover { border-color: var(--accent-2); color: var(--accent-2); }
}

/* Актёры */
.cast-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(110px, 1fr)); gap: 0.75rem; }

.cast-card {
  background: var(--bg-card); border: 1px solid var(--border);
  border-radius: var(--radius-md); overflow: hidden; transition: all var(--transition);
}

.cast-card.clickable {
  cursor: pointer;
}

@media (hover: hover) {
  .cast-card.clickable:hover { 
    transform: translateY(-5px); 
    border-color: var(--accent);
    box-shadow: var(--shadow-md);
  }
}

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
  .movie-page { padding: 1rem 0 4rem; }
  .movie-layout { 
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
  }
  .sidebar { 
    order: 1; /* Постер и рейтинг теперь сверху */
    display: flex;
    flex-direction: row; 
    align-items: stretch; 
    gap: 1rem;
    max-width: none;
    position: static;
  }
  .poster-box { 
    width: 100px; 
    flex-shrink: 0; 
    border-radius: var(--radius-md);
  }
  .score-box { 
    flex: 1; 
    justify-content: center;
    align-items: flex-start; 
    padding: 0.75rem 1rem; 
  }
  .score-row { align-items: flex-start; }
  .score-num { font-size: 1.5rem; }
  .movie-header { order: 1; }
  .player-section { order: 2; } /* Плеер после заголовка */
  .cast-section { order: 3; }
  .similar-section { order: 4; }
  .movie-comments { order: 10; }
  .movie-details { 
    order: 2; /* Вся правая часть (заголовок, плеер, комменты) под постером */
    display: flex;
    flex-direction: column;
    gap: 2rem;
  }
  .movie-title { font-size: 1.7rem; }
  .backdrop, .backdrop-overlay { position: fixed; }
}
</style>
