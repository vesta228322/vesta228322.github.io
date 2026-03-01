import { createRouter, createWebHashHistory } from "vue-router";
import HomePage from "@/pages/HomePage.vue";
import SearchPage from "@/pages/SearchPage.vue";
import MoviePage from "@/pages/MoviePage.vue";

const routes = [
  { path: "/", component: HomePage },
  { path: "/search", component: SearchPage },
  { path: "/movie/:id", component: MoviePage },
];

const router = createRouter({
  history: createWebHashHistory(),
  routes,
  scrollBehavior() {
    return { top: 0 };
  },
});

export default router;
