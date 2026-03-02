import { createRouter, createWebHistory } from 'vue-router'
import HomePage from '@/pages/HomePage.vue'
import MoviePage from '@/pages/MoviePage.vue'
import TopPage from '@/pages/TopPage.vue'

const routes = [
  { path: '/', component: HomePage },
  { path: '/movie/:id', component: MoviePage },
  { path: '/top', component: TopPage },
  { path: '/search', redirect: '/' },
]

const router = createRouter({
  history: createWebHistory('/kinoflow/'),
  routes,
  scrollBehavior() {
    return { top: 0 }
  },
})

export default router
