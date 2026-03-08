import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const payload = await req.json()
    const { type, record } = payload
    // type: 'comment_reply' | 'comment_like'
    // record: новая запись из таблицы (comments или comment_likes)

    const BOT_TOKEN = Deno.env.get('TELEGRAM_BOT_TOKEN')
    if (!BOT_TOKEN) throw new Error('TELEGRAM_BOT_TOKEN не настроен')

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { autoRefreshToken: false, persistSession: false } }
    )

    // ─── Ответ на комментарий ─────────────────────────────────────────
    if (type === 'comment_reply' && record.parent_id) {
      // Получаем родительский комментарий
      const { data: parent } = await supabase
        .from('comments')
        .select('user_id, user_name, content')
        .eq('id', record.parent_id)
        .single()

      if (!parent) return ok()

      // Не уведомляем если человек ответил сам себе
      if (parent.user_id === record.user_id) return ok()

      // Получаем Telegram ID автора родительского комментария
      const { data: userData } = await supabase.auth.admin.getUserById(parent.user_id)
      const telegramId = userData?.user?.user_metadata?.provider_id
      if (!telegramId) return ok()

      const replierName = record.user_name || 'Кто-то'
      const snippet = (record.content || '').slice(0, 100)
      const parentSnippet = (parent.content || '').slice(0, 60)

      const text = [
        `💬 *${escMd(replierName)}* ответил на твой комментарий`,
        ``,
        `_"${escMd(parentSnippet)}…"_`,
        ``,
        `*Ответ:* ${escMd(snippet)}`,
        ``,
        `👉 [Открыть KinoFlow](https://vesta228322.github.io/kinoflow/)`,
      ].join('\n')

      await sendTelegram(BOT_TOKEN, telegramId, text)
    }

    // ─── Лайк на комментарий ─────────────────────────────────────────
    if (type === 'comment_like') {
      const { data: comment } = await supabase
        .from('comments')
        .select('user_id, user_name, content')
        .eq('id', record.comment_id)
        .single()

      if (!comment) return ok()
      if (comment.user_id === record.user_id) return ok() // Сам себе

      const { data: userData } = await supabase.auth.admin.getUserById(comment.user_id)
      const telegramId = userData?.user?.user_metadata?.provider_id
      if (!telegramId) return ok()

      // Считаем общее количество лайков
      const { count } = await supabase
        .from('comment_likes')
        .select('*', { count: 'exact', head: true })
        .eq('comment_id', record.comment_id)

      const snippet = (comment.content || '').slice(0, 80)

      const text = [
        `👍 Твой комментарий получил лайк!`,
        ``,
        `_"${escMd(snippet)}…"_`,
        ``,
        `Всего лайков: *${count || 1}*`,
      ].join('\n')

      await sendTelegram(BOT_TOKEN, telegramId, text)
    }

    return ok()

  } catch (e) {
    console.error('telegram-notify error:', e)
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})

// ─── Helpers ─────────────────────────────────────────────────────────────
async function sendTelegram(token, chatId, text) {
  const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, text, parse_mode: 'MarkdownV2', disable_web_page_preview: true })
  })
  const data = await res.json()
  if (!data.ok) console.error('Telegram API error:', data)
  return data
}

// Экранируем спецсимволы MarkdownV2
function escMd(text = '') {
  return text.replace(/[_*[\]()~`>#+\-=|{}.!]/g, c => '\\' + c)
}

function ok() {
  return new Response(JSON.stringify({ ok: true }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  })
}
