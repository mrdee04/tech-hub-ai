import { createClient } from '@supabase/supabase-js';

// Vercel Serverless API Route handling requests from Telegram
export default async function handler(req: any, res: any) {
  // Chỉ nhận POST request từ Telegram
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const body = req.body;
    
    // Đảm bảo tin nhắn tồn tại
    if (!body || !body.message) {
      return res.status(200).json({ status: 'Ignored: No message inside body' });
    }

    const { message } = body;
    const text = message.text;
    const chatId = message.chat?.id;

    if (!text) {
      return res.status(200).json({ status: 'Ignored: Not a text message' });
    }

    // Bảo mật: Nếu bạn muốn thiết lập chỉ nhận tin từ 1 group cụ thể, 
    // hãy điền ID của group vào biến TELEGRAM_ADMIN_CHAT_ID trên Vercel.
    const adminChatId = process.env.TELEGRAM_ADMIN_CHAT_ID;
    if (adminChatId && String(chatId) !== String(adminChatId)) {
      console.log(`Ignored message from unauthorized chat: ${chatId}`);
      return res.status(200).json({ status: 'Ignored: Unauthorized chat' });
    }

    // Kết nối Supabase bằng quyền Service Role (Bypass RLS)
    const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error("Missing Supabase credentials in Environment Variables.");
      return res.status(500).json({ error: 'Server configuration error: Missing Supabase Env' });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Lấy danh sách banner báo kèo hiện tại
    const { data: currentData, error: fetchError } = await supabase
      .from('site_settings')
      .select('value')
      .eq('id', 'global_banner')
      .single();

    if (fetchError && fetchError.code !== 'PGRST116') {
      console.error("Error fetching settings:", fetchError);
      return res.status(500).json({ error: 'Database fetch error' });
    }

    const currentSettings = currentData?.value || {};
    let items = currentSettings.items || [];
    if (!Array.isArray(items)) {
       items = [];
    }

    // Tạo BannerItem mới từ nội dung chat
    const newItem = {
      id: `tg-${message.message_id}-${Date.now()}`,
      isActive: true,
      text: `${text}`, 
      link: '',
      imageUrl: ''
    };

    // Chèn lên đầu danh sách, giữ tối đa 5 thông báo mới nhất để tránh nặng Web
    items = [newItem, ...items].slice(0, 5);

    const newValue = {
      enabled: currentSettings.enabled ?? true, // Giữ nguyên trạng thái cũ, không tự ý ghi đè thành true
      items: items
    };

    // Cập nhật lên Supabase
    const { error: updateError } = await supabase
      .from('site_settings')
      .upsert({ id: 'global_banner', value: newValue, updated_at: new Date().toISOString() });

    if (updateError) {
      console.error("Error updating settings:", updateError);
      return res.status(500).json({ error: 'Database update error' });
    }

    // Trả về 200 để Telegram biết là đã nhận thành công (nếu không Bot sẽ gửi lại liên tục)
    return res.status(200).json({ success: true, message: 'Banner updated on TechHub!' });
    
  } catch (error: any) {
    console.error('Webhook error:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}
