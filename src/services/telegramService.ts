import { supabase } from '../supabaseClient';

// NOTE: In a production environment, never expose your BOT_TOKEN on the client side.
// This should ideally be handled by a Supabase Edge Function or a backend service.
// For demonstration and initial setup, we provide this service structure.
const TELEGRAM_BOT_TOKEN = import.meta.env.VITE_TELEGRAM_BOT_TOKEN || ''; 

export const sendTelegramMessage = async (chatId: string, message: string): Promise<boolean> => {
  if (!TELEGRAM_BOT_TOKEN || !chatId) return false;

  try {
    const response = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chat_id: chatId,
        text: message,
        parse_mode: 'HTML',
      }),
    });

    return response.ok;
  } catch (error) {
    console.error('Error sending Telegram message:', error);
    return false;
  }
};

export const getBotLink = (userId?: string) => {
  const botUsername = 'TechHubSaleHuntingBot'; // Base username
  if (userId) {
    return `https://t.me/${botUsername}?start=${userId}`;
  }
  return `https://t.me/${botUsername}`;
};

/**
 * Notifies the owner of a sale post when someone responds.
 */
export const notifyPostOwnerOfResponse = async (ownerId: string, responderName: string, productName: string) => {
  const { data: profile } = await supabase
    .from('profiles')
    .select('telegram_chat_id')
    .eq('id', ownerId)
    .single();

  if (profile?.telegram_chat_id) {
    const message = `🔔 <b>Kèo của bạn có phản hồi mới!</b>\n\nThành viên <b>${responderName}</b> vừa nhận kèo: <i>${productName}</i>\n\nHãy vào TechHub AI để kiểm tra ngay!`;
    await sendTelegramMessage(profile.telegram_chat_id, message);
  }
};

/**
 * Notifies both parties when a deal is matched.
 */
export const notifyDealMatched = async (userIds: string[], productName: string) => {
  for (const id of userIds) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('telegram_chat_id, full_name')
      .eq('id', id)
      .single();

    if (profile?.telegram_chat_id) {
      const message = `✅ <b>Giao dịch thành công!</b>\n\nKèo <i>${productName}</i> đã được xác nhận khớp bởi cả hai bên.\n\nHãy liên hệ trực tiếp để hoàn tất giao dịch. Chúc mừng bạn!`;
      await sendTelegramMessage(profile.telegram_chat_id, message);
    }
  }
};
