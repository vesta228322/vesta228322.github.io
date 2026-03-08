<template>
  <Teleport to="body">
    <Transition name="modal-fade">
      <div v-if="modelValue" class="modal-backdrop" @click.self="emit('update:modelValue', false)">
        <div class="modal-box" role="dialog" aria-modal="true">
          <AlertTriangle :size="32" class="modal-icon" />
          <h3 class="modal-title">{{ title }}</h3>
          <p class="modal-message">{{ message }}</p>
          <div class="modal-actions">
            <button class="btn-cancel" @click="emit('update:modelValue', false)">Отмена</button>
            <button class="btn-confirm" @click="onConfirm">{{ confirmText }}</button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { AlertTriangle } from 'lucide-vue-next'

const props = defineProps({
  modelValue:  { type: Boolean, default: false },
  title:       { type: String, default: 'Подтверждение' },
  message:     { type: String, default: 'Вы уверены?' },
  confirmText: { type: String, default: 'Удалить' },
})

const emit = defineEmits(['update:modelValue', 'confirm'])

const onConfirm = () => {
  emit('confirm')
  emit('update:modelValue', false)
}
</script>

<style scoped>
.modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.65);
  backdrop-filter: blur(8px);
  z-index: 5000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
}

.modal-box {
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: 20px;
  padding: 2.5rem;
  max-width: 380px;
  width: 100%;
  text-align: center;
  box-shadow: 0 25px 60px rgba(0,0,0,0.5);
}

.modal-icon { color: #ef4444; margin: 0 auto 1.25rem; display: block; }
.modal-title { font-size: 1.3rem; font-weight: 800; margin-bottom: 0.6rem; }
.modal-message { color: var(--text-muted); font-size: 0.9rem; margin-bottom: 2rem; line-height: 1.6; }

.modal-actions {
  display: flex;
  gap: 0.75rem;
  justify-content: center;
}

.btn-cancel,
.btn-confirm {
  padding: 0.65rem 1.5rem;
  border-radius: 12px;
  font-family: inherit;
  font-weight: 700;
  font-size: 0.9rem;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-cancel {
  background: rgba(255,255,255,0.06);
  border: 1px solid var(--border);
  color: var(--text-muted);
}
.btn-cancel:hover { background: rgba(255,255,255,0.1); color: #fff; }

.btn-confirm {
  background: rgba(239, 68, 68, 0.15);
  border: 1px solid rgba(239, 68, 68, 0.3);
  color: #f87171;
}
.btn-confirm:hover {
  background: #ef4444;
  border-color: #ef4444;
  color: #fff;
  box-shadow: 0 4px 16px rgba(239, 68, 68, 0.4);
}

.modal-fade-enter-active,
.modal-fade-leave-active { transition: all 0.25s ease; }
.modal-fade-enter-from { opacity: 0; transform: scale(0.9); }
.modal-fade-leave-to   { opacity: 0; transform: scale(0.95); }
</style>
