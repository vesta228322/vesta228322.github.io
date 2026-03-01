<template>
  <header class="navbar glass">
    <div class="container navbar-inner">
      <!-- Логотип -->
      <RouterLink to="/" class="logo">
        <span class="logo-icon">▶</span>
        <span class="logo-text">Kino<span class="gradient-text">Flow</span></span>
      </RouterLink>

      <!-- Десктопная навигация -->
      <nav class="nav-links">
        <RouterLink to="/" class="nav-link" exact-active-class="nav-link--active">
          <span class="nav-icon">🏠</span> Главная
        </RouterLink>
        <RouterLink to="/top" class="nav-link" active-class="nav-link--active">
          <span class="nav-icon">🔥</span> Популярное
        </RouterLink>
      </nav>

      <!-- Бургер (мобильный) -->
      <button class="burger" :class="{ open: menuOpen }" @click="menuOpen = !menuOpen">
        <span></span><span></span><span></span>
      </button>
    </div>

    <!-- Мобильное выпадающее меню -->
    <transition name="slide-down">
      <div v-if="menuOpen" class="mobile-menu glass">
        <RouterLink to="/" class="mobile-link" @click="menuOpen = false">
          <span class="mobile-icon">🏠</span> Главная
        </RouterLink>
        <RouterLink to="/top" class="mobile-link" @click="menuOpen = false">
          <span class="mobile-icon">🔥</span> Популярное
        </RouterLink>
      </div>
    </transition>
  </header>

  <!-- Мобильная нижняя панель (как в reyohoho) -->
  <nav class="bottom-nav glass">
    <RouterLink to="/" class="bottom-nav-item" exact-active-class="bottom-nav-item--active">
      <span class="bottom-icon">🏠</span>
      <span class="bottom-label">Главная</span>
    </RouterLink>
    <RouterLink to="/top" class="bottom-nav-item" active-class="bottom-nav-item--active">
      <span class="bottom-icon">🔥</span>
      <span class="bottom-label">Топ</span>
    </RouterLink>
    <button class="bottom-nav-item" @click="$emit('random')">
      <span class="bottom-icon">🎲</span>
      <span class="bottom-label">Случайный</span>
    </button>
  </nav>
</template>

<script setup>
import { ref } from 'vue'
defineEmits(['random'])
const menuOpen = ref(false)
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

.nav-link:hover,
.nav-link--active {
  color: var(--text-primary);
  background: var(--bg-card);
}

.nav-link--active {
  color: var(--accent-2);
}

.nav-icon {
  font-size: 1rem;
}

/* Бургер */
.burger {
  display: none;
  flex-direction: column;
  gap: 5px;
  padding: 6px;
  margin-left: auto;
  transition: transform var(--transition);
}

.burger span {
  display: block;
  width: 22px;
  height: 2px;
  background: var(--text-primary);
  border-radius: 2px;
  transition: all var(--transition);
}

.burger.open span:nth-child(1) { transform: rotate(45deg) translate(5px, 5px); }
.burger.open span:nth-child(2) { opacity: 0; }
.burger.open span:nth-child(3) { transform: rotate(-45deg) translate(5px, -5px); }

/* Мобильное меню */
.mobile-menu {
  border-top: 1px solid var(--border);
  padding: 0.5rem 0;
}

.mobile-link {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.85rem 1.5rem;
  font-size: 1rem;
  font-weight: 700;
  color: var(--text-secondary);
  transition: color var(--transition), background var(--transition);
}

.mobile-link:hover {
  color: var(--text-primary);
  background: var(--bg-card);
}

.mobile-icon { font-size: 1.1rem; }

/* Анимация */
.slide-down-enter-active,
.slide-down-leave-active {
  transition: all 0.25s ease;
}
.slide-down-enter-from,
.slide-down-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}

/* Нижняя панель (мобильная) */
.bottom-nav {
  display: none;
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  height: 60px;
  z-index: 100;
  border-top: 1px solid var(--border);
  justify-content: space-around;
  align-items: center;
  padding: 0 1rem;
}

.bottom-nav-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  color: var(--text-muted);
  font-family: inherit;
  background: none;
  border: none;
  cursor: pointer;
  padding: 0.5rem 1rem;
  border-radius: var(--radius-sm);
  transition: color var(--transition);
  text-decoration: none;
}

.bottom-nav-item:hover,
.bottom-nav-item--active {
  color: var(--accent-2);
}

.bottom-icon { font-size: 1.3rem; }
.bottom-label { font-size: 0.68rem; font-weight: 700; }

@media (max-width: 768px) {
  .nav-links { display: none; }
  .burger { display: flex; }
  .bottom-nav { display: flex; }
}
</style>
