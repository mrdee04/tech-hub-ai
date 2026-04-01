import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

import { cloudflare } from "@cloudflare/vite-plugin";

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  return {
    plugins: [react(), cloudflare()],
    server: {
      proxy: {
        '/api/telegram-image': {
          target: 'https://api.telegram.org',
          changeOrigin: true,
          selfHandleResponse: true,
          configure: (proxy) => {
            proxy.on('proxyReq', async (_proxyReq, req, res) => {
              const url = new URL(req.url!, `http://${req.headers.host}`);
              const fileId = url.searchParams.get('file_id');
              const token = env.TELEGRAM_BOT_TOKEN;

              // If missing token or file_id, return a placeholder instead of an error to prevent the UI from hiding it
              if (!fileId || !token) {
                const placeholderSvg = `<svg width="400" height="300" xmlns="http://www.w3.org/2000/svg"><rect width="100%" height="100%" fill="#222"/><text x="50%" y="45%" font-family="Arial" font-size="24" fill="#666" text-anchor="middle">Telegram Image</text><text x="50%" y="55%" font-family="Arial" font-size="14" fill="#444" text-anchor="middle">(Set TELEGRAM_BOT_TOKEN in .env to view)</text></svg>`;
                res.writeHead(200, { 'Content-Type': 'image/svg+xml' });
                res.end(placeholderSvg.trim());
                return;
              }

              try {
                // 1. Lấy File Path từ Telegram
                const getFileResponse = await fetch(`https://api.telegram.org/bot${token}/getFile?file_id=${fileId}`);
                const fileData = await getFileResponse.json() as any;

                if (!fileData.ok) {
                  throw new Error('File not found on Telegram');
                }

                const filePath = fileData.result.file_path;
                const fileUrl = `https://api.telegram.org/file/bot${token}/${filePath}`;

                // 2. Fetch ảnh thực tế và trả về
                const imageResponse = await fetch(fileUrl);
                if (!imageResponse.ok) {
                  throw new Error('Failed to fetch image from Telegram');
                }

                const contentType = imageResponse.headers.get('content-type') || 'image/jpeg';
                const buffer = await imageResponse.arrayBuffer();

                res.writeHead(200, {
                  'Content-Type': contentType,
                  'Cache-Control': 'public, max-age=31536000, immutable'
                });
                res.end(Buffer.from(buffer));
              } catch (error) {
                console.error('Local Proxy Image Error:', error);
                // Return a clear error placeholder
                const errorSvg = `<svg width="400" height="300" xmlns="http://www.w3.org/2000/svg"><rect width="100%" height="100%" fill="#331111"/><text x="50%" y="50%" font-family="Arial" font-size="20" fill="#f66" text-anchor="middle">Error Loading Image</text></svg>`;
                res.writeHead(200, { 'Content-Type': 'image/svg+xml' });
                res.end(errorSvg);
              }
            });
          }
        }
      }
    }
  };
})