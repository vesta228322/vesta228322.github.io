<script setup>
import { onMounted, ref } from 'vue'
import { useAuthStore } from '@/stores/auth'

const props = defineProps({
  botName: {
    type: String,
    required: true
  },
  buttonSize: {
    type: String,
    default: 'large', // large, medium, small
  },
  cornerRadius: {
    type: Number,
    default: 8
  },
  requestAccess: {
    type: String,
    default: 'write'
  }
})

const authStore = useAuthStore()
const containerId = 'telegram-login-container'

onMounted(() => {
  // Телеграм заменяет script на iframe кнопку. 
  // Мы делаем это программно, чтобы кнопка реагировала на события Vue.
  window.onTelegramAuth = async (user) => {
    // Эта функция вызывается виджетом при успешной авторизации в Телеграм
    try {
      await authStore.signInWithTelegramEdgeFunction(user)
    } catch (e) {
      // Игнорируем логирование успешной работы самой функции во фронтенде кроме явного сбоя сети
    }
  }

  const script = document.createElement('script')
  script.src = 'https://telegram.org/js/telegram-widget.js?22'
  script.setAttribute('data-telegram-login', props.botName)
  script.setAttribute('data-size', props.buttonSize)
  script.setAttribute('data-radius', props.cornerRadius)
  script.setAttribute('data-request-access', props.requestAccess)
  script.setAttribute('data-onauth', 'window.onTelegramAuth(user)')
  script.async = true
  
  document.getElementById(containerId).appendChild(script)
})
</script>

<template>
  <div :id="containerId" class="telegram-button-wrapper">
    <!-- Виджет будет внедрен сюда скриптом -->
  </div>
</template>

<style scoped>
.telegram-button-wrapper {
  display: flex;
  justify-content: center;
  align-items: center;
}
</style>
