<template>
  <header class="navbar glass">
    <div class="container navbar-inner">
      <!-- Логотип -->
      <RouterLink to="/" class="logo">
        <Play :size="20" class="logo-icon" fill="currentColor" />
        <span class="logo-text">Kino<span class="gradient-text">Flow</span></span>
      </RouterLink>

      <!-- Десктопная навигация -->
      <nav class="nav-links">
        <RouterLink to="/" class="nav-link" exact-active-class="nav-link--active">
          <House :size="18" /> Главная
        </RouterLink>
        <RouterLink to="/top" class="nav-link" active-class="nav-link--active">
          <Flame :size="18" /> Популярное
        </RouterLink>
      </nav>
    </div>
  </header>

  <!-- Мобильная нижняя панель (как в reyohoho) -->
  <nav class="bottom-nav glass">
    <RouterLink to="/" class="bottom-nav-item" exact-active-class="bottom-nav-item--active">
      <House :size="24" />
      <span class="bottom-label">Главная</span>
    </RouterLink>
    <RouterLink to="/top" class="bottom-nav-item" active-class="bottom-nav-item--active">
      <Flame :size="24" />
      <span class="bottom-label">Топ</span>
    </RouterLink>
    <button class="bottom-nav-item" @click="$emit('random')">
      <Dices :size="24" />
      <span class="bottom-label">Случайный</span>
    </button>
  </nav>
</template>

<script setup>
import { House, Flame, Dices, Play } from 'lucide-vue-next'
defineEmits(['random'])
</script>

<style scoped>
.navbar {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  height: var(--nav-height);
  z-index: 100;
  border-bottom: 1px solid var(--border);
}

.navbar-inner {
  display: flex;
  align-items: center;
  height: 100%;
  gap: 2rem;
}

/* Логотип */
.logo {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 1.4rem;
  font-weight: 900;
  letter-spacing: -1px;
  flex-shrink: 0;
}

.logo-icon {
  font-size: 1.1rem;
  color: var(--accent);
  filter: drop-shadow(0 0 6px var(--accent));
}

/* Десктопная навигация */
.nav-links {
  display: flex;
  align-items: center;
  gap: 0.25rem;
}

.nav-link {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.45rem 1rem;
  border-radius: var(--radius-sm);
  font-size: 0.92rem;
  font-weight: 700;
  color: var(--text-secondary);
  transition: color var(--transition), background var(--transition);
}

@media (hover: hover) {
  .nav-link:hover,
  .nav-link--active {
    color: var(--text-primary);
    background: var(--bg-card);
  }
}

.nav-link--active {
  color: var(--accent-2);
  background: var(--bg-card);
}

.nav-icon {
  font-size: 1rem;
}

/* Нижняя панель (мобильная) */
.bottom-nav {
  display: none;
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  height: 64px;
  z-index: 100;
  border-top: 1px solid var(--border);
  justify-content: space-around;
  align-items: center;
  padding: 0 1rem;
  padding-bottom: env(safe-area-inset-bottom);
}

.bottom-nav-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 2px;
  color: var(--text-muted);
  font-family: inherit;
  background: none;
  border: none;
  cursor: pointer;
  padding: 0.5rem;
  min-width: 60px;
  border-radius: var(--radius-sm);
  transition: color var(--transition), transform 0.2s ease;
  text-decoration: none;
}

.bottom-nav-item:active {
  transform: scale(0.9);
}

@media (hover: hover) {
  .bottom-nav-item:hover,
  .bottom-nav-item--active {
    color: var(--accent-2);
  }
}

.bottom-nav-item--active {
  color: var(--accent-2);
}

.bottom-icon { font-size: 1.4rem; line-height: 1; }
.bottom-label { font-size: 0.72rem; font-weight: 700; }

@media (max-width: 768px) {
  .nav-links { display: none; }
  .bottom-nav { display: flex; }
  .logo { margin: 0 auto; } /* Центрируем лого на мобилках */
}
</style>
