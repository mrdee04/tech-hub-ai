import { createClient } from '@supabase/supabase-js';

export default async function handler(req: any, res: any) {
  const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const adminChatId = process.env.TELEGRAM_ADMIN_CHAT_ID;

  const envCheck = {
    VITE_SUPABASE_URL: !!process.env.VITE_SUPABASE_URL,
    SUPABASE_URL: !!process.env.SUPABASE_URL,
    SUPABASE_SERVICE_ROLE_KEY: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    TELEGRAM_ADMIN_CHAT_ID_SET: !!(adminChatId && adminChatId.trim() !== "")
  };

  if (!supabaseUrl || !supabaseServiceKey) {
    return res.status(200).json({ 
      error: 'Thiếu biến môi trường Supabase trên Vercel!',
      envCheck 
    });
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  const { data, error } = await supabase
    .from('site_settings')
    .select('*')
    .eq('id', 'global_banner')
    .single();

  if (error) {
    return res.status(200).json({ error: error.message, envCheck });
  }

  return res.status(200).json({
    message: "Đây là dữ liệu Banner hiện tại trong Database của bạn.",
    envCheck,
    data: data.value,
    updated_at: data.updated_at
  });
}
