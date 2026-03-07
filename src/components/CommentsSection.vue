<template>
  <div class="comments-section">
    <h2 class="section-title">
      Комментарии <MessageSquare :size="20" class="title-icon" />
      <span class="comments-count" v-if="comments.length">{{ comments.length }}</span>
    </h2>

    <!-- Форма отправки (если авторизован) -->
    <div v-if="auth.user" class="comment-form-wrap">
      <div class="user-avatar-small">
        <img v-if="auth.user.user_metadata.avatar_url" :src="auth.user.user_metadata.avatar_url" />
        <User v-else :size="20" />
      </div>
      <form @submit.prevent="submitComment" class="comment-form">
        <textarea
          v-model="newComment"
          placeholder="Оставьте свой комментарий..."
          rows="3"
          required
        ></textarea>
        <div class="form-actions">
          <label class="spoiler-label" title="Отметьте, если в тексте есть важные повороты сюжета">
            <input type="checkbox" v-model="isSpoiler" />
            <span class="checkmark"></span>
            Содержит спойлеры
          </label>
          <button type="submit" class="submit-btn" :disabled="isSubmitting || !newComment.trim()">
            <Send :size="16" /> {{ isSubmitting ? 'Отправка...' : 'Отправить' }}
          </button>
        </div>
      </form>
    </div>

    <!-- Заглушка для неавторизованных -->
    <div v-else class="auth-prompt">
      <MessageCircle :size="32" class="auth-prompt-icon" />
      <p>Только авторизованные пользователи могут читать и оставлять комментарии.</p>
      <button @click="router.push('/profile')" class="auth-btn">
        Войти через Telegram
      </button>
    </div>

    <!-- Список комментариев -->
    <div v-if="auth.user" class="comments-list">
      <div v-if="isLoading" class="loading-state">
        <div class="spinner-small"></div> Загрузка комментариев...
      </div>
      
      <div v-else-if="comments.length === 0" class="empty-comments">
        <p>Здесь пока нет комментариев. Будьте первым!</p>
      </div>

      <div v-else class="comment" v-for="c in comments" :key="c.id">
        <div class="comment-header">
          <div class="author-avatar">
            <img v-if="c.user_avatar" :src="c.user_avatar" />
            <User v-else :size="16" />
          </div>
          <div class="author-info">
            <span class="author-name">{{ c.user_name || 'Аноним' }}</span>
            <span class="comment-date">{{ formatDate(c.created_at) }}</span>
          </div>
          <!-- Кнопка удаления для автора -->
          <button v-if="c.user_id === auth.user.id" @click="deleteComment(c.id)" class="delete-btn" title="Удалить">
            <Trash2 :size="14" />
          </button>
        </div>

        <div class="comment-body">
          <div v-if="c.has_spoiler && !c.showSpoiler" class="spoiler-overlay">
            <AlertTriangle :size="24" class="spoiler-icon" />
            <p>Возможен спойлер!</p>
            <button @click="c.showSpoiler = true" class="reveal-btn">Показать</button>
          </div>
          <p class="comment-text" :class="{ 'is-blurred': c.has_spoiler && !c.showSpoiler }">
            {{ c.content }}
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { supabase } from '@/api/supabase'
import { 
  MessageSquare, 
  MessageCircle, 
  Send, 
  User, 
  AlertTriangle, 
  Trash2 
} from 'lucide-vue-next'

const props = defineProps({
  movieId: {
    type: [String, Number],
    required: true
  }
})

const router = useRouter()
const auth = useAuthStore()

const comments = ref([])
const newComment = ref('')
const isSpoiler = ref(false)
const isLoading = ref(true)
const isSubmitting = ref(false)

const loadComments = async () => {
  if (!auth.user) {
    isLoading.value = false
    return
  }
  
  isLoading.value = true
  try {
    // Получаем комментарии
    const { data: commentsData, error } = await supabase
      .from('comments')
      .select('*')
      .eq('movie_id', props.movieId)
      .order('created_at', { ascending: false })

    if (error) throw error

    // Для каждого комментария подгружаем данные автора из auth.users
    // Примечание: В реальном продакшене лучше сделать view базу с JOIN, 
    // но так как supabase хранит юзеров в своей схеме auth, придётся джойнить на лету или хранить метадату.
    // Т.к. обычный RLS не дает доступ к auth.users, мы будем выводить только ID автора 
    // Либо, если мы кэшируем имя в local, будем выводить. Для простоты сейчас просто выводим "Пользователь".
    // В идеале мы должны добавить name/avatar прямо в таблицу comments при insert.
    
    comments.value = commentsData.map(c => ({
      ...c,
      showSpoiler: false,
      // Используем данные из базы, если они есть. Иначе фолбек на ID.
      user_name: c.user_name || 'Пользователь ' + c.user_id.substring(0,4),
      user_avatar: c.user_avatar || null
    }))
  } catch (err) {
    console.error('Ошибка загрузки комментариев:', err)
  } finally {
    isLoading.value = false
  }
}

const submitComment = async () => {
  if (!newComment.value.trim() || !auth.user) return
  
  isSubmitting.value = true
  const displayName = auth.user.user_metadata.name || auth.user.user_metadata.full_name || 'Аноним'
  const displayAvatar = auth.user.user_metadata.avatar_url || null

  try {
    const { data, error } = await supabase
      .from('comments')
      .insert({
        user_id: auth.user.id,
        movie_id: props.movieId,
        content: newComment.value.trim(),
        has_spoiler: isSpoiler.value,
        user_name: displayName,
        user_avatar: displayAvatar
      })
      .select()
      .single()

    if (error) throw error

    // Добавляем в локальный стейт
    comments.value.unshift({
      ...data,
      showSpoiler: false,
      user_name: displayName,
      user_avatar: displayAvatar
    })
    
    // Очищаем форму
    newComment.value = ''
    isSpoiler.value = false
  } catch (err) {
    console.error('Ошибка отправки комментария:', err)
    alert('Не удалось отправить комментарий.')
  } finally {
    isSubmitting.value = false
  }
}

const deleteComment = async (id) => {
  if (!confirm('Точно удалить комментарий?')) return
  
  try {
    const { error } = await supabase
      .from('comments')
      .delete()
      .eq('id', id)
      .eq('user_id', auth.user.id)
      
    if (error) throw error
    comments.value = comments.value.filter(c => c.id !== id)
  } catch (err) {
    console.error('Ошибка удаления:', err)
  }
}

const formatDate = (dateString) => {
  const d = new Date(dateString)
  return d.toLocaleDateString('ru-RU', { day: '2-digit', month: 'short', hour: '2-digit', minute:'2-digit' })
}

watch(() => props.movieId, () => {
  loadComments()
})

onMounted(() => {
  loadComments()
})
</script>

<style scoped>
.comments-section {
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  padding: 2rem;
  margin-top: 3rem;
  box-shadow: var(--shadow-sm);
}

.section-title {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 1.5rem;
  font-weight: 800;
  margin-bottom: 2rem;
}

.title-icon { color: var(--accent); }

.comments-count {
  background: rgba(108, 99, 255, 0.15);
  color: var(--accent);
  font-size: 0.85rem;
  padding: 2px 8px;
  border-radius: 12px;
  margin-left: 0.5rem;
}

/* Форма */
.comment-form-wrap {
  display: flex;
  gap: 1rem;
  margin-bottom: 2.5rem;
  align-items: flex-start;
}

.user-avatar-small {
  width: 40px; height: 40px;
  border-radius: 50%;
  background: var(--bg-secondary);
  display: flex; align-items: center; justify-content: center;
  overflow: hidden;
  flex-shrink: 0;
}

.user-avatar-small img { width: 100%; height: 100%; object-fit: cover; }

.comment-form {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.comment-form textarea {
  width: 100%;
  background: rgba(0, 0, 0, 0.2);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  padding: 1rem;
  color: var(--text-primary);
  font-family: inherit;
  font-size: 0.95rem;
  resize: vertical;
  min-height: 80px;
  transition: all var(--transition);
}

.comment-form textarea:focus {
  outline: none;
  border-color: var(--accent);
  box-shadow: 0 0 0 2px rgba(108, 99, 255, 0.1);
}

.form-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

/* Чекбокс Спойлер */
.spoiler-label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.85rem;
  color: #ef4444; /* Красный оттенок для внимания */
  cursor: pointer;
  user-select: none;
}

.spoiler-label input { display: none; }
.checkmark {
  width: 16px; height: 16px;
  border: 1px solid rgba(239, 68, 68, 0.5);
  border-radius: 4px;
  background: transparent;
  position: relative;
  transition: all 0.2s ease;
}

.spoiler-label input:checked ~ .checkmark {
  background: #ef4444;
  border-color: #ef4444;
}

.spoiler-label input:checked ~ .checkmark::after {
  content: '';
  position: absolute;
  left: 4px; top: 1px;
  width: 4px; height: 8px;
  border: solid white;
  border-width: 0 2px 2px 0;
  transform: rotate(45deg);
}

/* Кнопка отправки */
.submit-btn {
  display: flex; align-items: center; gap: 0.4rem;
  background: var(--accent);
  color: white;
  border: none;
  padding: 0.6rem 1.2rem;
  border-radius: var(--radius-md);
  font-weight: 700;
  font-size: 0.85rem;
  cursor: pointer;
  transition: all var(--transition);
}

.submit-btn:hover:not(:disabled) {
  background: var(--accent-2);
  box-shadow: 0 4px 12px var(--accent-glow);
}

.submit-btn:disabled { opacity: 0.5; cursor: not-allowed; }

/* Заглушка Auth */
.auth-prompt {
  text-align: center;
  padding: 3rem 1rem;
  background: rgba(0,0,0,0.1);
  border-radius: var(--radius-md);
  border: 1px dashed var(--border);
}

.auth-prompt-icon { color: var(--text-muted); margin-bottom: 1rem; }
.auth-prompt p { color: var(--text-secondary); margin-bottom: 1.5rem; }
.auth-btn {
  background: var(--bg-secondary);
  border: 1px solid var(--border);
  color: #fff;
  padding: 0.6rem 1.5rem;
  border-radius: var(--radius-xl);
  font-weight: 700;
  cursor: pointer;
  transition: all var(--transition);
}

.auth-btn:hover { background: var(--accent); border-color: var(--accent); }

/* Список комментов */
.comments-list {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.comment {
  padding: 1.25rem;
  background: rgba(255,255,255,0.02);
  border-radius: var(--radius-md);
}

.comment-header {
  display: flex; align-items: center; gap: 0.75rem;
  margin-bottom: 0.75rem;
}

.author-avatar {
  width: 32px; height: 32px;
  border-radius: 50%;
  background: var(--bg-card); border: 1px solid var(--border);
  display: flex; align-items: center; justify-content: center;
  overflow: hidden;
}

.author-avatar img { width: 100%; height: 100%; object-fit: cover; }

.author-info { display: flex; flex-direction: column; line-height: 1.2; flex: 1; }
.author-name { font-weight: 700; font-size: 0.9rem; }
.comment-date { font-size: 0.75rem; color: var(--text-muted); }

.delete-btn {
  background: none; border: none; color: var(--text-muted);
  cursor: pointer; padding: 4px; border-radius: 4px;
  transition: all 0.2s ease;
}

.delete-btn:hover { color: #ef4444; background: rgba(239, 68, 68, 0.1); }

/* Тело коммента и Спойлер */
.comment-body {
  position: relative;
  font-size: 0.95rem;
  line-height: 1.6;
  color: var(--text-secondary);
  padding-left: 2.75rem; /* Выравнивание под текст автора */
}

@media (max-width: 600px) {
  .comment-body { padding-left: 0; margin-top: 1rem; }
}

.comment-text.is-blurred {
  filter: blur(8px);
  user-select: none;
  opacity: 0.5;
}

.spoiler-overlay {
  position: absolute;
  inset: 0;
  z-index: 10;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  background: rgba(20, 20, 30, 0.4);
  border-radius: 8px;
}

.spoiler-icon { color: #ef4444; }
.spoiler-overlay p { font-weight: 700; color: #fff; font-size: 0.85rem;}
.reveal-btn {
  background: rgba(239, 68, 68, 0.2);
  border: 1px solid rgba(239, 68, 68, 0.4);
  color: #fca5a5;
  padding: 0.3rem 1rem;
  border-radius: 12px;
  font-size: 0.75rem; font-weight: 800; cursor: pointer;
  transition: all 0.2s ease;
}

.reveal-btn:hover {
  background: #ef4444; color: #fff; border-color: #ef4444;
}

.loading-state, .empty-comments {
  text-align: center; padding: 2rem; color: var(--text-muted);
  display: flex; align-items: center; justify-content: center; gap: 1rem;
}

.spinner-small {
  width: 20px; height: 20px;
  border: 2px solid var(--border); border-top-color: var(--accent);
  border-radius: 50%; animation: spin 0.8s linear infinite;
}
</style>
