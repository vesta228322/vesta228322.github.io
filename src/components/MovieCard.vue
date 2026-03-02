<template>
  <RouterLink :to="`/movie/${movie.id}`" class="movie-card">
    <!-- Постер -->
    <div class="poster-wrap">
      <img
        v-if="posterUrl"
        :src="posterUrl"
        :alt="`Постер фильма ${movie.title || movie.name}`"
        loading="lazy"
        @error="onImgError"
      />
      <div v-else class="no-poster">
        <span>🎬</span>
        <p>Нет постера</p>
      </div>

      <!-- Рейтинг -->
      <div v-if="movie.vote_average" class="rating-badge" :class="ratingClass">
        ★ {{ movie.vote_average.toFixed(1) }}
      </div>

      <!-- Оверлей при наведении -->
      <div class="hover-overlay">
        <span class="play-btn">▶ Смотреть</span>
      </div>
    </div>

    <!-- Информация -->
    <div class="card-info">
      <h2 class="card-title">{{ movie.title || movie.name }}</h2>
      <span class="card-year">{{ releaseYear }}</span>
    </div>
  </RouterLink>
</template>

<script setup>
import { computed } from "vue";

const TMDB_IMG = "https://image.tmdb.org/t/p/w342";

const props = defineProps({
  movie: {
    type: Object,
    required: true,
  },
});

const posterUrl = computed(() => {
  // Поддержка KP формата (полный URL) и TMDB формата (относительный путь)
  if (props.movie.posterUrl) return props.movie.posterUrl
  if (props.movie.poster_path) return `${TMDB_IMG}${props.movie.poster_path}`
  return null
})

const releaseYear = computed(() => {
  const date = props.movie.release_date || props.movie.first_air_date || "";
  return date ? date.slice(0, 4) : "";
});

const ratingClass = computed(() => {
  const r = props.movie.vote_average;
  if (r >= 7) return "high";
  if (r >= 5) return "mid";
  return "low";
});

const onImgError = (e) => {
  e.target.style.display = "none";
};
</script>

<style scoped>
.movie-card {
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
  cursor: pointer;
  text-decoration: none;
  color: inherit;
}

.poster-wrap {
  position: relative;
  border-radius: var(--radius-md);
  overflow: hidden;
  aspect-ratio: 2 / 3;
  background: var(--bg-card);
  border: 1px solid var(--border);
  transition:
    transform var(--transition),
    box-shadow var(--transition);
}

.movie-card:hover .poster-wrap {
  transform: translateY(-6px) scale(1.02);
  box-shadow: 0 16px 40px rgba(108, 99, 255, 0.3);
}

.poster-wrap img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.no-poster {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  color: var(--text-muted);
  font-size: 0.85rem;
}

.no-poster span {
  font-size: 2.5rem;
}

/* Рейтинг */
.rating-badge {
  position: absolute;
  top: 8px;
  left: 8px;
  padding: 3px 8px;
  border-radius: var(--radius-sm);
  font-size: 0.78rem;
  font-weight: 800;
  backdrop-filter: blur(8px);
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.rating-badge.high {
  background: rgba(34, 197, 94, 0.85);
  color: #fff;
}

.rating-badge.mid {
  background: rgba(245, 197, 24, 0.85);
  color: #000;
}

.rating-badge.low {
  background: rgba(239, 68, 68, 0.85);
  color: #fff;
}

/* Оверлей */
.hover-overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(
    to top,
    rgba(6, 10, 24, 0.92) 0%,
    transparent 60%
  );
  display: flex;
  align-items: flex-end;
  justify-content: center;
  padding-bottom: 1.25rem;
  opacity: 0;
  transition: opacity var(--transition);
}

.movie-card:hover .hover-overlay {
  opacity: 1;
}

.play-btn {
  background: linear-gradient(135deg, var(--accent), var(--accent-2));
  color: #fff;
  padding: 0.5rem 1.25rem;
  border-radius: var(--radius-xl);
  font-size: 0.9rem;
  font-weight: 700;
  box-shadow: 0 4px 16px var(--accent-glow);
}

/* Текст под карточкой */
.card-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.card-title {
  font-size: 0.9rem;
  font-weight: 700;
  color: var(--text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  line-height: 1.3;
}

.card-year {
  font-size: 0.78rem;
  color: var(--text-muted);
  font-weight: 600;
}
@media (max-width: 768px) {
  .card-title {
    font-size: 0.85rem;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .card-info {
    gap: 1px;
  }
}
</style>
