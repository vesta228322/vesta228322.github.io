<template>
  <div class="home">
    <!-- Hero секция -->
    <section class="hero" v-if="featured">
      <div
        class="hero-bg"
        :style="{ backgroundImage: `url(${heroImg})` }"
      ></div>
      <div class="hero-overlay"></div>
      <div class="container hero-content fade-in">
        <div class="hero-badge">🔥 Сейчас популярно</div>
        <h1 class="hero-title">{{ featured.title }}</h1>
        <p class="hero-desc">{{ truncate(featured.overview, 180) }}</p>
        <div class="hero-meta">
          <span class="hero-rating"
            >★ {{ featured.vote_average?.toFixed(1) }}</span
          >
          <span class="hero-year">{{
            featured.release_date?.slice(0, 4)
          }}</span>
        </div>
        <div class="hero-actions">
          <RouterLink :to="`/movie/${featured.id}`" class="btn-primary">
            ▶ Смотреть
          </RouterLink>
          <RouterLink :to="`/movie/${featured.id}`" class="btn-secondary">
            Подробнее
          </RouterLink>
        </div>
      </div>
    </section>
    <section v-else class="hero hero-skeleton">
      <div class="container">
        <div
          class="skeleton"
          style="width: 200px; height: 28px; margin-bottom: 1rem"
        ></div>
        <div
          class="skeleton"
          style="width: 500px; height: 48px; margin-bottom: 1rem"
        ></div>
        <div class="skeleton" style="width: 380px; height: 24px"></div>
      </div>
    </section>

    <div class="container sections">
      <!-- Сейчас в кино -->
      <section class="movie-section fade-in">
        <h2 class="section-title">Сейчас в кино <span>🍿</span></h2>
        <div class="movies-grid" v-if="nowPlaying.length">
          <MovieCard
            v-for="m in nowPlaying.slice(0, 6)"
            :key="m.id"
            :movie="m"
          />
        </div>
        <div class="movies-grid" v-else>
          <div v-for="i in 6" :key="i" class="skeleton card-skeleton"></div>
        </div>
      </section>

      <!-- Популярные -->
      <section class="movie-section fade-in">
        <div class="section-header">
          <h2 class="section-title">Популярные <span>🔥</span></h2>
          <RouterLink to="/search?sort=popular" class="see-all"
            >Все →</RouterLink
          >
        </div>
        <div class="movies-grid" v-if="popular.length">
          <MovieCard v-for="m in popular.slice(0, 12)" :key="m.id" :movie="m" />
        </div>
        <div class="movies-grid" v-else>
          <div v-for="i in 12" :key="i" class="skeleton card-skeleton"></div>
        </div>
      </section>

      <!-- Топ по рейтингу -->
      <section class="movie-section fade-in">
        <div class="section-header">
          <h2 class="section-title">Топ по рейтингу <span>⭐</span></h2>
          <RouterLink to="/search?sort=top" class="see-all">Все →</RouterLink>
        </div>
        <div class="movies-grid" v-if="topRated.length">
          <MovieCard
            v-for="m in topRated.slice(0, 12)"
            :key="m.id"
            :movie="m"
          />
        </div>
        <div class="movies-grid" v-else>
          <div v-for="i in 12" :key="i" class="skeleton card-skeleton"></div>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";
import MovieCard from "@/components/MovieCard.vue";
import { getPopular, getTopRated, getNowPlaying } from "@/api/tmdb";

const TMDB_BG = "https://image.tmdb.org/t/p/original";

const popular = ref([]);
const topRated = ref([]);
const nowPlaying = ref([]);
const featured = ref(null);

const heroImg = computed(() =>
  featured.value?.backdrop_path
    ? `${TMDB_BG}${featured.value.backdrop_path}`
    : "",
);

const truncate = (str, len) =>
  str && str.length > len ? str.slice(0, len) + "..." : str || "";

onMounted(async () => {
  try {
    const [pop, top, now] = await Promise.all([
      getPopular(),
      getTopRated(),
      getNowPlaying(),
    ]);
    popular.value = pop.results;
    topRated.value = top.results;
    nowPlaying.value = now.results;
    // Берём первый популярный с backdrop как герой
    featured.value = pop.results.find((m) => m.backdrop_path) || pop.results[0];
  } catch (e) {
    console.error("Ошибка загрузки фильмов:", e);
  }
});
</script>

<style scoped>
/* ---- Hero ---- */
.hero {
  position: relative;
  height: 580px;
  display: flex;
  align-items: center;
  overflow: hidden;
}

.hero-bg {
  position: absolute;
  inset: 0;
  background-size: cover;
  background-position: center top;
  filter: blur(2px) brightness(0.4);
  transform: scale(1.05);
}

.hero-overlay {
  position: absolute;
  inset: 0;
  background:
    linear-gradient(to right, var(--bg-primary) 30%, transparent 70%),
    linear-gradient(to top, var(--bg-primary) 0%, transparent 40%);
}

.hero-content {
  position: relative;
  z-index: 1;
  max-width: 580px;
}

.hero-badge {
  display: inline-block;
  background: linear-gradient(135deg, var(--accent), var(--accent-2));
  color: #fff;
  padding: 4px 14px;
  border-radius: var(--radius-xl);
  font-size: 0.8rem;
  font-weight: 800;
  margin-bottom: 1rem;
  letter-spacing: 0.5px;
}

.hero-title {
  font-size: clamp(1.8rem, 4vw, 3rem);
  font-weight: 900;
  line-height: 1.15;
  margin-bottom: 0.75rem;
  letter-spacing: -1px;
}

.hero-desc {
  color: var(--text-secondary);
  font-size: 0.95rem;
  line-height: 1.7;
  margin-bottom: 1rem;
}

.hero-meta {
  display: flex;
  gap: 1rem;
  margin-bottom: 1.5rem;
  align-items: center;
}

.hero-rating {
  background: rgba(245, 197, 24, 0.15);
  border: 1px solid rgba(245, 197, 24, 0.4);
  color: var(--rating-gold);
  padding: 3px 10px;
  border-radius: var(--radius-sm);
  font-size: 0.88rem;
  font-weight: 800;
}

.hero-year {
  color: var(--text-muted);
  font-size: 0.9rem;
  font-weight: 600;
}

.hero-actions {
  display: flex;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.btn-primary {
  background: linear-gradient(135deg, var(--accent), var(--accent-2));
  color: #fff;
  padding: 0.7rem 1.8rem;
  border-radius: var(--radius-xl);
  font-weight: 800;
  font-size: 1rem;
  box-shadow: var(--shadow-accent);
  transition:
    transform var(--transition),
    box-shadow var(--transition);
}

.btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 12px 32px var(--accent-glow);
}

.btn-secondary {
  background: var(--bg-glass);
  backdrop-filter: blur(10px);
  border: 1px solid var(--border-hover);
  color: var(--text-primary);
  padding: 0.7rem 1.6rem;
  border-radius: var(--radius-xl);
  font-weight: 700;
  font-size: 1rem;
  transition:
    background var(--transition),
    border-color var(--transition);
}

.btn-secondary:hover {
  background: var(--bg-card);
  border-color: var(--accent);
}

.hero-skeleton {
  background: var(--bg-secondary);
  align-items: center;
}

/* ---- Секции ---- */
.sections {
  padding: 3rem 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 3rem;
}

.section-header {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  margin-bottom: 1.25rem;
}

.section-header .section-title {
  margin-bottom: 0;
}

.see-all {
  font-size: 0.88rem;
  font-weight: 700;
  color: var(--accent-2);
  transition: opacity var(--transition);
}

.see-all:hover {
  opacity: 0.75;
}

/* ---- Сетка ---- */
.movies-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: var(--gap);
}

.card-skeleton {
  aspect-ratio: 2 / 3;
  border-radius: var(--radius-md);
}

@media (max-width: 768px) {
  .hero {
    height: 480px;
  }
  .movies-grid {
    grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  }
}

@media (max-width: 480px) {
  .hero {
    height: 400px;
  }
  .movies-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}
</style>
