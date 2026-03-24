import { createClient } from '@supabase/supabase-js';

// Vercel Serverless API Route handling requests from Telegram
export default async function handler(req: any, res: any) {
  // Chỉ nhận POST request từ Telegram
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const body = req.body;
    
    // Hỗ trợ cả tin nhắn từ Group/Private (body.message) và Kênh (body.channel_post)
    const message = body.message || body.channel_post;
    
    if (!message) {
      return res.status(200).json({ status: 'Ignored: No message or channel_post inside body' });
    }

    // Lấy nội dung chữ: text (tin nhắn thường) hoặc caption (tin nhắn kèm ảnh)
    const text = message.text || message.caption || "";
    const chatId = message.chat?.id;
    const messageId = message.message_id;

    // Lấy ảnh: Telegram gửi mảng photo, lấy cái cuối cùng là ảnh to nhất
    let imageUrl = "";
    if (message.photo && Array.isArray(message.photo) && message.photo.length > 0) {
      const largestPhoto = message.photo[message.photo.length - 1];
      // Chúng ta sẽ dùng API proxy để hiển thị ảnh này an toàn
      imageUrl = `/api/telegram-image?file_id=${largestPhoto.file_id}`;
    }

    // Trích xuất link: Ưu tiên link từ text hoặc caption
    let link = "";
    const urlMatch = text.match(/https?:\/\/[^\s]+/);
    if (urlMatch) {
      link = urlMatch[0].replace(/[).,]+$/, ""); // Làm sạch link
    }

    console.log(`Received message from ${chatId}: ${text.substring(0, 50)}... Image: ${!!imageUrl}, Link: ${link}`);

    // Bảo mật: Admin Chat ID
    const adminChatId = process.env.TELEGRAM_ADMIN_CHAT_ID;
    if (adminChatId && adminChatId.trim() !== "" && String(chatId) !== String(adminChatId)) {
      console.log(`Ignored message from unauthorized chat: ${chatId}. Required: ${adminChatId}`);
      return res.status(200).json({ status: 'Ignored: Unauthorized chat', yourChatId: chatId });
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
      link: link, // Đã trích xuất link tự động
      imageUrl: imageUrl // Trỏ về proxy api/telegram-image
    };

    // Chèn lên đầu danh sách, giữ tối đa 5 thông báo mới nhất để tránh nặng Web
    items = [newItem, ...items].slice(0, 5);

    const newValue = {
      enabled: currentSettings.enabled ?? true, // Giữ nguyên trạng thái cũ, không tự ý ghi đè thành true
      items: items
    };

    // Cập nhật lên Supabase
    // Cập nhật Banner chính
    await supabase.from('site_settings').upsert({ 
      id: 'global_banner', 
      value: newValue, 
      updated_at: new Date().toISOString() 
    });

    // Ghi log vào Database để debug (Lưu lại thông tin request cuối cùng)
    await supabase.from('site_settings').upsert({
      id: 'webhook_log',
      value: {
        last_chat_id: chatId,
        last_text: text,
        timestamp: new Date().toISOString(),
        full_body: body
      }
    });

    // Trả về 200 để Telegram biết là đã nhận thành công
    return res.status(200).json({ success: true, message: 'Banner updated on TechHub!', chatId });
    
  } catch (error: any) {
    console.error('Webhook error:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}
