<template>
  <div class="actor-page" v-if="actor">
    <!-- Кнопка назад -->
    <button class="back-btn" @click="router.back()">
      <ArrowLeft :size="20" /> Назад
    </button>

    <!-- Шапка с инфой актера -->
    <div class="actor-header">
      <div class="actor-photo-wrapper">
        <img 
          v-if="actor.posterUrl" 
          :src="actor.posterUrl" 
          :alt="actor.nameRu || actor.nameEn" 
          class="actor-photo"
          @error="(e) => (e.target.style.display = 'none')"
        />
        <div v-else class="actor-photo-placeholder">
          <User :size="64" />
        </div>
      </div>
      <div class="actor-info">
        <h1 class="actor-name">{{ actor.nameRu || actor.nameEn }}</h1>
        <p class="actor-name-en" v-if="actor.nameEn && actor.nameEn !== actor.nameRu">
          {{ actor.nameEn }}
        </p>
        <p class="actor-profession" v-if="actor.professionStat">
          {{ actor.professionStat }} <!-- Пример: Актёр, Режиссёр -->
        </p>
      </div>
    </div>

    <!-- Лучшие фильмы -->
    <div class="actor-movies">
      <h2 class="section-title">Лучшие фильмы и сериалы</h2>
      <div class="movies-grid" v-if="actor.movies?.length">
        <MovieCard 
          v-for="movie in actor.movies" 
          :key="movie.id" 
          :movie="movie" 
        />
      </div>
      <p v-else class="no-movies">Фильмы не найдены</p>
    </div>
  </div>

  <div class="actor-page loading" v-else-if="loading">
    <div class="loader"><Loader2 class="spin" :size="32" /> Загрузка...</div>
  </div>

  <div class="actor-page error" v-else-if="error">
    <h2>Упс...</h2>
    <p>{{ error }}</p>
    <button class="back-btn" @click="router.push('/')">На главную</button>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ArrowLeft, User, Loader2 } from 'lucide-vue-next'
import MovieCard from '@/components/MovieCard.vue'
import { getKPStaffDetails } from '@/api/kp'

const route = useRoute()
const router = useRouter()

const actor = ref(null)
const loading = ref(true)
const error = ref(null)

const fetchActor = async () => {
  loading.value = true
  error.value = null
  try {
    actor.value = await getKPStaffDetails(route.params.id)
  } catch (err) {
    console.error(err)
    error.value = 'Не удалось загрузить информацию об актёре.'
  } finally {
    loading.value = false
  }
}

onMounted(fetchActor)

// Если юзер переходит от одного актера к другому
watch(() => route.params.id, (newId) => {
  if (newId) fetchActor()
})
</script>

<style scoped>
.actor-page {
  padding: 2rem;
  max-width: 1200px;
  margin: 0 auto;
}

.back-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  background: transparent;
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: var(--text-light);
  padding: 0.5rem 1rem;
  border-radius: var(--radius-lg);
  font-family: inherit;
  font-size: 0.9rem;
  font-weight: 500;
  cursor: pointer;
  transition: all var(--transition);
  margin-bottom: 2rem;
}

@media (hover: hover) {
  .back-btn:hover {
    background: rgba(255, 255, 255, 0.05);
    color: var(--accent);
    border-color: rgba(255, 255, 255, 0.2);
  }
}

.actor-header {
  display: flex;
  align-items: flex-end;
  gap: 2rem;
  margin-bottom: 3rem;
  background: var(--bg-card);
  padding: 2rem;
  border-radius: var(--radius-2xl);
  border: 1px solid rgba(255, 255, 255, 0.05);
}

.actor-photo-wrapper {
  flex-shrink: 0;
  width: 200px;
  height: 200px;
  border-radius: var(--radius-full);
  overflow: hidden;
  box-shadow: var(--shadow-xl);
  border: 4px solid var(--bg-card);
  background: var(--bg-dark);
}

.actor-photo {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.actor-photo-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-muted);
}

.actor-info {
  flex-grow: 1;
}

.actor-name {
  font-size: 3rem;
  font-weight: 900;
  letter-spacing: -1px;
  margin-bottom: 0.5rem;
  color: #fff;
}

.actor-name-en {
  color: var(--text-muted);
  font-size: 1.25rem;
  margin-bottom: 1rem;
}

.actor-profession {
  display: inline-block;
  background: rgba(108, 99, 255, 0.15);
  color: var(--accent);
  padding: 0.4rem 1rem;
  border-radius: var(--radius-xl);
  font-weight: 600;
  font-size: 0.9rem;
  text-transform: capitalize;
}

.section-title {
  font-size: 1.75rem;
  font-weight: 700;
  margin-bottom: 1.5rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.section-title::before {
  content: '';
  display: block;
  width: 4px;
  height: 1.5rem;
  background: var(--gradient-primary);
  border-radius: var(--radius-sm);
}

.movies-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 1.5rem;
}

.loading, .error {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 50vh;
  gap: 1rem;
}

.loader {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  color: var(--accent);
  font-size: 1.1rem;
  font-weight: 500;
}

.spin {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

@media (max-width: 768px) {
  .actor-header {
    flex-direction: column;
    align-items: center;
    text-align: center;
    padding: 1.5rem;
  }
  
  .actor-name {
    font-size: 2rem;
  }
}
</style>
