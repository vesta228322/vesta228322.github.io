import { createApp } from "vue";
import { createPinia } from "pinia";
import App from "./App.vue";
import router from "./router";
import "./assets/main.css";

const app = createApp(App);
app.use(createPinia());
app.use(router);

// Передаем данные в Яндекс Метрику при смене страниц (для SPA)
router.afterEach((to) => {
  if (typeof window.ym !== 'undefined') {
    window.ym(107061804, 'hit', to.fullPath);
  }
});

app.mount("#app");
