<template>
  <header class="navbar glass">
    <div class="container navbar-inner">
      <!-- Логотип -->
      <RouterLink to="/" class="logo">
        <span class="logo-icon">▶</span>
        <span class="logo-text"
          >Kino<span class="gradient-text">Flow</span></span
        >
      </RouterLink>

      <!-- Поиск -->
      <div class="search-wrapper" :class="{ focused: searchFocused }">
        <span class="search-icon">⌕</span>
        <input
          ref="searchInput"
          v-model="query"
          type="text"
          placeholder="Найти фильм или сериал..."
          @focus="searchFocused = true"
          @blur="searchFocused = false"
          @keydown.enter="doSearch"
        />
        <button v-if="query" class="clear-btn" @click="clearSearch">✕</button>
      </div>

      <!-- Навигация -->
      <nav class="nav-links">
        <RouterLink to="/" class="nav-link">Главная</RouterLink>
        <RouterLink to="/search?genre=28" class="nav-link">Боевики</RouterLink>
        <RouterLink to="/search?genre=35" class="nav-link">Комедии</RouterLink>
        <RouterLink to="/search?genre=27" class="nav-link">Ужасы</RouterLink>
      </nav>

      <!-- Мобильный бургер -->
      <button class="burger" @click="menuOpen = !menuOpen">
        <span></span><span></span><span></span>
      </button>
    </div>

    <!-- Мобильное меню -->
    <div v-if="menuOpen" class="mobile-menu glass">
      <RouterLink to="/" class="mobile-link" @click="menuOpen = false"
        >Главная</RouterLink
      >
      <RouterLink
        to="/search?genre=28"
        class="mobile-link"
        @click="menuOpen = false"
        >Боевики</RouterLink
      >
      <RouterLink
        to="/search?genre=35"
        class="mobile-link"
        @click="menuOpen = false"
        >Комедии</RouterLink
      >
      <RouterLink
        to="/search?genre=27"
        class="mobile-link"
        @click="menuOpen = false"
        >Ужасы</RouterLink
      >
    </div>
  </header>
</template>

<script setup>
import { ref } from "vue";
import { useRouter } from "vue-router";

const router = useRouter();
const query = ref("");
const searchFocused = ref(false);
const menuOpen = ref(false);

const doSearch = () => {
  if (query.value.trim()) {
    router.push({ path: "/search", query: { q: query.value.trim() } });
  }
};

const clearSearch = () => {
  query.value = "";
};
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
  gap: 1.5rem;
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

/* Поиск */
.search-wrapper {
  flex: 1;
  max-width: 480px;
  display: flex;
  align-items: center;
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: var(--radius-xl);
  padding: 0 1rem;
  gap: 0.5rem;
  transition:
    border-color var(--transition),
    box-shadow var(--transition);
}

.search-wrapper.focused {
  border-color: var(--accent);
  box-shadow: 0 0 16px var(--accent-glow);
}

.search-icon {
  font-size: 1.2rem;
  color: var(--text-secondary);
  user-select: none;
}

.search-wrapper input {
  flex: 1;
  background: none;
  border: none;
  outline: none;
  color: var(--text-primary);
  font-family: inherit;
  font-size: 0.95rem;
  padding: 0.6rem 0;
}

.search-wrapper input::placeholder {
  color: var(--text-muted);
}

.clear-btn {
  color: var(--text-secondary);
  font-size: 0.8rem;
  padding: 2px 6px;
  border-radius: 50%;
  transition: color var(--transition);
}

.clear-btn:hover {
  color: var(--text-primary);
}

/* Навигация */
.nav-links {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  flex-shrink: 0;
}

.nav-link {
  padding: 0.4rem 0.85rem;
  border-radius: var(--radius-sm);
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--text-secondary);
  transition:
    color var(--transition),
    background var(--transition);
}

.nav-link:hover,
.nav-link.router-link-active {
  color: var(--text-primary);
  background: var(--bg-card);
}

.nav-link.router-link-exact-active {
  color: var(--accent-2);
}

/* Бургер */
.burger {
  display: none;
  flex-direction: column;
  gap: 5px;
  padding: 4px;
  margin-left: auto;
}

.burger span {
  display: block;
  width: 24px;
  height: 2px;
  background: var(--text-primary);
  border-radius: 2px;
  transition: var(--transition);
}

/* Мобильное меню */
.mobile-menu {
  display: none;
  flex-direction: column;
  padding: 1rem 1.5rem 1.5rem;
  border-top: 1px solid var(--border);
}

.mobile-link {
  padding: 0.75rem 0;
  font-size: 1rem;
  font-weight: 700;
  color: var(--text-secondary);
  border-bottom: 1px solid var(--border);
  transition: color var(--transition);
}

.mobile-link:hover {
  color: var(--accent-2);
}

@media (max-width: 900px) {
  .nav-links {
    display: none;
  }
  .burger {
    display: flex;
  }
  .mobile-menu {
    display: flex;
  }
  .search-wrapper {
    max-width: 100%;
  }
}
</style>
