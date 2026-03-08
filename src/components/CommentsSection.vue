<template>
  <div class="comments-section">
    <!-- Заголовок + сортировка -->
    <div class="comments-header">
      <h2 class="section-title">
        Комментарии <MessageSquare :size="20" class="title-icon" />
        <span class="comments-count" v-if="totalCount > 0">{{ totalCount }}</span>
      </h2>
      <div class="sort-tabs" v-if="auth.user && totalCount > 1">
        <button class="sort-tab" :class="{ active: sortBy === 'new' }" @click="setSort('new')">Новые</button>
        <button class="sort-tab" :class="{ active: sortBy === 'top' }" @click="setSort('top')">
          <ThumbsUp :size="13" /> Популярные
        </button>
      </div>
    </div>

    <!-- Форма (авторизован) -->
    <div v-if="auth.user" class="comment-form-wrap">
      <div class="user-avatar-small">
        <img v-if="auth.user.user_metadata.avatar_url" :src="auth.user.user_metadata.avatar_url" />
        <User v-else :size="20" />
      </div>
      <form @submit.prevent="submitComment" class="comment-form">
        <textarea
          v-model="newComment"
          :placeholder="'Оставьте свой комментарий...'"
          rows="3"
          :maxlength="MAX_LEN"
          @focus="formFocused = true"
          @blur="formFocused = newComment.length > 0"
        ></textarea>
        <Transition name="form-expand">
          <div v-if="formFocused || newComment" class="form-actions">
            <label class="spoiler-label" title="Содержит спойлеры?">
              <input type="checkbox" v-model="isSpoiler" />
              <span class="checkmark"></span>
              Спойлер
            </label>
            <span class="char-count" :class="{ warn: newComment.length > MAX_LEN * 0.85, danger: newComment.length >= MAX_LEN }">
              {{ newComment.length }} / {{ MAX_LEN }}
            </span>
            <button type="submit" class="submit-btn" :disabled="isSubmitting || !newComment.trim()">
              <Send :size="15" /> {{ isSubmitting ? 'Отправка...' : 'Отправить' }}
            </button>
          </div>
        </Transition>
      </form>
    </div>

    <!-- Заглушка (не авторизован) -->
    <div v-else class="auth-prompt">
      <MessageCircle :size="32" class="auth-prompt-icon" />
      <p>Войдите, чтобы читать и оставлять комментарии.</p>
      <button @click="router.push('/profile')" class="auth-btn">Войти через Telegram</button>
    </div>

    <!-- Список комментариев -->
    <div v-if="auth.user" class="comments-list">
      <!-- Загрузка (скелетоны) -->
      <div v-if="isLoading" class="skeletons">
        <div v-for="i in 3" :key="i" class="comment-skeleton">
          <div class="skeleton sk-avatar"></div>
          <div class="sk-body">
            <div class="skeleton sk-name"></div>
            <div class="skeleton sk-text"></div>
            <div class="skeleton sk-text-short"></div>
          </div>
        </div>
      </div>

      <div v-else-if="topComments.length === 0" class="empty-comments">
        <p>Здесь пока нет комментариев. Будьте первым!</p>
      </div>

      <TransitionGroup v-else name="comment-anim" tag="div" class="list-inner">
        <div v-for="c in displayedComments" :key="c.id" class="comment-wrapper">
          <!-- Комментарий -->
          <div class="comment">
            <div class="comment-header">
              <div class="author-avatar">
                <img v-if="c.user_avatar" :src="c.user_avatar" />
                <User v-else :size="16" />
              </div>
              <div class="author-info">
                <span class="author-name">{{ c.user_name || 'Аноним' }}</span>
                <span class="comment-date">{{ formatDate(c.created_at) }}</span>
              </div>
              <button v-if="c.user_id === auth.user.id" @click="requestDelete(c.id)" class="delete-btn" title="Удалить">
                <Trash2 :size="13" />
              </button>
            </div>

            <div class="comment-body">
              <div v-if="c.has_spoiler && !c.showSpoiler" class="spoiler-overlay">
                <AlertTriangle :size="20" class="spoiler-icon" />
                <p>Спойлер!</p>
                <button @click="c.showSpoiler = true" class="reveal-btn">Показать</button>
              </div>
              <p class="comment-text" :class="{ 'is-blurred': c.has_spoiler && !c.showSpoiler }">{{ c.content }}</p>
            </div>

            <div class="comment-actions">
              <!-- Лайк -->
              <button
                class="action-btn like-btn"
                :class="{ liked: userLikes.has(c.id) }"
                @click="toggleLike(c)"
              >
                <ThumbsUp :size="14" />
                <span v-if="(likeCounts[c.id] || 0) > 0">{{ likeCounts[c.id] }}</span>
              </button>
              <!-- Ответить -->
              <button class="action-btn reply-btn" @click="toggleReply(c.id)">
                <CornerDownRight :size="14" />
                Ответить
              </button>
            </div>
          </div>

          <!-- Форма ответа -->
          <Transition name="form-expand">
            <div v-if="replyingTo === c.id" class="reply-form-wrap">
              <div class="user-avatar-small small">
                <img v-if="auth.user.user_metadata.avatar_url" :src="auth.user.user_metadata.avatar_url" />
                <User v-else :size="14" />
              </div>
              <form class="reply-form" @submit.prevent="submitReply(c.id)">
                <textarea v-model="replyText" :placeholder="`Ответить ${c.user_name}...`" rows="2" :maxlength="MAX_LEN" autofocus></textarea>
                <div class="reply-actions">
                  <span class="char-count" :class="{ warn: replyText.length > MAX_LEN * 0.85 }">{{ replyText.length }} / {{ MAX_LEN }}</span>
                  <button type="button" class="btn-cancel-reply" @click="replyingTo = null">Отмена</button>
                  <button type="submit" class="submit-btn small" :disabled="!replyText.trim() || isSubmitting">
                    <Send :size="13" /> Ответить
                  </button>
                </div>
              </form>
            </div>
          </Transition>

          <!-- Ответы -->
          <div v-if="c.replies && c.replies.length" class="replies">
            <div v-for="r in c.replies" :key="r.id" class="comment reply">
              <div class="comment-header">
                <div class="author-avatar small">
                  <img v-if="r.user_avatar" :src="r.user_avatar" />
                  <User v-else :size="12" />
                </div>
                <div class="author-info">
                  <span class="author-name">{{ r.user_name || 'Аноним' }}</span>
                  <span class="comment-date">{{ formatDate(r.created_at) }}</span>
                </div>
                <button v-if="r.user_id === auth.user.id" @click="requestDelete(r.id)" class="delete-btn" title="Удалить">
                  <Trash2 :size="12" />
                </button>
              </div>
              <div class="comment-body">
                <div v-if="r.has_spoiler && !r.showSpoiler" class="spoiler-overlay">
                  <AlertTriangle :size="16" /><p>Спойлер!</p>
                  <button @click="r.showSpoiler = true" class="reveal-btn">Показать</button>
                </div>
                <p class="comment-text" :class="{ 'is-blurred': r.has_spoiler && !r.showSpoiler }">{{ r.content }}</p>
              </div>
              <div class="comment-actions">
                <button class="action-btn like-btn" :class="{ liked: userLikes.has(r.id) }" @click="toggleLike(r)">
                  <ThumbsUp :size="13" />
                  <span v-if="(likeCounts[r.id] || 0) > 0">{{ likeCounts[r.id] }}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </TransitionGroup>

      <!-- Загрузить ещё -->
      <button v-if="hasMore && !isLoading" class="load-more-btn" @click="loadMore" :disabled="isLoadingMore">
        <span v-if="isLoadingMore">Загрузка...</span>
        <span v-else>Загрузить ещё ({{ topComments.length - displayLimit }} осталось)</span>
      </button>
    </div>

    <!-- Confirm Modal -->
    <ConfirmModal
      v-model="showConfirm"
      message="Удалить этот комментарий?"
      confirm-text="Да, удалить"
      @confirm="confirmedDelete"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { supabase } from '@/api/supabase'
import { useToast } from '@/composables/useToast'
import {
  MessageSquare, MessageCircle, Send, User,
  AlertTriangle, Trash2, ThumbsUp, CornerDownRight
} from 'lucide-vue-next'
import ConfirmModal from '@/components/ConfirmModal.vue'

const props = defineProps({ movieId: { type: [String, Number], required: true } })
const router = useRouter()
const auth = useAuthStore()
const toast = useToast()

const MAX_LEN = 500
const PAGE_SIZE = 10

// Состояние данных
const allComments  = ref([])
const likeCounts   = ref({})
const userLikes    = ref(new Set())
const isLoading    = ref(true)
const isLoadingMore= ref(false)
const totalCount   = ref(0)

// Форма нового комментария
const newComment  = ref('')
const isSpoiler   = ref(false)
const isSubmitting= ref(false)
const formFocused = ref(false)

// Ответы
const replyingTo = ref(null)
const replyText  = ref('')

// Сортировка и пагинация
const sortBy      = ref('new')
const displayLimit= ref(PAGE_SIZE)

// Удаление
const showConfirm     = ref(false)
const commentToDelete = ref(null)

// Real-time
let realtimeChannel = null

// --- Вычисляемые свойства ---

const topComments = computed(() => {
  const roots = allComments.value.filter(c => !c.parent_id)
  if (sortBy.value === 'top') {
    return [...roots].sort((a, b) => (likeCounts.value[b.id] || 0) - (likeCounts.value[a.id] || 0))
  }
  return roots
})

const displayedComments = computed(() => {
  return topComments.value.slice(0, displayLimit.value).map(c => ({
    ...c,
    replies: allComments.value.filter(r => r.parent_id === c.id)
  }))
})

const hasMore = computed(() => displayLimit.value < topComments.value.length)

// --- Загрузка данных ---

const loadComments = async () => {
  if (!auth.user) { isLoading.value = false; return }
  isLoading.value = true
  displayLimit.value = PAGE_SIZE

  try {
    const { data, error, count } = await supabase
      .from('comments')
      .select('*', { count: 'exact' })
      .eq('movie_id', props.movieId)
      .order('created_at', { ascending: false })

    if (error) throw error

    allComments.value = (data || []).map(c => ({ ...c, showSpoiler: false }))
    totalCount.value = count || 0

    await loadLikes()
  } catch (e) {
    toast.error('Не удалось загрузить комментарии')
    console.error(e)
  } finally {
    isLoading.value = false
  }
}

const loadLikes = async () => {
  if (!auth.user || allComments.value.length === 0) return
  const ids = allComments.value.map(c => c.id)

  const [{ data: counts }, { data: myLikes }] = await Promise.all([
    supabase.from('comment_likes').select('comment_id').in('comment_id', ids),
    supabase.from('comment_likes').select('comment_id').in('comment_id', ids).eq('user_id', auth.user.id)
  ])

  const map = {}
  ;(counts || []).forEach(l => { map[l.comment_id] = (map[l.comment_id] || 0) + 1 })
  likeCounts.value = map
  userLikes.value = new Set((myLikes || []).map(l => l.comment_id))
}

const loadMore = async () => {
  isLoadingMore.value = true
  await new Promise(r => setTimeout(r, 300)) // Лёгкая задержка для UX
  displayLimit.value += PAGE_SIZE
  isLoadingMore.value = false
}

// --- Отправка комментария ---

const submitComment = async () => {
  if (!newComment.value.trim() || !auth.user || isSubmitting.value) return
  isSubmitting.value = true
  const name   = auth.user.user_metadata.name || auth.user.user_metadata.full_name || 'Аноним'
  const avatar = auth.user.user_metadata.avatar_url || null

  try {
    const { data, error } = await supabase
      .from('comments')
      .insert({ user_id: auth.user.id, movie_id: props.movieId, content: newComment.value.trim(), has_spoiler: isSpoiler.value, user_name: name, user_avatar: avatar })
      .select().single()
    if (error) throw error

    allComments.value.unshift({ ...data, showSpoiler: false })
    totalCount.value++
    newComment.value = ''
    isSpoiler.value  = false
    formFocused.value = false
    toast.success('Комментарий опубликован!')
  } catch (e) {
    toast.error('Не удалось отправить комментарий')
    console.error(e)
  } finally {
    isSubmitting.value = false
  }
}

// --- Ответы ---

const toggleReply = (id) => {
  if (replyingTo.value === id) { replyingTo.value = null; return }
  replyingTo.value = id
  replyText.value  = ''
}

const submitReply = async (parentId) => {
  if (!replyText.value.trim() || !auth.user || isSubmitting.value) return
  isSubmitting.value = true
  const name   = auth.user.user_metadata.name || auth.user.user_metadata.full_name || 'Аноним'
  const avatar = auth.user.user_metadata.avatar_url || null

  try {
    const { data, error } = await supabase
      .from('comments')
      .insert({ user_id: auth.user.id, movie_id: props.movieId, content: replyText.value.trim(), has_spoiler: false, user_name: name, user_avatar: avatar, parent_id: parentId })
      .select().single()
    if (error) throw error

    allComments.value.push({ ...data, showSpoiler: false })
    replyText.value  = ''
    replyingTo.value = null
    toast.success('Ответ опубликован!')
  } catch (e) {
    toast.error('Не удалось отправить ответ')
    console.error(e)
  } finally {
    isSubmitting.value = false
  }
}

// --- Лайки (оптимистичный UI) ---

const toggleLike = async (comment) => {
  if (!auth.user) return
  const id = comment.id
  const isLiked = userLikes.value.has(id)

  // Оптимистичное обновление
  if (isLiked) {
    userLikes.value.delete(id)
    likeCounts.value = { ...likeCounts.value, [id]: Math.max(0, (likeCounts.value[id] || 1) - 1) }
  } else {
    userLikes.value.add(id)
    likeCounts.value = { ...likeCounts.value, [id]: (likeCounts.value[id] || 0) + 1 }
  }
  userLikes.value = new Set(userLikes.value)

  try {
    if (isLiked) {
      await supabase.from('comment_likes').delete().eq('comment_id', id).eq('user_id', auth.user.id)
    } else {
      await supabase.from('comment_likes').insert({ comment_id: id, user_id: auth.user.id })
    }
  } catch (e) {
    // Откатываем при ошибке
    if (isLiked) { userLikes.value.add(id); likeCounts.value = { ...likeCounts.value, [id]: (likeCounts.value[id] || 0) + 1 } }
    else { userLikes.value.delete(id); likeCounts.value = { ...likeCounts.value, [id]: Math.max(0, (likeCounts.value[id] || 1) - 1) } }
    userLikes.value = new Set(userLikes.value)
    toast.error('Не удалось обновить лайк')
  }
}

// --- Удаление ---

const requestDelete = (id) => {
  commentToDelete.value = id
  showConfirm.value = true
}

const confirmedDelete = async () => {
  const id = commentToDelete.value
  if (!id) return
  try {
    const { error } = await supabase.from('comments').delete().eq('id', id).eq('user_id', auth.user.id)
    if (error) throw error
    allComments.value = allComments.value.filter(c => c.id !== id)
    totalCount.value = Math.max(0, totalCount.value - 1)
    toast.success('Комментарий удалён')
  } catch (e) {
    toast.error('Не удалось удалить комментарий')
    console.error(e)
  } finally {
    commentToDelete.value = null
  }
}

// --- Real-time ---

const setupRealtime = () => {
  if (!supabase || !auth.user) return
  realtimeChannel = supabase
    .channel(`comments-${props.movieId}`)
    .on('postgres_changes', {
      event: 'INSERT',
      schema: 'public',
      table: 'comments',
      filter: `movie_id=eq.${props.movieId}`
    }, (payload) => {
      const incoming = payload.new
      // Не дублируем собственные (уже добавлены оптимистично)
      if (incoming.user_id === auth.user.id) return
      const exists = allComments.value.some(c => c.id === incoming.id)
      if (!exists) {
        allComments.value.unshift({ ...incoming, showSpoiler: false })
        totalCount.value++
      }
    })
    .on('postgres_changes', {
      event: 'DELETE',
      schema: 'public',
      table: 'comments',
      filter: `movie_id=eq.${props.movieId}`
    }, (payload) => {
      allComments.value = allComments.value.filter(c => c.id !== payload.old.id)
      totalCount.value = Math.max(0, totalCount.value - 1)
    })
    .subscribe()
}

// --- Утилиты ---

const setSort = (type) => { sortBy.value = type; displayLimit.value = PAGE_SIZE }

const formatDate = (dateString) => {
  const d = new Date(dateString)
  const now = new Date()
  const diff = (now - d) / 1000
  if (diff < 60) return 'только что'
  if (diff < 3600) return `${Math.floor(diff / 60)} мин. назад`
  if (diff < 86400) return `${Math.floor(diff / 3600)} ч. назад`
  return d.toLocaleDateString('ru-RU', { day: '2-digit', month: 'short' })
}

// --- Lifecycle ---

watch(() => props.movieId, () => {
  realtimeChannel?.unsubscribe()
  loadComments().then(setupRealtime)
})

watch(() => auth.user, (user) => {
  if (user) { loadComments().then(setupRealtime) }
})

onMounted(() => {
  loadComments().then(setupRealtime)
})

onUnmounted(() => {
  realtimeChannel?.unsubscribe()
})
</script>

<style scoped>
/* ===== Обёртка ===== */
.comments-section {
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  padding: 2rem;
  margin-top: 3rem;
  box-shadow: var(--shadow-sm);
}

.comments-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 1rem;
  margin-bottom: 2rem;
}

.section-title {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 1.5rem;
  font-weight: 800;
  margin: 0;
}
.title-icon { color: var(--accent); }
.comments-count {
  background: rgba(108, 99, 255, 0.15);
  color: var(--accent);
  font-size: 0.8rem;
  padding: 2px 8px;
  border-radius: 12px;
}

/* ===== Сортировка ===== */
.sort-tabs { display: flex; gap: 0.4rem; }
.sort-tab {
  display: flex; align-items: center; gap: 0.35rem;
  padding: 0.4rem 1rem;
  border-radius: var(--radius-xl);
  border: 1px solid var(--border);
  background: transparent;
  color: var(--text-muted);
  font-family: inherit;
  font-size: 0.82rem;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s ease;
}
.sort-tab.active, .sort-tab:hover {
  background: var(--accent);
  border-color: var(--accent);
  color: #fff;
}

/* ===== Форма ===== */
.comment-form-wrap {
  display: flex;
  gap: 1rem;
  margin-bottom: 2rem;
  align-items: flex-start;
}
.user-avatar-small {
  width: 40px; height: 40px;
  border-radius: 50%;
  background: var(--bg-secondary);
  display: flex; align-items: center; justify-content: center;
  overflow: hidden; flex-shrink: 0;
}
.user-avatar-small.small { width: 28px; height: 28px; }
.user-avatar-small img { width: 100%; height: 100%; object-fit: cover; }

.comment-form { flex: 1; display: flex; flex-direction: column; gap: 0.6rem; }
.comment-form textarea,
.reply-form textarea {
  width: 100%;
  background: rgba(0, 0, 0, 0.2);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  padding: 0.85rem 1rem;
  color: var(--text-primary);
  font-family: inherit;
  font-size: 0.95rem;
  resize: none;
  transition: all var(--transition);
  box-sizing: border-box;
}
.comment-form textarea:focus,
.reply-form textarea:focus {
  outline: none;
  border-color: var(--accent);
  box-shadow: 0 0 0 3px rgba(108, 99, 255, 0.1);
}

.form-actions {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex-wrap: wrap;
}
.char-count {
  font-size: 0.78rem;
  color: var(--text-muted);
  margin-right: auto;
}
.char-count.warn   { color: #fb923c; }
.char-count.danger { color: #ef4444; }

/* ===== Кнопка отправки ===== */
.submit-btn {
  display: flex; align-items: center; gap: 0.4rem;
  background: var(--accent);
  color: #fff; border: none;
  padding: 0.6rem 1.2rem;
  border-radius: var(--radius-md);
  font-family: inherit; font-weight: 700; font-size: 0.85rem;
  cursor: pointer;
  transition: all var(--transition);
}
.submit-btn.small { padding: 0.45rem 0.9rem; font-size: 0.8rem; }
.submit-btn:hover:not(:disabled) { background: var(--accent-2); box-shadow: 0 4px 12px var(--accent-glow); }
.submit-btn:disabled { opacity: 0.5; cursor: not-allowed; }

/* ===== Спойлер чекбокс ===== */
.spoiler-label {
  display: flex; align-items: center; gap: 0.5rem;
  font-size: 0.82rem; color: #ef4444; cursor: pointer; user-select: none;
}
.spoiler-label input { display: none; }
.checkmark {
  width: 16px; height: 16px;
  border: 1px solid rgba(239, 68, 68, 0.5);
  border-radius: 4px; background: transparent; position: relative;
  transition: all 0.2s ease; flex-shrink: 0;
}
.spoiler-label input:checked ~ .checkmark { background: #ef4444; border-color: #ef4444; }
.spoiler-label input:checked ~ .checkmark::after {
  content: ''; position: absolute;
  left: 4px; top: 1px; width: 4px; height: 8px;
  border: solid #fff; border-width: 0 2px 2px 0;
  transform: rotate(45deg); margin-top: -1px;
}

/* ===== Auth prompt ===== */
.auth-prompt {
  text-align: center; padding: 2.5rem 1rem;
  background: rgba(0,0,0,0.08);
  border-radius: var(--radius-md);
  border: 1px dashed var(--border);
}
.auth-prompt-icon { color: var(--text-muted); margin-bottom: 1rem; }
.auth-prompt p { color: var(--text-secondary); margin-bottom: 1.25rem; }
.auth-btn {
  background: rgba(108, 99, 255, 0.1);
  border: 1px solid rgba(108, 99, 255, 0.3);
  color: var(--accent);
  padding: 0.6rem 1.5rem;
  border-radius: var(--radius-xl);
  font-family: inherit; font-weight: 700; cursor: pointer;
  transition: all var(--transition);
}
.auth-btn:hover { background: var(--accent); color: #fff; border-color: var(--accent); }

/* ===== Скелетоны ===== */
.skeletons { display: flex; flex-direction: column; gap: 1.5rem; }
.comment-skeleton { display: flex; gap: 1rem; align-items: flex-start; }
.sk-avatar { width: 36px; height: 36px; border-radius: 50%; flex-shrink: 0; }
.sk-body { flex: 1; display: flex; flex-direction: column; gap: 0.5rem; }
.sk-name { height: 12px; width: 120px; border-radius: 6px; }
.sk-text { height: 12px; border-radius: 6px; }
.sk-text-short { height: 12px; width: 60%; border-radius: 6px; }
.skeleton { background: linear-gradient(90deg, rgba(255,255,255,0.04) 25%, rgba(255,255,255,0.08) 50%, rgba(255,255,255,0.04) 75%); background-size: 200% 100%; animation: shimmer 1.5s infinite; }
@keyframes shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }

/* ===== Список ===== */
.comments-list { display: flex; flex-direction: column; gap: 0; }
.list-inner { display: flex; flex-direction: column; gap: 0; }
.empty-comments { text-align: center; padding: 2rem; color: var(--text-muted); }

/* ===== Комментарий ===== */
.comment-wrapper { border-bottom: 1px solid rgba(255,255,255,0.04); }
.comment-wrapper:last-child { border-bottom: none; }

.comment {
  padding: 1.25rem 0;
}
.comment.reply {
  padding: 0.85rem 0;
  border-bottom: 1px solid rgba(255,255,255,0.03);
}
.comment.reply:last-child { border-bottom: none; }

.comment-header {
  display: flex; align-items: center; gap: 0.75rem;
  margin-bottom: 0.5rem;
}
.author-avatar {
  width: 34px; height: 34px; border-radius: 50%;
  background: var(--bg-secondary); border: 1px solid var(--border);
  display: flex; align-items: center; justify-content: center; overflow: hidden; flex-shrink: 0;
}
.author-avatar.small { width: 26px; height: 26px; }
.author-avatar img { width: 100%; height: 100%; object-fit: cover; }

.author-info { display: flex; flex-direction: column; line-height: 1.2; flex: 1; }
.author-name { font-weight: 700; font-size: 0.88rem; }
.comment-date { font-size: 0.72rem; color: var(--text-muted); }

.delete-btn {
  background: none; border: none; color: var(--text-muted);
  cursor: pointer; padding: 4px; border-radius: 4px;
  transition: all 0.2s ease; display: flex; align-items: center; justify-content: center;
}
.delete-btn:hover { color: #ef4444; background: rgba(239, 68, 68, 0.1); }

/* ===== Тело комментария ===== */
.comment-body {
  position: relative; font-size: 0.93rem; line-height: 1.65;
  color: var(--text-secondary); padding-left: 3rem;
}
.comment.reply .comment-body { padding-left: 2rem; }

.comment-text.is-blurred { filter: blur(8px); user-select: none; }

.spoiler-overlay {
  position: absolute; inset: 0; z-index: 10;
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  gap: 0.35rem; background: rgba(15, 15, 25, 0.5); border-radius: 8px;
}
.spoiler-icon { color: #ef4444; }
.spoiler-overlay p { font-weight: 700; color: #fff; font-size: 0.82rem; }
.reveal-btn {
  background: rgba(239,68,68,0.2); border: 1px solid rgba(239,68,68,0.4);
  color: #fca5a5; padding: 0.25rem 0.9rem;
  border-radius: 12px; font-size: 0.72rem; font-weight: 800; cursor: pointer;
}
.reveal-btn:hover { background: #ef4444; color: #fff; }

/* ===== Действия (лайк, ответить) ===== */
.comment-actions {
  display: flex; gap: 0.5rem; padding-left: 3rem; margin-top: 0.5rem;
}
.comment.reply .comment-actions { padding-left: 2rem; }

.action-btn {
  display: flex; align-items: center; gap: 0.35rem;
  background: none; border: none;
  color: var(--text-muted); font-family: inherit;
  font-size: 0.78rem; font-weight: 700; cursor: pointer;
  padding: 0.3rem 0.6rem; border-radius: 8px;
  transition: all 0.2s ease;
}
.action-btn:hover { background: rgba(255,255,255,0.06); color: var(--text-primary); }

.like-btn.liked { color: var(--accent); }
.like-btn.liked:hover { background: rgba(108, 99, 255, 0.1); }

/* ===== Ответы ===== */
.replies {
  margin-left: 3rem;
  padding: 0 0 0.5rem 1rem;
  border-left: 2px solid rgba(255,255,255,0.06);
}

.reply-form-wrap {
  display: flex; gap: 0.75rem; align-items: flex-start;
  margin-left: 3rem; margin-bottom: 0.75rem;
}
.reply-form { flex: 1; display: flex; flex-direction: column; gap: 0.5rem; }
.reply-actions { display: flex; align-items: center; gap: 0.5rem; }
.btn-cancel-reply {
  background: none; border: 1px solid var(--border);
  color: var(--text-muted); padding: 0.4rem 0.8rem;
  border-radius: var(--radius-md); font-family: inherit;
  font-size: 0.8rem; font-weight: 700; cursor: pointer;
  transition: all 0.2s ease;
}
.btn-cancel-reply:hover { color: #fff; border-color: var(--border-hover); }

/* ===== Загрузить ещё ===== */
.load-more-btn {
  width: 100%; margin-top: 1.5rem;
  padding: 0.75rem;
  border: 1px dashed var(--border);
  border-radius: var(--radius-md);
  background: transparent;
  color: var(--text-muted);
  font-family: inherit; font-size: 0.85rem; font-weight: 700; cursor: pointer;
  transition: all var(--transition);
}
.load-more-btn:hover:not(:disabled) { border-color: var(--accent); color: var(--accent); background: rgba(108,99,255,0.05); }
.load-more-btn:disabled { opacity: 0.5; }

/* ===== Анимации ===== */
.comment-anim-enter-active { transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275); }
.comment-anim-leave-active { transition: all 0.25s ease; }
.comment-anim-enter-from { opacity: 0; transform: translateY(-12px); }
.comment-anim-leave-to   { opacity: 0; transform: translateY(-6px); }

.form-expand-enter-active,
.form-expand-leave-active { transition: all 0.3s ease; overflow: hidden; }
.form-expand-enter-from,
.form-expand-leave-to { opacity: 0; max-height: 0; }
.form-expand-enter-to,
.form-expand-leave-from { max-height: 200px; }

@media (max-width: 600px) {
  .comments-section { padding: 1.25rem; }
  .comment-body { padding-left: 0; margin-top: 0.5rem; }
  .comment-actions { padding-left: 0; }
  .replies { margin-left: 0.75rem; }
  .reply-form-wrap { margin-left: 0.75rem; }
  .form-actions { flex-wrap: wrap; }
}
</style>
