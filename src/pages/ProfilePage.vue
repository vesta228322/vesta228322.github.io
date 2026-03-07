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
            <div class="profile-actions">
              <button @click="auth.logout" class="logout-btn primary">
                <LogOut :size="16" /> Выйти из аккаунта
              </button>
            </div>
          </div>
        </header>

        <section class="stats-grid">
          <div class="stat-card glass">
            <span class="stat-label">Просмотрено фильмов</span>
            <span class="stat-value">{{ history.length }}</span>
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
import { supabase } from '@/api/supabase'
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
  gap: 2.5rem;
  padding: 3rem;
  margin-bottom: 2rem;
  background: linear-gradient(145deg, rgba(20,20,30,0.8) 0%, rgba(30,25,45,0.6) 100%);
  position: relative;
  overflow: hidden;
}

.profile-header::before {
  content: '';
  position: absolute;
  top: 0; right: 0; width: 300px; height: 300px;
  background: radial-gradient(circle, var(--accent) 0%, transparent 70%);
  opacity: 0.1;
  filter: blur(40px);
  transform: translate(30%, -30%);
}

.avatar-large {
  width: 100px; 
  height: 100px;
  background: var(--bg-secondary);
  border-radius: 50%;
  display: flex; 
  align-items: center; 
  justify-content: center;
  position: relative;
  z-index: 2;
  box-shadow: 0 0 0 2px rgba(108, 99, 255, 0.3), 0 5px 15px rgba(0,0,0,0.3); /* Уменьшили обводку и тень */
}

.avatar-large::after {
  content: '';
  position: absolute;
  inset: -3px; /* Уменьшили толщину градиентной рамки */
  border-radius: 50%;
  background: conic-gradient(from 0deg, var(--accent), #ff75e6, var(--accent));
  z-index: -1;
  animation: rotate 4s linear infinite;
  opacity: 0.8;
}

@keyframes rotate {
  100% { transform: rotate(360deg); }
}

.avatar-large img { 
  width: 100%; 
  height: 100%; 
  object-fit: cover; 
  border-radius: 50%; 
  border: 3px solid var(--bg-card); /* Отсекаем градиент изнутри тоньше */
}

.profile-info {
  z-index: 2;
}

.profile-info h1 { 
  margin-bottom: 0.4rem; 
  font-size: 2.2rem; 
  font-weight: 900; 
  letter-spacing: -0.5px;
  background: linear-gradient(100deg, #ffffff, #dcdcdc);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
}

.email { 
  color: var(--accent); 
  margin-bottom: 1.5rem; 
  font-size: 1rem; 
  font-weight: 600;
  letter-spacing: 0.5px;
}

.profile-actions {
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
}

.logout-btn {
  display: flex; 
  align-items: center; 
  gap: 0.5rem;
  padding: 0.6rem 1.4rem; 
  border-radius: 12px;
  font-size: 0.85rem; 
  font-weight: 700; 
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}

.logout-btn.secondary {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid var(--border);
  color: var(--text-muted);
}

.logout-btn.secondary:hover {
  background: rgba(255, 255, 255, 0.1);
  color: #fff;
}

.logout-btn.primary {
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.2);
  color: #f87171; 
}

.logout-btn.primary:hover { 
  background: rgba(239, 68, 68, 0.2); 
  border-color: rgba(239, 68, 68, 0.4); 
  color: #fca5a5;
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(239, 68, 68, 0.2);
}

.stats-grid {
  display: grid;
  grid-template-columns: 1fr;
  max-width: 400px; /* Сделаем карточку компактнее, т.к. она теперь одна */
  gap: 1.5rem;
  margin-bottom: 3.5rem;
}

.stat-card {
  padding: 2.5rem 2rem;
  display: flex; 
  flex-direction: column; 
  gap: 0.8rem;
  text-align: center;
  position: relative;
  overflow: hidden;
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}

@media (hover: hover) {
  .stat-card:hover {
    transform: translateY(-5px);
    box-shadow: 0 15px 35px rgba(0,0,0,0.3);
  }
  .stat-card:hover::before {
    opacity: 0.15;
  }
}

.stat-card::before {
  content: '';
  position: absolute;
  top: 0; left: 0; width: 100%; height: 100%;
  background: linear-gradient(45deg, transparent, var(--accent), transparent);
  opacity: 0.05;
  transition: opacity 0.3s ease;
}

.stat-label { 
  font-size: 0.85rem; 
  color: var(--text-muted); 
  text-transform: uppercase; 
  letter-spacing: 2px; 
  font-weight: 700; 
  z-index: 1;
}

.stat-value { 
  font-size: 3rem; 
  font-weight: 900; 
  color: #fff;
  text-shadow: 0 0 20px rgba(108, 99, 255, 0.4);
  z-index: 1;
}

.account-section h2 { 
  margin-bottom: 2rem; 
  font-weight: 900; 
  font-size: 1.8rem; 
  display: inline-block;
  position: relative;
}

.account-section h2::after {
  content: '';
  position: absolute;
  bottom: -8px;
  left: 0;
  width: 40px;
  height: 4px;
  background: var(--accent);
  border-radius: 2px;
}

.history-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
  gap: 1.5rem;
}

.empty-state {
  text-align: center; 
  padding: 6rem 2rem; 
  color: var(--text-muted);
  display: flex; 
  flex-direction: column; 
  align-items: center; 
  gap: 1.5rem;
  background: var(--bg-card);
  border-radius: var(--radius-lg);
  border: 1px solid var(--border);
  border-style: dashed;
}

@media (max-width: 600px) {
  .profile-header { 
    flex-direction: column; 
    text-align: center; 
    padding: 2.5rem 1.5rem; 
    gap: 1.5rem;
  }
  .logout-btn { margin: 0 auto; }
  .stats-grid { grid-template-columns: 1fr; gap: 1rem; }
  .stat-card { padding: 2rem 1.5rem; }
  .login-card { margin: 2rem 1rem; padding: 2.5rem 1.5rem; }
}
</style>
