<template>
  <div class="movie-page" v-if="movie">
    <!-- Фоновое изображение -->
    <div
      class="backdrop"
      :style="{ backgroundImage: `url(${backdropUrl})` }"
    ></div>
    <div class="backdrop-overlay"></div>

    <div class="container movie-layout fade-in">
      <!-- ПОСТЕР -->
      <aside class="sidebar">
        <div class="poster-box">
          <img v-if="posterUrl" :src="posterUrl" :alt="movie.title" />
          <div v-else class="no-poster-big">🎬</div>
        </div>
        <div class="score-box" v-if="movie.vote_average">
          <span class="score-label">TMDB рейтинг</span>
          <span class="score-num">{{ movie.vote_average.toFixed(1) }}</span>
          <span class="score-votes"
            >{{ movie.vote_count?.toLocaleString() }} голосов</span
          >
        </div>
      </aside>

      <!-- ИНФОРМАЦИЯ -->
      <main class="movie-details">
        <div class="movie-header">
          <div class="badges">
            <span
              v-for="g in movie.genres?.slice(0, 3)"
              :key="g.id"
              class="genre-badge"
              >{{ g.name }}</span
            >
          </div>
          <h1 class="movie-title">{{ movie.title }}</h1>
          <p class="original-title" v-if="movie.original_title !== movie.title">
            {{ movie.original_title }}
          </p>

          <div class="movie-meta">
            <span v-if="movie.release_date"
              >📅 {{ movie.release_date?.slice(0, 4) }}</span
            >
            <span v-if="movie.runtime"
              >⏱ {{ formatRuntime(movie.runtime) }}</span
            >
            <span v-if="movie.production_countries?.[0]"
              >🌍 {{ movie.production_countries[0].name }}</span
            >
          </div>

          <p class="movie-overview">
            {{ movie.overview || "Описание отсутствует." }}
          </p>
        </div>

        <!-- Плеер -->
        <div class="player-section">
          <h2 class="section-title">Плеер <span>▶</span></h2>

          <!-- Выбор плеера -->
          <div class="player-tabs" v-if="availablePlayers.length">
            <button
              v-for="p in availablePlayers"
              :key="p.id"
              class="player-tab"
              :class="{ active: activePlayer === p.id }"
              @click="activePlayer = p.id"
            >
              {{ p.name }}
            </button>
          </div>

          <div class="player-wrap" v-if="playerUrl">
            <iframe :src="playerUrl" frameborder="0" allowfullscreen></iframe>
          </div>

          <!-- Заглушка когда нет токена -->
          <div v-else class="player-placeholder">
            <div class="placeholder-icon">▶</div>
            <h3>Плеер скоро появится</h3>
            <p>
              Для показа видео необходим токен видеобалансера
              (Kodik/Videocdn).<br />
              Когда токен будет добавлен, плеер заработает автоматически.
            </p>
          </div>
        </div>

        <!-- Актёры -->
        <div class="cast-section" v-if="cast.length">
          <h2 class="section-title">В ролях <span>🎭</span></h2>
          <div class="cast-grid">
            <div
              v-for="actor in cast.slice(0, 8)"
              :key="actor.id"
              class="cast-card"
            >
              <div class="cast-photo">
                <img
                  v-if="actor.profile_path"
                  :src="`https://image.tmdb.org/t/p/w185${actor.profile_path}`"
                  :alt="actor.name"
                />
                <span v-else class="cast-no-photo">👤</span>
              </div>
              <div class="cast-info">
                <span class="cast-name">{{ actor.name }}</span>
                <span class="cast-char">{{ actor.character }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Похожие -->
        <div class="similar-section" v-if="similar.length">
          <h2 class="section-title">Похожие <span>🎬</span></h2>
          <div class="similar-grid">
            <MovieCard
              v-for="m in similar.slice(0, 6)"
              :key="m.id"
              :movie="m"
            />
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
import { ref, computed, watch, onMounted } from "vue";
import { useRoute } from "vue-router";
import MovieCard from "@/components/MovieCard.vue";
import { getMovieDetails } from "@/api/tmdb";

const TMDB_IMG = "https://image.tmdb.org/t/p/w500";
const TMDB_BG = "https://image.tmdb.org/t/p/original";
const KODIK_TOKEN = import.meta.env.VITE_KODIK_TOKEN || "";

const route = useRoute();
const movie = ref(null);
const cast = ref([]);
const similar = ref([]);
const activePlayer = ref("");

const availablePlayers = computed(() => {
  const players = [];
  if (KODIK_TOKEN) {
    players.push({ id: "kodik", name: "Kodik" });
  }
  return players;
});

const playerUrl = computed(() => {
  if (!movie.value) return null;
  if (activePlayer.value === "kodik" && KODIK_TOKEN) {
    return `https://kodik.info/find-player?token=${KODIK_TOKEN}&kinopoisk_id=${movie.value.id}&only_host=true`;
  }
  return null;
});

const posterUrl = computed(() =>
  movie.value?.poster_path ? `${TMDB_IMG}${movie.value.poster_path}` : null,
);
const backdropUrl = computed(() =>
  movie.value?.backdrop_path ? `${TMDB_BG}${movie.value.backdrop_path}` : null,
);

const formatRuntime = (min) => {
  const h = Math.floor(min / 60);
  const m = min % 60;
  return h ? `${h}ч ${m}мин` : `${m}мин`;
};

const load = async (id) => {
  movie.value = null;
  try {
    const data = await getMovieDetails(id);
    movie.value = data;
    cast.value = data.credits?.cast || [];
    similar.value = data.similar?.results || [];
    if (availablePlayers.value.length) {
      activePlayer.value = availablePlayers.value[0].id;
    }
  } catch (e) {
    console.error("Ошибка загрузки фильма:", e);
  }
};

watch(
  () => route.params.id,
  (id) => id && load(id),
);
onMounted(() => load(route.params.id));
</script>

<style scoped>
.movie-page {
  position: relative;
  min-height: 100vh;
  padding: 2.5rem 0 4rem;
}

/* Фон */
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

/* Основная раскладка */
.movie-layout {
  position: relative;
  z-index: 1;
  display: grid;
  grid-template-columns: 260px 1fr;
  gap: 2.5rem;
  align-items: flex-start;
}

/* Сайдбар */
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
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 5rem;
  color: var(--text-muted);
}

.score-box {
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  padding: 1rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.score-label {
  font-size: 0.7rem;
  text-transform: uppercase;
  color: var(--text-muted);
  letter-spacing: 1px;
}
.score-num {
  font-size: 2.5rem;
  font-weight: 900;
  color: var(--rating-gold);
  line-height: 1;
}
.score-votes {
  font-size: 0.75rem;
  color: var(--text-muted);
}

/* Детали */
.movie-details {
  display: flex;
  flex-direction: column;
  gap: 2.5rem;
}

.badges {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-bottom: 0.75rem;
}

.genre-badge {
  background: rgba(108, 99, 255, 0.15);
  border: 1px solid var(--border-hover);
  color: var(--accent-2);
  padding: 3px 12px;
  border-radius: var(--radius-xl);
  font-size: 0.78rem;
  font-weight: 700;
}

.movie-title {
  font-size: clamp(1.6rem, 3.5vw, 2.4rem);
  font-weight: 900;
  letter-spacing: -1px;
  line-height: 1.15;
  margin-bottom: 0.3rem;
}

.original-title {
  color: var(--text-muted);
  font-size: 0.9rem;
  margin-bottom: 0.75rem;
}

.movie-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  margin-bottom: 1rem;
  color: var(--text-secondary);
  font-size: 0.9rem;
  font-weight: 600;
}

.movie-overview {
  color: var(--text-secondary);
  line-height: 1.8;
  font-size: 0.97rem;
}

/* Плеер */
.player-tabs {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 1rem;
  flex-wrap: wrap;
}

.player-tab {
  background: var(--bg-card);
  border: 1px solid var(--border);
  color: var(--text-secondary);
  padding: 0.4rem 1.2rem;
  border-radius: var(--radius-xl);
  font-family: inherit;
  font-weight: 700;
  font-size: 0.88rem;
  transition: all var(--transition);
}

.player-tab.active,
.player-tab:hover {
  background: var(--accent);
  border-color: var(--accent);
  color: #fff;
  box-shadow: 0 4px 12px var(--accent-glow);
}

.player-wrap {
  width: 100%;
  aspect-ratio: 16 / 9;
  border-radius: var(--radius-lg);
  overflow: hidden;
  border: 1px solid var(--border);
  background: #000;
  box-shadow: var(--shadow-card);
}

.player-wrap iframe {
  width: 100%;
  height: 100%;
  border: none;
}

.player-placeholder {
  width: 100%;
  aspect-ratio: 16 / 9;
  border-radius: var(--radius-lg);
  border: 2px dashed var(--border-hover);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  color: var(--text-muted);
  text-align: center;
  background: var(--bg-card);
  padding: 2rem;
}

.placeholder-icon {
  font-size: 3rem;
  color: var(--accent);
  opacity: 0.4;
}

.player-placeholder h3 {
  color: var(--text-secondary);
  font-size: 1.1rem;
}

.player-placeholder p {
  font-size: 0.85rem;
  line-height: 1.7;
  max-width: 420px;
}

/* Актёры */
.cast-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
  gap: 1rem;
}

.cast-card {
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  overflow: hidden;
  transition: transform var(--transition);
}

.cast-card:hover {
  transform: translateY(-3px);
}

.cast-photo {
  aspect-ratio: 2 / 3;
  background: var(--bg-secondary);
  display: flex;
  align-items: center;
  justify-content: center;
}

.cast-photo img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.cast-no-photo {
  font-size: 3rem;
  color: var(--text-muted);
}

.cast-info {
  padding: 0.6rem;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.cast-name {
  font-size: 0.82rem;
  font-weight: 700;
}
.cast-char {
  font-size: 0.75rem;
  color: var(--text-muted);
}

/* Похожие */
.similar-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
  gap: var(--gap);
}

/* Загрузка */
.loading-page {
  min-height: 80vh;
  display: flex;
  align-items: center;
  justify-content: center;
}

.spinner {
  width: 48px;
  height: 48px;
  border: 3px solid var(--border);
  border-top-color: var(--accent);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

/* Адаптив */
@media (max-width: 900px) {
  .movie-layout {
    grid-template-columns: 1fr;
  }
  .sidebar {
    position: static;
    max-width: 240px;
  }
  .backdrop {
    position: absolute;
  }
  .backdrop-overlay {
    position: absolute;
  }
}
</style>
