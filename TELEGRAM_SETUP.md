# HƯỚNG DẪN CÀI ĐẶT TELEGRAM WEBHOOK CHO BANNER KÈO NGON

Tính năng này giúp website tự động nội dung tin nhắn mới nhất từ nhóm Telegram của bạn và ghim thẳng lên Notification Banner của Website.
Mã nguồn xử lý (Serverless API) đã được code sẵn tại file `api/telegram.ts`. Khi code này được đẩy (Push) lên Github và Deploy trên Vercel, nó sẽ trở thành 1 "Trạm thu phát".

Để trạm thu phát này hoạt động, bạn chỉ cần làm theo 4 bước sau vào lúc rảnh:

## BƯỚC 1: TẠO BOT TELEGRAM
1. Mở ứng dụng Telegram, tìm tài khoản có tên **@BotFather** (có dấu tích xanh dương).
2. Chat lệnh `/newbot`, sau đó hệ thống sẽ hỏi Tên Bot (VD: `Bot Săn Sale TechHub`) và Username cho Bot (VD: `TechHubSale_bot`).
3. BotFather sẽ trả về cho bạn một đoạn mã Token dài.
   *Ví dụ: `123456789:ABC-DEF1234ghIkl-zyx57W2v1u...`*
   **=> Hãy Copy và cất đoạn mã Bot Token này lại.**

## BƯỚC 2: THÊM BOT VÀO NHÓM TELEGRAM
1. Mở Channel (kênh thông báo) hoặc Group chat (nhóm săn sale) của bạn trên Telegram.
2. Thêm con Bot bạn vừa tạo ở (Bước 1) vào nhóm.
3. Cấp cho Bot quyền **Admin** (Administrator) để nó có thể đọc và quản lý tin nhắn.

## BƯỚC 3: CẤU HÌNH BIẾN MÔI TRƯỜNG TRÊN VERCEL
1. Bạn phải đảm bảo code hiện tại (bao gồm file `api/telegram.ts`) đã được **Commit và Push** lên Github, để Vercel tự động nhận diện bản cập nhật mới.
2. Đăng nhập vào Dashboard của Vercel > Chọn dự án TechHub của bạn.
3. Chuyển sang thẻ **Settings** > Chọn mục **Environment Variables** (cột bên trái).
4. Thêm 3 biến môi trường sau đây:
   - Tên biến 1: `TELEGRAM_BOT_TOKEN`
     - *Giá trị: Dán cái Bot Token bạn đã copy ở Bước 1 vào đây.*
   - Tên biến 2: `VITE_SUPABASE_URL`
     - *Giá trị: Link URL dự án Supabase của bạn (VD: `https://xyz...supabase.co`)*
   - Tên biến 3: `SUPABASE_SERVICE_ROLE_KEY`
     - *Giá trị: Vào trang quản lý Supabase > Project Settings > API > mục `service_role` (secret), copy dòng mã dài đó dán vào đây.*
5. Xong việc thêm 3 biến, bạn qua thẻ **Deployments** trên Vercel, chọn bản build mới nhất, ấn dấu 3 chấm và chọn **Redeploy** (để Vercel áp dụng biến môi trường mới).

## BƯỚC 4: KẾT NỐI TELEGRAM VỚI WEBSITE (WEBHOOK)
Chỉ cần thực hiện bước này 1 lần duy nhất để "báo cáo" địa chỉ cho Telegram biết.
1. Bạn mở 1 TAB TRÌNH DUYỆT mới (Chrome/Cốc Cốc...).
2. Copy đường link dưới đây, **THAY THẾ** các thông tin trong ngoặc vuông `[...]` bằng số liệu thật của bạn:
   
   `https://api.telegram.org/bot[BOT_TOKEN_CỦA_BẠN]/setWebhook?url=https://[DOMAIN_VERCEL_CỦA_BẠN]/api/telegram`

   *Ví dụ thực tế trông như thế này:*
   `https://api.telegram.org/bot123456:ABC-DEF/setWebhook?url=https://tech-hub-ai.vercel.app/api/telegram`

3. Dán link vừa sửa xong lên thanh địa chỉ trình duyệt và Enter.
4. Trình duyệt trả về chữ `{"ok":true,"result":true,"description":"Webhook was set"}` là THÀNH CÔNG!

---
🎉 **HOÀN TẤT:** Kể từ bây giờ, bất kỳ lúc nào bạn (hoặc ai đó) chat một dòng thoại vào nhóm Telegram, thông báo đó sẽ tự động "bay thẳng" lên Banner Kèo Ngon của web trong tíc tắc! Nếu có nhiều dòng, banner sẽ tự động trượt!
