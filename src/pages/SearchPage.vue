<template>
  <div class="search-page">
    <div class="container">
      <div class="search-header fade-in">
        <h1 class="section-title">
          <span v-if="query">Результаты: «{{ query }}»</span>
          <span v-else-if="route.query.sort === 'top'">⭐ Топ по рейтингу</span>
          <span v-else-if="route.query.genre">🎬 По жанру</span>
          <span v-else>🔍 Поиск</span>
        </h1>
        <p v-if="total" class="results-count">Найдено: {{ total }} фильмов</p>
      </div>

      <!-- Inline поиск -->
      <div class="search-bar fade-in">
        <input
          v-model="localQuery"
          type="text"
          placeholder="Введите название фильма..."
          @keydown.enter="applySearch"
        />
        <button class="btn-primary" @click="applySearch">Найти</button>
      </div>

      <!-- Загрузка -->
      <div v-if="loading" class="movies-grid">
        <div v-for="i in 20" :key="i" class="skeleton card-skeleton"></div>
      </div>

      <!-- Результаты -->
      <div v-else-if="movies.length" class="movies-grid fade-in">
        <MovieCard v-for="m in movies" :key="m.id" :movie="m" />
      </div>

      <!-- Пусто -->
      <div v-else class="empty-state fade-in">
        <span>🎬</span>
        <p>Ничего не найдено. Попробуй другое название.</p>
      </div>

      <!-- Пагинация -->
      <div v-if="totalPages > 1" class="pagination">
        <button
          class="page-btn"
          :disabled="page <= 1"
          @click="changePage(page - 1)"
        >
          ← Назад
        </button>
        <span class="page-info"
          >{{ page }} / {{ Math.min(totalPages, 500) }}</span
        >
        <button
          class="page-btn"
          :disabled="page >= totalPages"
          @click="changePage(page + 1)"
        >
          Вперёд →
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, onMounted } from "vue";
import { useRoute, useRouter } from "vue-router";
import MovieCard from "@/components/MovieCard.vue";
import { searchMovies, getPopular, getTopRated, getByGenre } from "@/api/tmdb";

const route = useRoute();
const router = useRouter();

const movies = ref([]);
const loading = ref(false);
const page = ref(1);
const total = ref(0);
const totalPages = ref(1);
const localQuery = ref("");
const query = ref("");

const load = async () => {
  loading.value = true;
  movies.value = [];
  try {
    let data;
    const q = route.query.q;
    const sort = route.query.sort;
    const genre = route.query.genre;

    if (q) {
      query.value = q;
      localQuery.value = q;
      data = await searchMovies(q, page.value);
    } else if (sort === "top") {
      query.value = "";
      data = await getTopRated(page.value);
    } else if (genre) {
      query.value = "";
      data = await getByGenre(genre, page.value);
    } else {
      query.value = "";
      data = await getPopular(page.value);
    }

    movies.value = data.results;
    total.value = data.total_results;
    totalPages.value = data.total_pages;
  } catch (e) {
    console.error(e);
  } finally {
    loading.value = false;
  }
};

const applySearch = () => {
  if (localQuery.value.trim()) {
    router.push({ path: "/search", query: { q: localQuery.value.trim() } });
  }
};

const changePage = (p) => {
  page.value = p;
  load();
  window.scrollTo({ top: 0, behavior: "smooth" });
};

watch(
  () => route.query,
  () => {
    page.value = 1;
    load();
  },
);

onMounted(load);
</script>

<style scoped>
.search-page {
  padding: 2.5rem 0 4rem;
}

.search-header {
  margin-bottom: 1.5rem;
}

.results-count {
  color: var(--text-muted);
  font-size: 0.88rem;
  margin-top: 0.25rem;
}

.search-bar {
  display: flex;
  gap: 0.75rem;
  margin-bottom: 2rem;
}

.search-bar input {
  flex: 1;
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: var(--radius-xl);
  padding: 0.75rem 1.25rem;
  color: var(--text-primary);
  font-family: inherit;
  font-size: 1rem;
  outline: none;
  transition: border-color var(--transition);
}

.search-bar input:focus {
  border-color: var(--accent);
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

.empty-state {
  text-align: center;
  padding: 5rem 0;
  color: var(--text-muted);
}

.empty-state span {
  font-size: 4rem;
  display: block;
  margin-bottom: 1rem;
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
  transition:
    border-color var(--transition),
    background var(--transition);
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
  .search-bar {
    flex-direction: column;
  }
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
