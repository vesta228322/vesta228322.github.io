import { defineStore } from 'pinia'
import { supabase } from '../api/supabase'
import { ref } from 'vue'

export const useAuthStore = defineStore('auth', () => {
  const user = ref(null)
  const session = ref(null)
  const loading = ref(true)

  // Инициализация при загрузке
  const init = async () => {
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

  const signInWithTelegram = async () => {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'telegram',
      options: {
        redirectTo: window.location.origin
      }
    })
    if (error) throw error
    return data
  }

  const logout = async () => {
    await supabase.auth.signOut()
    user.value = null
    session.value = null
  }

  return {
    user,
    session,
    loading,
    init,
    signInWithTelegram,
    logout
  }
})
