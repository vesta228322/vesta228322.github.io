import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { crypto } from 'https://deno.land/std@0.168.0/crypto/mod.ts'

// Вспомогательная функция для CORS
export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Обработка CORS-запросов (preflight)
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const body = await req.json()
    const { id, first_name, last_name, username, photo_url, auth_date, hash } = body

    if (!hash) {
      return new Response(JSON.stringify({ error: 'Missing hash' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    // 1. Проверяем валидность хэша от Telegram
    const botToken = Deno.env.get('TELEGRAM_BOT_TOKEN')
    if (!botToken) {
      throw new Error('TELEGRAM_BOT_TOKEN is not configured in Edge Function secrets')
    }

    // Собираем строку для проверки данных
    const dataCheckArr = []
    if (auth_date) dataCheckArr.push(`auth_date=${auth_date}`)
    if (first_name) dataCheckArr.push(`first_name=${first_name}`)
    if (id) dataCheckArr.push(`id=${id}`)
    if (last_name) dataCheckArr.push(`last_name=${last_name}`)
    if (photo_url) dataCheckArr.push(`photo_url=${photo_url}`)
    if (username) dataCheckArr.push(`username=${username}`)

    const dataCheckString = dataCheckArr.sort().join('\n')

    // Делаем SHA256 хэш ключа от токена бота
    const secretKey = await crypto.subtle.importKey(
      'raw',
      new TextEncoder().encode('WebAppData'), // Константа WebAppData используется для Telegram WebApp, для Login Widget - просто SHA256 токена.
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );

    const secretKeyWidget = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(botToken));
    const hmacKey = await crypto.subtle.importKey(
        'raw', 
        secretKeyWidget, 
        { name: 'HMAC', hash: 'SHA-256' }, 
        false, 
        ['sign']
    );

    const signature = await crypto.subtle.sign('HMAC', hmacKey, new TextEncoder().encode(dataCheckString));
    const hexSignature = Array.from(new Uint8Array(signature)).map(b => b.toString(16).padStart(2, '0')).join('');

    // Если хэш не совпадает - запрос подделан
    if (hexSignature !== hash) {
      console.error('Invalid Telegram hash')
      return new Response(JSON.stringify({ error: 'Data is NOT from Telegram' }), { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    // 2. Инициализируем Supabase с правами Администратора (Service Role)
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { autoRefreshToken: false, persistSession: false } }
    )

    // 3. Создаем или обновляем пользователя
    // Почта - это заглушка, т.к. Supabase Auth требует email, а Telegram его не дает.
    const fakeEmail = `${id}@telegram.local`
    // Генерируем сложный случайный пароль, он не понадобится юзеру.
    const fakePassword = crypto.randomUUID() 

    // Проверяем, существует ли пользователь (мы ищем его по метаданным provider_id)
    const { data: usersData, error: usersError } = await supabaseClient.auth.admin.listUsers()
    if (usersError) throw usersError;
    
    let user = usersData.users.find(u => u.user_metadata?.provider_id === String(id) || u.email === fakeEmail)

    if (!user) {
      // Пользователя нет -> создаем
      const { data: newUserData, error: createError } = await supabaseClient.auth.admin.createUser({
        email: fakeEmail,
        password: fakePassword,
        email_confirm: true,
        user_metadata: {
          provider: 'telegram',
          provider_id: String(id),
          custom_claims: { telegram_id: id },
          name: first_name + (last_name ? ` ${last_name}` : ''),
          username: username,
          avatar_url: photo_url
        }
      })
      if (createError) throw createError
      user = newUserData.user
    } else {
        // Обновляем метаданные на случай изменения имени/аватарки
        await supabaseClient.auth.admin.updateUserById(user.id, {
            user_metadata: {
              ...user.user_metadata,
              name: first_name + (last_name ? ` ${last_name}` : ''),
              username: username,
              avatar_url: photo_url
            }
        });
    }

    // 4. Логиним пользователя и выдаем нормальный токен для клиента
    // Отправляем MAGIC LINK или генерируем сессию. В admin API нет прямой команды "вспомнить сессию"
    // Самый надежный способ - использовать generateLink API 
    const { data: linkData, error: linkError } = await supabaseClient.auth.admin.generateLink({
      type: 'magiclink',
      email: fakeEmail,
    })
    
    if (linkError) throw linkError

    // Возвращаем magic link, hashed_token и данные пользователя. На фронтенде мы вытащим из квери-параметров token_hash 
    // и сделаем verifyOtp
    return new Response(JSON.stringify({ 
        message: 'Successfully verified',
        user: user,
        magic_link: linkData.properties.action_link,
        hashed_token: linkData.properties?.hashed_token
    }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })

  } catch (error) {
    console.error(error)
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }
})
