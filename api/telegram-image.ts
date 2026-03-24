export default async function handler(req: any, res: any) {
  const { file_id } = req.query;
  const token = process.env.TELEGRAM_BOT_TOKEN;

  if (!file_id || !token) {
    return res.status(400).json({ error: 'Missing file_id or bot token' });
  }

  try {
    // 1. Lấy File Path từ Telegram
    const getFileResponse = await fetch(`https://api.telegram.org/bot${token}/getFile?file_id=${file_id}`);
    const fileData = await getFileResponse.json();

    if (!fileData.ok) {
      return res.status(404).json({ error: 'File not found on Telegram' });
    }

    const filePath = fileData.result.file_path;
    const fileUrl = `https://api.telegram.org/file/bot${token}/${filePath}`;

    // 2. Fetch ảnh thực tế và stream về trình duyệt
    const imageResponse = await fetch(fileUrl);
    
    if (!imageResponse.ok) {
      return res.status(500).json({ error: 'Failed to fetch image from Telegram' });
    }

    const contentType = imageResponse.headers.get('content-type') || 'image/jpeg';
    const buffer = await imageResponse.arrayBuffer();

    res.setHeader('Content-Type', contentType);
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    return res.send(Buffer.from(buffer));

  } catch (error) {
    console.error('Image proxy error:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}
