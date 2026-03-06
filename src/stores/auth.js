import { defineStore } from 'pinia'
import { supabase } from '../api/supabase'
import { ref } from 'vue'

export const useAuthStore = defineStore('auth', () => {
  const user = ref(null)
  const session = ref(null)
  const loading = ref(true)

  // Инициализация при загрузке
  const init = async () => {
    if (!supabase) {
      console.warn('Supabase client is not initialized. Auth features are disabled.')
      loading.value = false
      return
    }

    loading.value = true
    const { data } = await supabase.auth.getSession()
    session.value = data.session
    user.value = data.session?.user || null
    loading.value = false

    // Слушаем изменения (вход/выход)
    supabase.auth.onAuthStateChange((_event, _session) => {
      session.value = _session
      user.value = _session?.user || null
    })
  }

  const signInWithTelegramEdgeFunction = async (telegramUser) => {
    if (!supabase) {
      console.error('Cannot sign in: Supabase client is not initialized.')
      return
    }
    loading.value = true
    try {
      // 1. Отправляем данные от виджета в нашу Edge Function
      const { data, error } = await supabase.functions.invoke('telegram-auth', {
        body: telegramUser
      })

      if (error) throw error

      if (data?.magic_link) {
        const tokenHash = data.hashed_token || new URL(data.magic_link).searchParams.get('token_hash') || new URL(data.magic_link).searchParams.get('token');

        if (tokenHash) {
          const { data: sessionData, error: sessionError } = await supabase.auth.verifyOtp({
            token_hash: tokenHash,
            type: 'magiclink'
          });

          if (sessionError) throw sessionError;

          session.value = sessionData.session
          user.value = sessionData.user
        } else {
          throw new Error('Could not find token in Edge Function response')
        }
      } else {
        throw new Error('No magic link returned from Edge Function: ' + JSON.stringify(data))
      }

    } catch (err) {
      console.error('Telegram Auth Error:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  const logout = async () => {
    if (!supabase) return
    await supabase.auth.signOut()
    user.value = null
    session.value = null
  }

  return {
    user,
    session,
    loading,
    init,
    signInWithTelegramEdgeFunction,
    logout
  }
})
