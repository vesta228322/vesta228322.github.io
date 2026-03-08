import { ref } from 'vue'

// Singleton state — один инстанс на всё приложение
const toasts = ref([])

export function useToast() {
  const add = (message, type = 'info', duration = 3500) => {
    const id = Date.now() + Math.random()
    toasts.value.push({ id, message, type })
    setTimeout(() => remove(id), duration)
  }

  const remove = (id) => {
    const idx = toasts.value.findIndex(t => t.id === id)
    if (idx !== -1) toasts.value.splice(idx, 1)
  }

  return {
    toasts,
    success: (msg) => add(msg, 'success'),
    error:   (msg) => add(msg, 'error', 4500),
    info:    (msg) => add(msg, 'info'),
    remove,
  }
}
