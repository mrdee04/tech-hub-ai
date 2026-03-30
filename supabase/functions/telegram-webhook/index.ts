import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const BOT_TOKEN = Deno.env.get('TELEGRAM_BOT_TOKEN')
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!)

serve(async (req) => {
  try {
    const payload = await req.json()
    const message = payload.message

    if (message && message.text) {
      const text = message.text
      const chatId = message.chat.id

      // Check for /start <userId>
      if (text.startsWith('/start ')) {
        const userId = text.split(' ')[1]
        
        if (userId) {
          const { error } = await supabase
            .from('profiles')
            .update({ telegram_chat_id: String(chatId) })
            .eq('id', userId)

          if (!error) {
            await sendTelegramMessage(chatId, "✅ Chúc mừng! Tài khoản của bạn đã được kết nối với TechHub Sale Hunting. Bạn sẽ nhận được thông báo tự động tại đây.")
          } else {
            await sendTelegramMessage(chatId, "❌ Có lỗi xảy ra khi kết nối tài khoản. Vui lòng thử lại sau hoặc liên hệ admin.")
            console.error('Supabase update error:', error)
          }
        }
      } else if (text === '/start') {
        await sendTelegramMessage(chatId, "Chào mừng bạn đến với TechHub Sale Hunting Bot! 🤖\n\nVui lòng nhấn nút 'Kết nối Telegram' trên website để liên kết tài khoản của bạn.")
      }
    }

    return new Response(JSON.stringify({ ok: true }), { status: 200 })
  } catch (error) {
    console.error('Webhook error:', error)
    return new Response(JSON.stringify({ error: error.message }), { status: 500 })
  }
})

async function sendTelegramMessage(chatId: number, text: string) {
  const url = `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`
  await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, text: text })
  })
}
