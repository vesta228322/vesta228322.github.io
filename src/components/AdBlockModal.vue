<template>
  <Transition name="fade">
    <div v-if="modelValue" class="modal-overlay" @click.self="$emit('update:modelValue', false)">
      <div class="modal-content fade-scale">
        <button class="close-top" @click="$emit('update:modelValue', false)">✕</button>
        
        <div class="modal-header">
          <span class="warning-icon">📢</span>
          <h2>Важное уведомление</h2>
        </div>

        <div class="modal-body">
          <p>Мы заметили, что вы смотрите фильмы без блокировщика рекламы.</p>
          <p class="highlight">Для максимально комфортного просмотра (без всплывающих окон и прерываний) мы настоятельно рекомендуем установить расширение <strong>uBlock Origin</strong>.</p>
          
          <div class="benefit-list">
            <div class="benefit-item">
              <span>✅</span>
              <span>Никаких всплывающих окон</span>
            </div>
            <div class="benefit-item">
              <span>✅</span>
              <span>Быстрая загрузка плеера</span>
            </div>
            <div class="benefit-item">
              <span>✅</span>
              <span>Абсолютно бесплатно и безопасно</span>
            </div>
          </div>
        </div>

        <div class="modal-footer">
          <a 
            href="https://chromewebstore.google.com/detail/ublock/epcnnfbjfcgphgdmggkamkmgojdagdnn" 
            target="_blank" 
            class="install-btn"
          >
            🚀 Установить uBlock
          </a>
          <button class="maybe-later" @click="$emit('update:modelValue', false)">
            Позже
          </button>
        </div>
      </div>
    </div>
  </Transition>
</template>

<script setup>
defineProps({
  modelValue: Boolean
})
defineEmits(['update:modelValue'])
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.85);
  backdrop-filter: blur(8px);
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1.5rem;
}

.modal-content {
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: var(--radius-2xl);
  padding: 2.5rem;
  max-width: 500px;
  width: 100%;
  position: relative;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
}

.close-top {
  position: absolute;
  top: 1.25rem;
  right: 1.25rem;
  background: none;
  border: none;
  color: var(--text-muted);
  font-size: 1.2rem;
  cursor: pointer;
  transition: color var(--transition);
}
.close-top:hover { color: #fff; }

.modal-header {
  text-align: center;
  margin-bottom: 1.5rem;
}

.warning-icon {
  font-size: 3rem;
  display: block;
  margin-bottom: 0.5rem;
}

.modal-header h2 {
  font-size: 1.7rem;
  font-weight: 900;
  letter-spacing: -0.5px;
}

.modal-body {
  margin-bottom: 2rem;
  color: var(--text-secondary);
  line-height: 1.6;
}

.highlight {
  background: rgba(255, 255, 255, 0.05);
  padding: 1rem;
  border-left: 3px solid var(--accent);
  margin: 1.2rem 0;
  border-radius: 0 var(--radius-md) var(--radius-md) 0;
  color: var(--text-primary);
}

.benefit-list {
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
  margin-top: 1rem;
}

.benefit-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  font-size: 0.95rem;
}

.modal-footer {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.install-btn {
  display: block;
  width: 100%;
  padding: 1rem;
  background: var(--accent);
  color: #fff;
  text-align: center;
  text-decoration: none;
  border-radius: var(--radius-xl);
  font-weight: 800;
  font-size: 1.1rem;
  transition: all var(--transition);
  box-shadow: 0 10px 20px -5px var(--accent-glow);
}

.install-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 15px 30px -5px var(--accent-glow);
}

.maybe-later {
  background: transparent;
  border: none;
  color: var(--text-muted);
  font-size: 0.9rem;
  cursor: pointer;
  padding: 0.5rem;
  transition: color var(--transition);
}
.maybe-later:hover { color: var(--text-secondary); text-decoration: underline; }

/* Анимации */
.fade-enter-active, .fade-leave-active { transition: opacity 0.4s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }

.fade-scale-enter-active { transition: all 0.5s cubic-bezier(0.34, 1.56, 0.64, 1); }
.fade-scale-enter-from { transform: scale(0.9) translateY(20px); opacity: 0; }

@media (max-width: 480px) {
  .modal-content {
    padding: 1.5rem;
  }
  .modal-header h2 { font-size: 1.4rem; }
}
</style>
