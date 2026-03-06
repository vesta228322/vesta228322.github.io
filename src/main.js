import { createApp } from "vue";
import { createPinia } from "pinia";
import App from "./App.vue";
import router from "./router";
import "./assets/main.css";

const app = createApp(App);
const pinia = createPinia();
app.use(pinia);
app.use(router);

// Инициализация Supabase Auth
import { useAuthStore } from './stores/auth';
const auth = useAuthStore(pinia);
auth.init();

// Передаем данные в Яндекс Метрику и обновляем заголовок страницы
router.afterEach((to) => {
  // Метрика
  if (typeof window.ym !== 'undefined') {
    window.ym(107061804, 'hit', to.fullPath);
  }

  // Динамический SEO заголовок
  let title = 'KinoFlow — смотри фильмы онлайн'
  if (to.path === '/top') title = 'KinoFlow — Популярные фильмы и сериалы'
  if (to.path.includes('/movie/')) title = 'KinoFlow — Просмотр фильма'
  
  document.title = title
});

app.mount("#app");
