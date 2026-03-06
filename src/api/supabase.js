import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Проверка на наличие ключей, чтобы предотвратить Uncaught Error: supabaseUrl is required
if (!supabaseUrl || !supabaseAnonKey) {
    console.error('Supabase URL or Anon Key is missing in .env file!')
}

export const supabase = (supabaseUrl && supabaseAnonKey)
    ? createClient(supabaseUrl, supabaseAnonKey)
    : null
