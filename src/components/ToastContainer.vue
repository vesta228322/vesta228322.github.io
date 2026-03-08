<template>
  <Teleport to="body">
    <div class="toast-container" aria-live="polite">
      <TransitionGroup name="toast">
        <div
          v-for="toast in toasts"
          :key="toast.id"
          class="toast"
          :class="toast.type"
          @click="remove(toast.id)"
        >
          <CheckCircle2 v-if="toast.type === 'success'" :size="18" class="toast-icon" />
          <AlertCircle  v-else-if="toast.type === 'error'"   :size="18" class="toast-icon" />
          <Info          v-else                               :size="18" class="toast-icon" />
          <span>{{ toast.message }}</span>
        </div>
      </TransitionGroup>
    </div>
  </Teleport>
</template>

<script setup>
import { CheckCircle2, AlertCircle, Info } from 'lucide-vue-next'
import { useToast } from '@/composables/useToast'

const { toasts, remove } = useToast()
</script>

<style scoped>
.toast-container {
  position: fixed;
  bottom: 5rem;
  right: 1.5rem;
  z-index: 9999;
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
  pointer-events: none;
}

.toast {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  padding: 0.8rem 1.2rem;
  border-radius: 14px;
  font-size: 0.88rem;
  font-weight: 600;
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  box-shadow: 0 8px 32px rgba(0,0,0,0.4);
  cursor: pointer;
  pointer-events: all;
  max-width: 320px;
}

.toast.success {
  background: rgba(34, 197, 94, 0.15);
  border: 1px solid rgba(34, 197, 94, 0.3);
  color: #4ade80;
}
.toast.error {
  background: rgba(239, 68, 68, 0.15);
  border: 1px solid rgba(239, 68, 68, 0.3);
  color: #f87171;
}
.toast.info {
  background: rgba(108, 99, 255, 0.15);
  border: 1px solid rgba(108, 99, 255, 0.3);
  color: #a78bfa;
}

.toast-icon { flex-shrink: 0; }

/* Анимации */
.toast-enter-active { transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275); }
.toast-leave-active { transition: all 0.25s ease-in; }
.toast-enter-from  { opacity: 0; transform: translateX(40px) scale(0.9); }
.toast-leave-to    { opacity: 0; transform: translateX(40px); }
</style>
