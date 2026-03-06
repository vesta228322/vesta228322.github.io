<template>
  <div class="profile-page container fade-in">
    <div v-if="auth.loading" class="loading-state">
      <div class="spinner"></div>
    </div>

    <template v-else>
      <!-- AUTHENTICATED -->
      <div v-if="auth.user" class="profile-layout">
        <header class="profile-header glass">
          <div class="avatar-large">
            <img v-if="auth.user.user_metadata.avatar_url" :src="auth.user.user_metadata.avatar_url" alt="Avatar" />
            <User v-else :size="64" />
          </div>
          <div class="profile-info">
            <h1>{{ auth.user.user_metadata.name || auth.user.user_metadata.full_name || 'Пользователь Telegram' }}</h1>
            <p v-if="auth.user.user_metadata.username" class="email">@{{ auth.user.user_metadata.username }}</p>
            <p v-else class="email">ID: {{ auth.user.user_metadata.provider_id }}</p>
            <button @click="auth.logout" class="logout-btn">
              <LogOut :size="16" /> Выйти
            </button>
          </div>
        </header>

        <section class="stats-grid">
          <div class="stat-card glass">
            <span class="stat-label">Фильмов просмотрено</span>
            <span class="stat-value">{{ history.length }}</span>
          </div>
          <div class="stat-card glass">
            <span class="stat-label">В избранном</span>
            <span class="stat-value">0</span>
          </div>
        </section>

        <section class="account-section">
          <h2>История просмотров</h2>
          <div v-if="history.length" class="history-grid">
            <MovieCard v-for="m in history" :key="m.id" :movie="m" />
          </div>
          <div v-else class="empty-state">
            <Film :size="48" />
            <p>Вы пока не смотрели фильмы</p>
          </div>
        </section>
      </div>

      <!-- NOT AUTHENTICATED -->
      <div v-else class="login-card glass fade-in">
        <div class="login-content">
          <div class="login-brand">
            <div class="logo-circle">
              <Play :size="32" fill="var(--accent)" />
            </div>
            <h1>KinoFlow <span class="accent-text">Profile</span></h1>
          </div>
          
          <div class="login-info">
            <p>Войдите, чтобы синхронизировать историю просмотров и избранное между всеми вашими устройствами.</p>
          </div>

          <TelegramLoginWidget 
            :botName="telegramBotName" 
            buttonSize="large" 
            :cornerRadius="12" 
          />

          <p class="login-footer">
            Мы используем официальный виджет Telegram. Безопасно, быстро и без паролей.
          </p>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { User, LogOut, Play, Send, Film } from 'lucide-vue-next'
import MovieCard from '@/components/MovieCard.vue'
import TelegramLoginWidget from '@/components/TelegramLoginWidget.vue'

const auth = useAuthStore()
const history = ref([])
// Название бота (без @), берется из env или нужно вписать вручную
const telegramBotName = import.meta.env.VITE_TELEGRAM_BOT_NAME || 'MyKinoFlowBot'

const loadHistory = async () => {
  try {
    // 1. Сначала грузим локальную (для скорости)
    const local = JSON.parse(localStorage.getItem('kf_history') || '[]')
    history.value = local

    // 2. Если залогинен и Supabase инициализирован — тянем из облака
    if (auth.user && supabase) {
      const { data, error } = await supabase
        .from('history')
        .select('*')
        .eq('user_id', auth.user.id)
        .order('viewed_at', { ascending: false })
        .limit(20)

      if (error) throw error
      
      if (data && data.length > 0) {
        // Трансформируем данные из Supabase в формат MovieCard
        history.value = data.map(item => ({
          id: item.movie_id,
          title: item.title,
          posterUrl: item.poster_url,
          vote_average: item.vote_average,
          release_date: item.release_date
        }))
      }
    }
  } catch (e) {
    console.error('History load error:', e)
  }
}

onMounted(() => {
  loadHistory()
})
</script>

<style scoped>
.profile-page {
  padding: 2rem 0 6rem;
  max-width: 900px;
}

.glass {
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  backdrop-filter: blur(12px);
  box-shadow: var(--shadow-xl);
}

/* Telegram Login Card */
.login-card {
  max-width: 450px;
  margin: 5rem auto;
  padding: 3.5rem 2.5rem;
  text-align: center;
}

.login-brand {
  margin-bottom: 2rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
}

.logo-circle {
  width: 70px;
  height: 70px;
  background: rgba(108, 99, 255, 0.1);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 2px solid var(--accent);
}

.login-brand h1 {
  font-size: 2rem;
  font-weight: 900;
  letter-spacing: -1px;
}

.accent-text { color: var(--accent); }

.login-info {
  margin-bottom: 2.5rem;
}

.login-info p {
  color: var(--text-muted);
  font-size: 1rem;
  line-height: 1.6;
}

.telegram-button-wrapper {
  margin: 1.5rem 0;
}

/* Старая кнопка удалена, стили оставлены для .login-footer ниже */

.login-footer {
  margin-top: 2rem;
  font-size: 0.8rem;
  color: var(--text-muted);
  opacity: 0.6;
}

/* Profile Layout */
.profile-header {
  display: flex;
  align-items: center;
  gap: 2rem;
  padding: 2.5rem;
  margin-bottom: 2rem;
}

.avatar-large {
  width: 90px; height: 90px;
  background: var(--bg-secondary);
  border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  overflow: hidden;
  border: 3px solid var(--accent);
}

.avatar-large img { width: 100%; height: 100%; object-fit: cover; }

.profile-info h1 { margin-bottom: 0.3rem; font-size: 1.8rem; font-weight: 900; }
.email { color: var(--text-muted); margin-bottom: 1.2rem; font-size: 0.95rem; }

.logout-btn {
  display: flex; align-items: center; gap: 0.5rem;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid var(--border);
  color: #fff; padding: 0.5rem 1.2rem; border-radius: var(--radius-md);
  font-size: 0.85rem; font-weight: 700; cursor: pointer;
  transition: all 0.2s;
}

.logout-btn:hover { background: rgba(239, 68, 68, 0.1); border-color: #ef444455; color: #f87171; }

.stats-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1.5rem;
  margin-bottom: 3rem;
}

.stat-card {
  padding: 1.8rem;
  display: flex; flex-direction: column; gap: 0.6rem;
  text-align: center;
}

.stat-label { font-size: 0.8rem; color: var(--text-muted); text-transform: uppercase; letter-spacing: 1.5px; font-weight: 600; }
.stat-value { font-size: 2.2rem; font-weight: 900; color: var(--accent); }

.account-section h2 { margin-bottom: 1.5rem; font-weight: 900; font-size: 1.5rem; }

.history-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(130px, 1fr));
  gap: 1.5rem;
}

.empty-state {
  text-align: center; padding: 5rem; color: var(--text-muted);
  display: flex; flex-direction: column; align-items: center; gap: 1.2rem;
}

@media (max-width: 600px) {
  .profile-header { flex-direction: column; text-align: center; padding: 2rem; }
  .stats-grid { grid-template-columns: 1fr; }
  .login-card { margin: 2rem 1rem; padding: 2.5rem 1.5rem; }
}
</style>
