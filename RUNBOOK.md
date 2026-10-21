# RUNBOOK — VẬN HÀNH WEBSITE CHOCOMINO

## 1. Tổng quan kiến trúc & Hosting (Vercel Free Tier)
- **Frontend / API**: Next.js (App Router, TypeScript) deploy trên **Vercel Hobby (Free Tier)**.
- **Database / Auth / Storage**: **Supabase** (PostgreSQL + S3-compatible Storage + Auth).
- **Thanh toán**: VietQR động qua SePay (kết nối tài khoản cá nhân Techcombank).
- **Vận chuyển**: Xuất file Excel hàng loạt theo mẫu chuẩn SPX Express.

---

## 2. Xử lý giới hạn của Vercel Free Tier (Hobby)
- **Giới hạn Cron Job**: Gói Hobby của Vercel chỉ cho phép tối đa 1 cron job / ngày.
- **Giải pháp cho tác vụ nền**:
  1. **Hủy đơn QR hết hạn (15 phút)**:
     - Khách mở trang thanh toán QR: client gọi polling nhẹ `/api/orders/[code]/status`.
     - Tác vụ server: Chạy qua function SQL `cancel_expired_qr_orders()` kích hoạt bởi:
       - **Phương án 1 (Khuyến nghị)**: Bật extension `pg_cron` trực tiếp trong Database Supabase:
         ```sql
         SELECT cron.schedule('cancel-expired-orders', '*/5 * * * *', 'SELECT cancel_expired_qr_orders()');
         ```
       - **Phương án 2**: Dùng dịch vụ cron bên ngoài miễn phí (cron-job.org hoặc GitHub Actions scheduled workflow) gọi vào webhook bí mật `/api/cron/cancel-expired` với header `Authorization: Bearer CRON_SECRET`.
  2. **Thời gian chạy Function**: Serverless functions trên Vercel Hobby có timeout tối đa 10s (mặc định) / 15s. Mọi tác vụ xuất Excel SPX hoặc xử lý webhook SePay đều được tối ưu hóa xử lý trong < 1.5 giây.

---

## 3. Khởi tạo Database Supabase
1. Đăng nhập Supabase Dashboard -> Tạo project mới (Region: Singapore để có độ trễ thấp nhất tới Việt Nam).
2. Vào mục **SQL Editor** -> Chạy nội dung file [supabase/migrations/20261021_init_schema.sql](file:///d:/website_chocomino/supabase/migrations/20261021_init_schema.sql).
3. Vào **Storage** -> Tạo public bucket `product-media` (cho phép tải ảnh WebP/JPEG $\le$ 5MB và video $\le$ 5MB).
4. Lấy `Project URL`, `anon key` và `service_role key` đưa vào biến môi trường trên Vercel.

---

## 4. Cấu hình Webhook SePay
1. Đăng nhập [my.sepay.vn](https://my.sepay.vn).
2. Thêm kết nối tài khoản ngân hàng Techcombank.
3. Cài đặt Webhook:
   - URL: `https://your-domain.vercel.app/api/webhooks/sepay`
   - Phương thức: `POST`
   - Secret key: Tạo khóa bí mật và điền vào biến môi trường `SEPAY_WEBHOOK_SECRET`.
4. Cơ chế chống trùng và bảo mật: Webhook của website kiểm tra chữ ký HMAC-SHA256 và lưu `provider_tx_id` vào bảng `bank_transactions` với ràng buộc `UNIQUE`.

---

## 5. Quy trình xuất đơn SPX Express
1. Đăng nhập Admin (`/admin/orders`).
2. Lọc các đơn ở trạng thái **"Đóng gói"** (Packing).
3. Bấm nút **"Xuất Excel SPX"** -> Hệ thống tạo file `.xlsx` dựa trên khuôn gốc [spx_template.xlsx](file:///d:/website_chocomino/assets/spx_template.xlsx).
4. Tải file lên cổng đối tác SPX: `spx.vn` -> **Tạo đơn -> Tạo nhiều đơn hàng -> Chọn tệp**.
5. Nhận mã vận đơn từ SPX và nhập/import lại vào website. Đơn tự động chuyển sang trạng thái **"Giao"** (Shipping).

---

## 6. Xử lý sự cố thường gặp (Troubleshooting)
- **Tiền về nhưng đơn chưa tự động xác nhận**:
  - Vào Admin -> Chi tiết đơn -> Kiểm tra tab "Giao dịch ngân hàng".
  - Nếu khách chuyển thiếu tiền hoặc sai cú pháp mã đơn, giao dịch sẽ đánh dấu `needs_review`.
  - Chủ shop (Owner) có nút **"Xác nhận thanh toán thủ công"** để cập nhật trạng thái đơn ngay lập tức.
- **Khách không nhận được email**:
  - Do chưa có tên miền riêng, hệ thống website cung cấp trang tra cứu trực tiếp `/tra-cuu` bằng Mã đơn + SĐT. Hướng dẫn khách kiểm tra trạng thái trên website mà không cần phụ thuộc vào email.
