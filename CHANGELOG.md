# CHANGELOG — CHOCOMINO WEBSITE

## [0.1.0] - 2026-10-21 (G0 -> Khởi tạo G1 MVP)

### Added
- **Core Architecture**: Khởi tạo project Next.js 16 (App Router, Turbopack, TypeScript, Tailwind CSS v4).
- **Domain & Branding**:
  - Tích hợp typography Google Fonts: `Baloo 2` (tiêu đề/nhấn) và `Nunito` (nội dung) hỗ trợ đầy đủ tiếng Việt.
  - Cấu hình bảng màu chuẩn Chocomino: Hồng kẹo (`#F9739B`), Hồng đậm (`#E24C7C`), Nền kem (`#FFF9F6`), Chữ Nâu chocolate (`#5A3A3A`), Xanh mint (`#9ADFC8`).
- **Database & DDL Migration**:
  - Tạo file schema [supabase/migrations/20261021_init_schema.sql](file:///d:/website_chocomino/supabase/migrations/20261021_init_schema.sql) gồm 17 bảng dữ liệu quan hệ, enums, triggers và stored procedure.
  - Stored Procedure `create_order_atomic`: Cơ chế khóa bi-quan `FOR UPDATE` chống race condition bán vượt tồn kho (overselling).
  - Tự động hủy đơn QR hết hạn sau 15 phút (`cancel_expired_qr_orders`).
  - Tự động ẩn danh hóa dữ liệu khách hàng sau 90 ngày (`anonymize_expired_customer_data`).
- **SPX Express Module**:
  - Lưu file khuôn chuẩn [assets/spx_template.xlsx](file:///d:/website_chocomino/assets/spx_template.xlsx).
  - Module `src/lib/spx/export.ts` xuất Excel hàng loạt 2 cấp (Tỉnh/Thành -> Phường/Xã).
  - Trích xuất cơ sở dữ liệu địa giới hành chính chuẩn 2 cấp [src/data/administrative_areas.json](file:///d:/website_chocomino/src/data/administrative_areas.json) (34 tỉnh/thành, 3.321 phường/xã).
- **SePay & VietQR Integration**:
  - Module `src/lib/sepay/vietqr.ts` tạo mã QR động kèm mã đơn `CMxxxxxx` và xác thực chữ ký HMAC-SHA256 Webhook.
- **Telegram Bot Notifier**:
  - Module `src/lib/telegram/bot.ts` thông báo đơn hàng mới, tiền về tài khoản, và cảnh báo giao dịch cần kiểm tra tay.
- **Vận hành & Hướng dẫn**:
  - Tạo [.env.example](file:///d:/website_chocomino/.env.example) và [RUNBOOK.md](file:///d:/website_chocomino/RUNBOOK.md) cho Vercel Free tier.
