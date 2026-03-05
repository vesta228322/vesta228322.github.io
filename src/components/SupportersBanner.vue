<template>
  <div class="supporters-banner">
    <div class="banner-title">
      <Heart :size="16" class="heart-icon" /> Поддержали проект:
    </div>
    
    <div 
      class="banner-content" 
      @mouseenter="pauseTimer" 
      @mouseleave="resumeTimer"
    >
      <Transition name="fade-slide" mode="out-in">
        <a 
          :key="currentIndex"
          :href="currentSupporter.url" 
          target="_blank" 
          rel="noopener noreferrer" 
          class="supporter-card"
        >
          <div class="avatar-wrapper">
            <img :src="currentSupporter.avatar" :alt="currentSupporter.name" class="avatar" />
            <div class="twitch-badge">
              <Twitch :size="10" fill="currentColor" />
            </div>
          </div>
          <div class="supporter-info">
            <span class="name">{{ currentSupporter.name }}</span>
            <span class="role">{{ currentSupporter.role }}</span>
          </div>
          <div class="visit-btn">
            Смотреть <ExternalLink :size="14" />
          </div>
        </a>
      </Transition>
      
      <!-- Прогресс-бар -->
      <div class="progress-container">
        <div 
          class="progress-bar" 
          :style="{ width: progress + '%', transition: isPaused ? 'none' : 'width 0.1s linear' }"
        ></div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { Heart, ExternalLink, Twitch } from 'lucide-vue-next'

const currentIndex = ref(0)
const isPaused = ref(false)
const progress = ref(0)
const ROTATION_TIME = 7000 // 7 секунд
const PROGRESS_STEP = 100 // обновляем каждые 100мс

const supporters = [
  {
    name: 'vadimaster2000',
    role: 'VIP Спонсор',
    avatar: 'https://static-cdn.jtvnw.net/jtv_user_pictures/dea00fe4-c53f-4a7c-abec-896a0c31331d-profile_image-70x70.png',
    url: 'https://www.twitch.tv/vadimaster2000'
  },
  {
    name: 'y0shi_meow',
    role: 'VIP Спонсор',
    avatar: 'https://static-cdn.jtvnw.net/jtv_user_pictures/0abb7633-f11d-4bdd-9308-68cadec71bfd-profile_image-70x70.png',
    url: 'https://www.twitch.tv/y0shi_meow'
  }
]

const currentSupporter = computed(() => supporters[currentIndex.value])

let timer = null
let progressTimer = null

const startRotation = () => {
  progressTimer = setInterval(() => {
    if (!isPaused.value) {
      progress.value += (PROGRESS_STEP / ROTATION_TIME) * 100
      if (progress.value >= 100) {
        nextSupporter()
      }
    }
  }, PROGRESS_STEP)
}

const nextSupporter = () => {
  progress.value = 0
  currentIndex.value = (currentIndex.value + 1) % supporters.length
}

const pauseTimer = () => {
  isPaused.value = true
}

const resumeTimer = () => {
  isPaused.value = false
}

onMounted(() => {
  startRotation()
})

onUnmounted(() => {
  clearInterval(progressTimer)
})
</script>

<style scoped>
.supporters-banner {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 2rem;
  background: rgba(10, 10, 15, 0.85);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border-top: 1px solid rgba(145, 70, 255, 0.2);
  padding: 0.8rem 0;
  width: 100%;
  box-shadow: 0 -10px 40px rgba(0, 0, 0, 0.5);
  position: relative;
  z-index: 40;
}

.banner-title {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  color: var(--text-muted);
  font-size: 0.8rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 1.5px;
  white-space: nowrap;
}

.heart-icon {
  color: #ff4d4d;
  animation: heartbeat 1.5s infinite ease-in-out;
}

@keyframes heartbeat {
  0% { transform: scale(1); }
  15% { transform: scale(1.2); }
  30% { transform: scale(1); }
  45% { transform: scale(1.2); }
  100% { transform: scale(1); }
}

.banner-content {
  position: relative;
  min-width: 320px;
  height: 50px;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.supporter-card {
  display: flex;
  align-items: center;
  gap: 1rem;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.1);
  padding: 0.4rem 1.25rem 0.4rem 0.5rem;
  border-radius: 16px;
  text-decoration: none;
  transition: all 0.4s cubic-bezier(0.23, 1, 0.32, 1);
  position: absolute;
  left: 0;
  right: 0;
}

.supporter-card:hover {
  background: rgba(145, 70, 255, 0.12);
  border-color: rgba(145, 70, 255, 0.4);
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(145, 70, 255, 0.2);
}

.avatar-wrapper {
  position: relative;
  width: 40px;
  height: 40px;
  border-radius: 12px;
  padding: 2px;
  background: rgba(255, 255, 255, 0.1);
  transition: all 0.3s ease;
}

.supporter-card:hover .avatar-wrapper {
  background: linear-gradient(135deg, #9146FF, #c084fc);
  transform: rotate(-3deg);
}

.avatar {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 10px;
}

.twitch-badge {
  position: absolute;
  bottom: -4px;
  right: -4px;
  background: #9146FF;
  color: #fff;
  width: 16px;
  height: 16px;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 2px solid #000;
  box-shadow: 0 2px 5px rgba(0,0,0,0.5);
}

.supporter-info {
  flex-grow: 1;
  display: flex;
  flex-direction: column;
}

.name {
  color: #fff;
  font-size: 0.95rem;
  font-weight: 800;
  letter-spacing: -0.2px;
}

.role {
  color: var(--accent);
  font-size: 0.65rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.8px;
  opacity: 0.8;
}

.visit-btn {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  font-size: 0.75rem;
  font-weight: 700;
  color: var(--text-muted);
  background: rgba(255,255,255,0.05);
  padding: 4px 10px;
  border-radius: 8px;
  transition: all 0.3s ease;
}

.supporter-card:hover .visit-btn {
  color: #fff;
  background: rgba(145, 70, 255, 0.3);
}

/* Прогресс-бар */
.progress-container {
  position: absolute;
  bottom: -15px;
  left: 0;
  right: 0;
  height: 2px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 2px;
  overflow: hidden;
}

.progress-bar {
  height: 100%;
  background: linear-gradient(to right, #9146FF, #ff75e6);
  box-shadow: 0 0 10px rgba(145, 70, 255, 0.5);
}

/* Анимации перехода */
.fade-slide-enter-active,
.fade-slide-leave-active {
  transition: all 0.5s cubic-bezier(0.4, 0, 0.2, 1);
}

.fade-slide-enter-from {
  opacity: 0;
  transform: translateY(10px);
}

.fade-slide-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}

@media (max-width: 768px) {
  .supporters-banner {
    flex-direction: column;
    padding: 1.5rem 1rem;
    gap: 1rem;
  }
  
  .banner-content {
    width: 100%;
    min-width: 0;
  }
}
</style>
