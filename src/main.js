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

// SEO и Метрика
import { updateSEO } from './api/seo';
router.afterEach((to) => {
  updateSEO(to);
});

app.mount("#app");
