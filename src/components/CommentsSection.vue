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

    <!-- Форма нового комментария -->
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
          :maxlength="MAX_LEN"
          @focus="formFocused = true"
          @blur="formFocused = newComment.length > 0"
        ></textarea>
        <Transition name="form-expand">
          <div v-if="formFocused || newComment" class="form-actions">
            <label class="spoiler-label">
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

    <!-- Заглушка неавторизованных -->
    <div v-else class="auth-prompt">
      <MessageCircle :size="32" class="auth-prompt-icon" />
      <p>Войдите, чтобы читать и оставлять комментарии.</p>
      <button @click="router.push('/profile')" class="auth-btn">Войти через Telegram</button>
    </div>

    <!-- Список -->
    <div v-if="auth.user" class="comments-list">
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

          <!-- Корневой комментарий -->
          <CommentItem
            :comment="c"
            :user-id="auth.user.id"
            :like-counts="likeCounts"
            :user-likes="userLikes"
            :revealed="revealedSpoilers"
            @reveal="revealSpoiler"
            @like="toggleLike"
            @delete="requestDelete"
            @reply="openReply"
          />

          <!-- Форма ответа на корневой -->
          <Transition name="form-expand">
            <ReplyForm
              v-if="replyingTo === c.id"
              :avatar="auth.user.user_metadata.avatar_url"
              :placeholder="`Ответить ${c.user_name}...`"
              :max-len="MAX_LEN"
              :is-submitting="isSubmitting"
              @submit="(text) => submitReply(c.id, text, null)"
              @cancel="replyingTo = null"
            />
          </Transition>

          <!-- Ответы -->
          <div v-if="c.replies && c.replies.length" class="replies">
            <div v-for="r in c.replies" :key="r.id" class="reply-thread">
              <CommentItem
                :comment="r"
                :user-id="auth.user.id"
                :like-counts="likeCounts"
                :user-likes="userLikes"
                :revealed="revealedSpoilers"
                :is-reply="true"
                @reveal="revealSpoiler"
                @like="toggleLike"
                @delete="requestDelete"
                @reply="openReply"
              />

              <!-- Форма ответа на ответ -->
              <Transition name="form-expand">
                <ReplyForm
                  v-if="replyingTo === r.id"
                  :avatar="auth.user.user_metadata.avatar_url"
                  :placeholder="`Ответить ${r.user_name}...`"
                  :max-len="MAX_LEN"
                  :is-submitting="isSubmitting"
                  @submit="(text) => submitReply(c.id, text, r.user_name)"
                  @cancel="replyingTo = null"
                />
              </Transition>
            </div>
          </div>

        </div>
      </TransitionGroup>

      <button v-if="hasMore && !isLoading" class="load-more-btn" @click="loadMore" :disabled="isLoadingMore">
        {{ isLoadingMore ? 'Загрузка...' : `Загрузить ещё (${topComments.length - displayLimit})` }}
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
import { ref, computed, onMounted, onUnmounted, watch, defineComponent, h } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { supabase } from '@/api/supabase'
import { useToast } from '@/composables/useToast'
import {
  MessageSquare, MessageCircle, Send, User,
  AlertTriangle, Trash2, ThumbsUp, CornerDownRight
} from 'lucide-vue-next'
import ConfirmModal from '@/components/ConfirmModal.vue'

// ─── Inline компоненты ─────────────────────────────────────────────────
const CommentItem = defineComponent({
  name: 'CommentItem',
  props: {
    comment: Object,
    userId: String,
    likeCounts: Object,
    userLikes: Object, // Set
    revealed: Object,  // Set
    isReply: { type: Boolean, default: false }
  },
  emits: ['reveal','like','delete','reply'],
  setup(props, { emit }) {
    const isLiked    = computed(() => props.userLikes?.has(props.comment.id))
    const likeCount  = computed(() => props.likeCounts?.[props.comment.id] || 0)
    const isSpoiler  = computed(() => props.comment.has_spoiler && !props.revealed?.has(props.comment.id))
    const isOwner    = computed(() => props.comment.user_id === props.userId)
    return { isLiked, likeCount, isSpoiler, isOwner }
  },
  template: `
    <div class="comment" :class="{ reply: isReply }">
      <div class="comment-header">
        <div class="author-avatar" :class="{ small: isReply }">
          <img v-if="comment.user_avatar" :src="comment.user_avatar" />
          <span v-else class="avatar-initial">{{ (comment.user_name || 'A')[0].toUpperCase() }}</span>
        </div>
        <div class="author-info">
          <span class="author-name">{{ comment.user_name || 'Аноним' }}</span>
          <span class="comment-date">{{ comment._fmtDate }}</span>
        </div>
        <button v-if="isOwner" @click="$emit('delete', comment.id)" class="delete-btn">
          <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/></svg>
        </button>
      </div>
      <div class="comment-body" :class="{ indented: !isReply }">
        <div v-if="isSpoiler" class="spoiler-overlay">
          <span class="spoiler-icon">⚠️</span>
          <span>Спойлер</span>
          <button @click="$emit('reveal', comment.id)" class="reveal-btn">Показать</button>
        </div>
        <p class="comment-text" :class="{ 'is-blurred': isSpoiler }">
          <span v-if="comment.reply_to_user_name" class="mention">@{{ comment.reply_to_user_name }}</span>
          {{ comment.content }}
        </p>
      </div>
      <div class="comment-actions" :class="{ indented: !isReply }">
        <button class="action-btn like-btn" :class="{ liked: isLiked }" @click="$emit('like', comment)">
          <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3H14z"/><path d="M7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"/></svg>
          <span v-if="likeCount > 0">{{ likeCount }}</span>
        </button>
        <button class="action-btn reply-btn" @click="$emit('reply', comment.id)">
          <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 17 4 12 9 7"/><path d="M20 18v-2a4 4 0 0 0-4-4H4"/></svg>
          Ответить
        </button>
      </div>
    </div>
  `
})

const ReplyForm = defineComponent({
  name: 'ReplyForm',
  props: { avatar: String, placeholder: String, maxLen: Number, isSubmitting: Boolean },
  emits: ['submit', 'cancel'],
  setup(props, { emit }) {
    const text = ref('')
    const submit = () => { if (text.value.trim()) { emit('submit', text.value.trim()); text.value = '' } }
    return { text, submit }
  },
  template: `
    <div class="reply-form-wrap">
      <div class="user-avatar-small small">
        <img v-if="avatar" :src="avatar" />
        <span v-else>A</span>
      </div>
      <form class="reply-form" @submit.prevent="submit">
        <textarea v-model="text" :placeholder="placeholder" rows="2" :maxlength="maxLen" autofocus></textarea>
        <div class="reply-actions">
          <span class="char-count" :class="{ warn: text.length > maxLen * 0.85 }">{{ text.length }} / {{ maxLen }}</span>
          <button type="button" class="btn-cancel-reply" @click="$emit('cancel')">Отмена</button>
          <button type="submit" class="submit-btn small" :disabled="!text.trim() || isSubmitting">
            <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
            Ответить
          </button>
        </div>
      </form>
    </div>
  `
})

// ─── Props / Composables ───────────────────────────────────────────────
const props = defineProps({ movieId: { type: [String, Number], required: true } })
const router = useRouter()
const auth = useAuthStore()
const toast = useToast()

const MAX_LEN = 500
const PAGE_SIZE = 10

// ─── State ─────────────────────────────────────────────────────────────
const allComments      = ref([])
const likeCounts       = ref({})
const userLikes        = ref(new Set())
const revealedSpoilers = ref(new Set())
const isLoading        = ref(true)
const isLoadingMore    = ref(false)
const totalCount       = ref(0)
const newComment       = ref('')
const isSpoiler        = ref(false)
const isSubmitting     = ref(false)
const formFocused      = ref(false)
const replyingTo       = ref(null)
const sortBy           = ref('new')
const displayLimit     = ref(PAGE_SIZE)
const showConfirm      = ref(false)
const commentToDelete  = ref(null)
let   realtimeChannel  = null

// ─── Computed ───────────────────────────────────────────────────────────
const topComments = computed(() => {
  const roots = allComments.value.filter(c => !c.parent_id)
  if (sortBy.value === 'top') {
    return [...roots].sort((a,b) => (likeCounts.value[b.id] || 0) - (likeCounts.value[a.id] || 0))
  }
  return roots
})

const displayedComments = computed(() =>
  topComments.value.slice(0, displayLimit.value).map(c => ({
    ...c,
    replies: allComments.value.filter(r => r.parent_id === c.id)
  }))
)

const hasMore = computed(() => displayLimit.value < topComments.value.length)

// ─── Helpers ────────────────────────────────────────────────────────────
const formatDate = (ds) => {
  const d = new Date(ds), now = new Date(), diff = (now - d) / 1000
  if (diff < 60)    return 'только что'
  if (diff < 3600)  return `${Math.floor(diff / 60)} мин. назад`
  if (diff < 86400) return `${Math.floor(diff / 3600)} ч. назад`
  return d.toLocaleDateString('ru-RU', { day: '2-digit', month: 'short' })
}
const stamp = (c) => ({ ...c, _fmtDate: formatDate(c.created_at) })

// ─── Data loading ───────────────────────────────────────────────────────
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
    allComments.value = (data || []).map(stamp)
    totalCount.value  = count || 0
    await loadLikes()
  } catch (e) {
    toast.error('Не удалось загрузить комментарии')
  } finally {
    isLoading.value = false
  }
}

const loadLikes = async () => {
  if (!auth.user || allComments.value.length === 0) return
  const ids = allComments.value.map(c => c.id)
  const [{ data: counts }, { data: mine }] = await Promise.all([
    supabase.from('comment_likes').select('comment_id').in('comment_id', ids),
    supabase.from('comment_likes').select('comment_id').in('comment_id', ids).eq('user_id', auth.user.id)
  ])
  const map = {}
  ;(counts || []).forEach(l => { map[l.comment_id] = (map[l.comment_id] || 0) + 1 })
  likeCounts.value = map
  userLikes.value  = new Set((mine || []).map(l => l.comment_id))
}

// ─── Submit ─────────────────────────────────────────────────────────────
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
    allComments.value.unshift(stamp(data))
    totalCount.value++
    newComment.value = ''
    isSpoiler.value  = false
    formFocused.value = false
    toast.success('Комментарий опубликован!')
  } catch (e) {
    toast.error('Не удалось отправить комментарий')
  } finally { isSubmitting.value = false }
}

const submitReply = async (parentId, text, replyToUserName) => {
  if (!text || !auth.user || isSubmitting.value) return
  isSubmitting.value = true
  const name   = auth.user.user_metadata.name || auth.user.user_metadata.full_name || 'Аноним'
  const avatar = auth.user.user_metadata.avatar_url || null
  try {
    const { data, error } = await supabase
      .from('comments')
      .insert({ user_id: auth.user.id, movie_id: props.movieId, content: text, has_spoiler: false, user_name: name, user_avatar: avatar, parent_id: parentId, reply_to_user_name: replyToUserName })
      .select().single()
    if (error) throw error
    allComments.value.push(stamp(data))
    replyingTo.value = null
    toast.success('Ответ опубликован!')
  } catch (e) {
    toast.error('Не удалось отправить ответ')
  } finally { isSubmitting.value = false }
}

// ─── Лайки ─────────────────────────────────────────────────────────────
const toggleLike = async (comment) => {
  if (!auth.user) return
  const id = comment.id
  const isLiked = userLikes.value.has(id)
  // Оптимистично
  const newSet = new Set(userLikes.value)
  if (isLiked) { newSet.delete(id); likeCounts.value = { ...likeCounts.value, [id]: Math.max(0, (likeCounts.value[id] || 1) - 1) } }
  else         { newSet.add(id);    likeCounts.value = { ...likeCounts.value, [id]: (likeCounts.value[id] || 0) + 1 } }
  userLikes.value = newSet
  try {
    if (isLiked) await supabase.from('comment_likes').delete().eq('comment_id', id).eq('user_id', auth.user.id)
    else         await supabase.from('comment_likes').insert({ comment_id: id, user_id: auth.user.id })
  } catch {
    // Откат
    const rollback = new Set(userLikes.value)
    if (isLiked) { rollback.add(id);    likeCounts.value = { ...likeCounts.value, [id]: (likeCounts.value[id] || 0) + 1 } }
    else         { rollback.delete(id); likeCounts.value = { ...likeCounts.value, [id]: Math.max(0, (likeCounts.value[id] || 1) - 1) } }
    userLikes.value = rollback
    toast.error('Не удалось обновить лайк')
  }
}

// ─── Reveal spoiler ─────────────────────────────────────────────────────
const revealSpoiler = (id) => {
  revealedSpoilers.value = new Set([...revealedSpoilers.value, id])
}

// ─── Удаление ─────────────────────────────────────────────────────────
const requestDelete = (id) => { commentToDelete.value = id; showConfirm.value = true }
const confirmedDelete = async () => {
  const id = commentToDelete.value; if (!id) return
  try {
    const { error } = await supabase.from('comments').delete().eq('id', id).eq('user_id', auth.user.id)
    if (error) throw error
    allComments.value = allComments.value.filter(c => c.id !== id)
    totalCount.value  = Math.max(0, totalCount.value - 1)
    toast.success('Комментарий удалён')
  } catch { toast.error('Не удалось удалить') } finally { commentToDelete.value = null }
}

// ─── UI helpers ─────────────────────────────────────────────────────────
const openReply  = (id) => { replyingTo.value = replyingTo.value === id ? null : id }
const setSort    = (t)  => { sortBy.value = t; displayLimit.value = PAGE_SIZE }
const loadMore   = async () => { isLoadingMore.value = true; await new Promise(r => setTimeout(r, 250)); displayLimit.value += PAGE_SIZE; isLoadingMore.value = false }

// ─── Real-time (без фильтра → надёжнее) ─────────────────────────────────
const setupRealtime = () => {
  if (!supabase || !auth.user) return
  realtimeChannel = supabase
    .channel(`comments-rt-${props.movieId}`)
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'comments' }, ({ new: incoming }) => {
      if (String(incoming.movie_id) !== String(props.movieId)) return
      if (incoming.user_id === auth.user.id) return // свои уже добавлены
      if (allComments.value.some(c => c.id === incoming.id)) return
      allComments.value.unshift(stamp(incoming))
      totalCount.value++
    })
    .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'comments' }, ({ old }) => {
      if (allComments.value.some(c => c.id === old.id)) {
        allComments.value = allComments.value.filter(c => c.id !== old.id)
        totalCount.value  = Math.max(0, totalCount.value - 1)
      }
    })
    .subscribe()
}

// ─── Lifecycle ─────────────────────────────────────────────────────────
watch(() => props.movieId, () => {
  realtimeChannel?.unsubscribe()
  revealedSpoilers.value = new Set()
  loadComments().then(setupRealtime)
})
watch(() => auth.user, (u) => { if (u) loadComments().then(setupRealtime) })
onMounted(() => loadComments().then(setupRealtime))
onUnmounted(() => realtimeChannel?.unsubscribe())
</script>

<style scoped>
/* ── Обёртка ── */
.comments-section { background: var(--bg-card); border: 1px solid var(--border); border-radius: var(--radius-lg); padding: 2rem; margin-top: 3rem; }
.comments-header { display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 1rem; margin-bottom: 2rem; }
.section-title { display: flex; align-items: center; gap: 0.5rem; font-size: 1.5rem; font-weight: 800; margin: 0; }
.title-icon { color: var(--accent); }
.comments-count { background: rgba(108,99,255,.15); color: var(--accent); font-size: .8rem; padding: 2px 8px; border-radius: 12px; }

/* ── Сортировка ── */
.sort-tabs { display: flex; gap: .4rem; }
.sort-tab { display: flex; align-items: center; gap: .35rem; padding: .4rem 1rem; border-radius: var(--radius-xl); border: 1px solid var(--border); background: transparent; color: var(--text-muted); font-family: inherit; font-size: .82rem; font-weight: 700; cursor: pointer; transition: all .2s; }
.sort-tab.active, .sort-tab:hover { background: var(--accent); border-color: var(--accent); color: #fff; }

/* ── Форма ── */
.comment-form-wrap { display: flex; gap: 1rem; margin-bottom: 2rem; align-items: flex-start; }
.user-avatar-small { width: 40px; height: 40px; border-radius: 50%; background: var(--bg-secondary); display: flex; align-items: center; justify-content: center; overflow: hidden; flex-shrink: 0; }
.user-avatar-small.small { width: 28px; height: 28px; font-size: .8rem; }
.user-avatar-small img { width: 100%; height: 100%; object-fit: cover; }
.comment-form { flex: 1; display: flex; flex-direction: column; gap: .6rem; }
.comment-form textarea, .reply-form textarea { width: 100%; background: rgba(0,0,0,.2); border: 1px solid var(--border); border-radius: var(--radius-md); padding: .85rem 1rem; color: var(--text-primary); font-family: inherit; font-size: .95rem; resize: none; transition: all var(--transition); box-sizing: border-box; }
.comment-form textarea:focus, .reply-form textarea:focus { outline: none; border-color: var(--accent); box-shadow: 0 0 0 3px rgba(108,99,255,.1); }
.form-actions { display: flex; align-items: center; gap: .75rem; flex-wrap: wrap; }
.char-count { font-size: .78rem; color: var(--text-muted); margin-right: auto; }
.char-count.warn { color: #fb923c; } .char-count.danger { color: #ef4444; }
.submit-btn { display: flex; align-items: center; gap: .4rem; background: var(--accent); color: #fff; border: none; padding: .6rem 1.2rem; border-radius: var(--radius-md); font-family: inherit; font-weight: 700; font-size: .85rem; cursor: pointer; transition: all var(--transition); }
.submit-btn.small { padding: .45rem .9rem; font-size: .8rem; }
.submit-btn:hover:not(:disabled) { background: var(--accent-2); box-shadow: 0 4px 12px var(--accent-glow); }
.submit-btn:disabled { opacity: .5; cursor: not-allowed; }
.spoiler-label { display: flex; align-items: center; gap: .5rem; font-size: .82rem; color: #ef4444; cursor: pointer; user-select: none; }
.spoiler-label input { display: none; }
.checkmark { width: 16px; height: 16px; border: 1px solid rgba(239,68,68,.5); border-radius: 4px; background: transparent; position: relative; transition: all .2s; flex-shrink: 0; }
.spoiler-label input:checked ~ .checkmark { background: #ef4444; border-color: #ef4444; }
.spoiler-label input:checked ~ .checkmark::after { content: ''; position: absolute; left: 4px; top: 1px; width: 4px; height: 8px; border: solid #fff; border-width: 0 2px 2px 0; transform: rotate(45deg); }

/* ── Auth prompt ── */
.auth-prompt { text-align: center; padding: 2.5rem 1rem; background: rgba(0,0,0,.08); border-radius: var(--radius-md); border: 1px dashed var(--border); }
.auth-prompt-icon { color: var(--text-muted); margin-bottom: 1rem; }
.auth-prompt p { color: var(--text-secondary); margin-bottom: 1.25rem; }
.auth-btn { background: rgba(108,99,255,.1); border: 1px solid rgba(108,99,255,.3); color: var(--accent); padding: .6rem 1.5rem; border-radius: var(--radius-xl); font-family: inherit; font-weight: 700; cursor: pointer; transition: all var(--transition); }
.auth-btn:hover { background: var(--accent); color: #fff; border-color: var(--accent); }

/* ── Скелетоны ── */
.skeletons { display: flex; flex-direction: column; gap: 1.5rem; }
.comment-skeleton { display: flex; gap: 1rem; align-items: flex-start; }
.sk-avatar { width: 36px; height: 36px; border-radius: 50%; flex-shrink: 0; }
.sk-body { flex: 1; display: flex; flex-direction: column; gap: .5rem; }
.sk-name { height: 12px; width: 120px; border-radius: 6px; }
.sk-text { height: 12px; border-radius: 6px; }
.sk-text-short { height: 12px; width: 60%; border-radius: 6px; }
.skeleton { background: linear-gradient(90deg, rgba(255,255,255,.04) 25%, rgba(255,255,255,.08) 50%, rgba(255,255,255,.04) 75%); background-size: 200% 100%; animation: shimmer 1.5s infinite; }
@keyframes shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }

/* ── Список ── */
.comments-list, .list-inner { display: flex; flex-direction: column; gap: 0; }
.empty-comments { text-align: center; padding: 2rem; color: var(--text-muted); }
.comment-wrapper { border-bottom: 1px solid rgba(255,255,255,.04); }
.comment-wrapper:last-child { border-bottom: none; }

/* ─ Стили компонента CommentItem (через :deep) ── */
:deep(.comment) { padding: 1.25rem 0; }
:deep(.comment.reply) { padding: .85rem 0; border-bottom: 1px solid rgba(255,255,255,.03); }
:deep(.comment.reply:last-child) { border-bottom: none; }
:deep(.comment-header) { display: flex; align-items: center; gap: .75rem; margin-bottom: .5rem; }
:deep(.author-avatar) { width: 34px; height: 34px; border-radius: 50%; background: var(--bg-secondary); border: 1px solid var(--border); display: flex; align-items: center; justify-content: center; overflow: hidden; flex-shrink: 0; font-size: .85rem; font-weight: 700; color: var(--accent); }
:deep(.author-avatar.small) { width: 26px; height: 26px; font-size: .7rem; }
:deep(.author-avatar img) { width: 100%; height: 100%; object-fit: cover; }
:deep(.author-initial) { font-weight: 700; }
:deep(.author-info) { display: flex; flex-direction: column; line-height: 1.2; flex: 1; }
:deep(.author-name) { font-weight: 700; font-size: .88rem; }
:deep(.comment-date) { font-size: .72rem; color: var(--text-muted); }
:deep(.delete-btn) { background: none; border: none; color: var(--text-muted); cursor: pointer; padding: 4px; border-radius: 4px; transition: all .2s; display: flex; align-items: center; }
:deep(.delete-btn:hover) { color: #ef4444; background: rgba(239,68,68,.1); }
:deep(.comment-body) { font-size: .93rem; line-height: 1.65; color: var(--text-secondary); position: relative; }
:deep(.comment-body.indented) { padding-left: 3rem; }
:deep(.is-blurred) { filter: blur(8px); user-select: none; }
:deep(.spoiler-overlay) { position: absolute; inset: 0; z-index: 10; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: .35rem; background: rgba(15,15,25,.5); border-radius: 8px; }
:deep(.reveal-btn) { background: rgba(239,68,68,.2); border: 1px solid rgba(239,68,68,.4); color: #fca5a5; padding: .25rem .9rem; border-radius: 12px; font-size: .72rem; font-weight: 800; cursor: pointer; }
:deep(.reveal-btn:hover) { background: #ef4444; color: #fff; }
:deep(.mention) { color: var(--accent); font-weight: 700; margin-right: .25rem; }
:deep(.comment-actions) { display: flex; gap: .5rem; margin-top: .5rem; }
:deep(.comment-actions.indented) { padding-left: 3rem; }
:deep(.action-btn) { display: flex; align-items: center; gap: .35rem; background: none; border: none; color: var(--text-muted); font-family: inherit; font-size: .78rem; font-weight: 700; cursor: pointer; padding: .3rem .6rem; border-radius: 8px; transition: all .2s; }
:deep(.action-btn:hover) { background: rgba(255,255,255,.06); color: var(--text-primary); }
:deep(.like-btn.liked) { color: var(--accent); }

/* ── Ответы ── */
.replies { margin-left: 3rem; padding: 0 0 .5rem 1rem; border-left: 2px solid rgba(255,255,255,.06); }
.reply-thread { }
.reply-form-wrap { display: flex; gap: .75rem; align-items: flex-start; margin: .5rem 0 .5rem 3rem; }
.reply-form { flex: 1; display: flex; flex-direction: column; gap: .5rem; }
.reply-actions { display: flex; align-items: center; gap: .5rem; }
.btn-cancel-reply { background: none; border: 1px solid var(--border); color: var(--text-muted); padding: .4rem .8rem; border-radius: var(--radius-md); font-family: inherit; font-size: .8rem; font-weight: 700; cursor: pointer; transition: all .2s; }
.btn-cancel-reply:hover { color: #fff; }

/* ── Load more ── */
.load-more-btn { width: 100%; margin-top: 1.5rem; padding: .75rem; border: 1px dashed var(--border); border-radius: var(--radius-md); background: transparent; color: var(--text-muted); font-family: inherit; font-size: .85rem; font-weight: 700; cursor: pointer; transition: all var(--transition); }
.load-more-btn:hover:not(:disabled) { border-color: var(--accent); color: var(--accent); background: rgba(108,99,255,.05); }

/* ── Анимации ── */
.comment-anim-enter-active { transition: all .4s cubic-bezier(.175,.885,.32,1.275); }
.comment-anim-leave-active { transition: all .25s ease; }
.comment-anim-enter-from { opacity: 0; transform: translateY(-10px); }
.comment-anim-leave-to   { opacity: 0; }
.form-expand-enter-active, .form-expand-leave-active { transition: all .3s ease; overflow: hidden; }
.form-expand-enter-from, .form-expand-leave-to { opacity: 0; max-height: 0; }
.form-expand-enter-to, .form-expand-leave-from { max-height: 250px; }

@media (max-width: 600px) {
  .comments-section { padding: 1.25rem; }
  :deep(.comment-body.indented), :deep(.comment-actions.indented) { padding-left: 0; }
  .replies { margin-left: .75rem; }
  .reply-form-wrap { margin-left: .75rem; }
}
</style>
