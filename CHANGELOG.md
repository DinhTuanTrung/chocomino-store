# CHANGELOG — CHOCOMINO WEBSITE

## [0.16.0] - 2026-10-22 (Chuẩn Hóa Khổ In Nhiệt A7 76×130mm & Phân Hệ Quản Lý Khách Hàng CRM)

### Enhanced
- **Chuẩn Hóa Khổ In Tem Nhiệt A7 (76 × 130 mm)**:
  - Điều chỉnh toàn diện kích thước in khổ A7 sang **76 × 130 mm** cho cả trang In phiếu đơn lẻ ([`/admin/orders/[id]/in-phieu`](file:///d:/website_chocomino/src/app/admin/orders/[id]/in-phieu/page.tsx)) và In phiếu hàng loạt ([`/admin/orders/in-hang-loat`](file:///d:/website_chocomino/src/app/admin/orders/in-hang-loat/page.tsx)).
  - Đồng bộ cấu hình in ấn `@page { size: 76mm 130mm; margin: 0; }` và khung bố cục tương thích tỷ lệ tem cuộn bưu phẩm TMĐT SPX.

### Added
- **Phân Hệ Quản Lý Khách Hàng Chuyên Sâu (`/admin/customers` - FR-A-30..34)**:
  - Bổ sung menu **Khách hàng** trên thanh điều hướng Admin.
  - Tự động đồng bộ và tổng hợp hồ sơ CRM theo Số điện thoại: tên, SĐT, email, số lượng đơn đã đặt, tổng chi tiêu tích lũy và nguồn tiếp thị đầu tiên (`FR-A-30, FR-A-31`).
  - Hộp thoại xem chi tiết lịch sử tất cả các đơn hàng khách từng đặt và trạng thái từng đơn (`FR-A-32`).
  - Cho phép chủ shop ghi chú nội bộ về khách hàng (lưu vào database) (`FR-A-32`).
  - Cảnh báo khách có lịch sử hủy/hoàn cao và tích hợp nút Chặn khách bom hàng (`is_blocked` - `FR-A-33`).
  - Tự động chặn tạo đơn tại `/api/checkout` nếu số điện thoại nằm trong danh sách bị khóa.

## [0.15.0] - 2026-10-22 (In Phiếu Giao Hàng Hàng Loạt, Nhập Mã Vận Đơn SPX, Miễn Phí Ship Theo Ngưỡng & Báo Khi Có Hàng)

### Added
- **In Phiếu Giao Hàng Hàng Loạt (`/admin/orders/in-hang-loat` - FR-A-42)**:
  - Tích hợp tính năng chọn nhiều đơn hàng qua checkbox trong danh sách đơn.
  - Thanh công cụ nổi (floating action bar) cho phép bấm **In X phiếu giao hàng** liên tục trên cùng một lệnh in, tự động phân trang theo chuẩn máy in nhãn với `@media print { page-break-after: always; }`. Hỗ trợ đầy đủ 3 khổ in: **Khổ A7 (74×105mm)**, **Tem nhiệt 100×150mm** và **Khổ A5 (148×210mm)**.
- **Nhập Mã Vận Đơn SPX Hàng Loạt (`ImportSpxTrackingModal.tsx` - FR-A-45)**:
  - Bổ sung nút **Nhập mã SPX** trong Quản lý đơn hàng.
  - Hỗ trợ dán danh sách hoặc tải file `.txt`/`.csv` trả về từ SPX (ghép nối giữa Mã đơn website và Mã vận đơn SPX), tự động khớp đơn, cập nhật mã bưu gửi và chuyển trạng thái đồng loạt sang "Đang giao hàng" (`shipping`).
- **Chính Sách Miễn Phí Vận Chuyển Theo Ngưỡng (`FR-C-33`)**:
  - Cho phép chủ shop cấu hình *Ngưỡng miễn phí vận chuyển* trong Cài đặt shop (`/admin/settings`).
  - Thanh tiến trình thông minh tại Giỏ hàng (`/gio-hang`) hiển thị số tiền cần mua thêm để được Freeship.
  - Tự động miễn phí vận chuyển ($0đ$) tại màn hình Thanh toán (`/thanh-toan`) khi tổng giá trị giỏ hàng đạt ngưỡng quy định.
- **Đăng Ký "Báo Tôi Khi Có Hàng Lại" & Cảnh Báo Tồn Kho Ít (`FR-C-10`, `FR-C-08`)**:
  - Tại trang chi tiết sản phẩm, khi phân loại tạm hết hàng (`out_of_stock`), hệ thống hiển thị form nhập Số điện thoại/Zalo để khách hàng đăng ký nhận thông báo đợt hàng mới.
  - Tự động hiển thị huy hiệu gây chú ý *"🔥 Nhanh tay! Chỉ còn N cái trên kệ"* khi tồn kho biến thể còn từ 5 sản phẩm trở xuống (`FR-C-08`).

## [0.14.0] - 2026-10-22 (Báo Cáo Doanh Thu & Nguồn Tiếp Thị, Nhập Sản Phẩm CSV, Xử Lý Pre-Order Hàng Loạt, Chuông Báo Đơn Mới)

### Added
- **Trang Báo Cáo Doanh Thu & Tiếp Thị Mạng Xã Hội (`/admin/analytics` - FR-A-50..55)**:
  - Bổ sung trang Báo cáo chuyên sâu dành riêng cho chủ shop với các thẻ KPI cốt lõi: Doanh thu thực nhận (đã trừ hủy/hoàn), Số đơn thành công, Giá trị đơn trung bình (AOV), Tỷ lệ hoàn/hủy.
  - Bộ lọc thời gian linh hoạt: Hôm nay, 7 ngày qua, Tháng này, Toàn thời gian.
  - Phân bổ doanh thu chi tiết giữa hai phương thức thanh toán: Tiền mặt COD vs Chuyển khoản VietQR.
  - Thống kê tỷ lệ đóng góp đơn và doanh thu theo nguồn traffic (TikTok, Facebook, Threads, Instagram, Zalo, Google/Trực tiếp).
  - Bảng cảnh báo hàng tồn kho thấp (`stock_qty <= 5`) kèm nút điều hướng nhập thêm tồn kho nhanh chóng.
- **Nhập Sản Phẩm Hàng Loạt Từ File CSV (`CsvProductImportModal.tsx` - FR-A-08)**:
  - Bổ sung nút **Nhập từ CSV** và modal nhập hàng loạt trong trang Quản lý sản phẩm (`/admin/products`).
  - Hỗ trợ nút tải file mẫu CSV tiếng Việt chuẩn UTF-8 BOM (`Mau_Nhap_SanPham_Chocomino.csv`) có sẵn ví dụ cho sản phẩm đơn và sản phẩm nhiều biến thể.
  - Tự động phân tích cú pháp (CSV parser), nhóm các dòng cùng tên sản phẩm thành các biến thể của cùng một món, xem trước bảng dữ liệu và thanh tiến trình (progress bar) khi tạo sản phẩm vào Supabase.
- **Quản Lý Pre-Order Chuyên Sâu & Nút "Hàng Đã Về" Hàng Loạt (`/admin/orders` - FR-A-18)**:
  - Bổ sung tab bộ lọc riêng **⏳ Chờ hàng về** trong màn hình Quản lý đơn hàng.
  - Tích hợp banner thông báo số đơn Pre-order đang chờ và nút hành động hàng loạt: *"Hàng đã về: Xác nhận hàng loạt"* có hộp thoại xác nhận an toàn trước khi chuyển đồng loạt sang trạng thái `confirmed`.
- **Chuông Báo Đơn Mới & Huy Hiệu Đếm Đơn Chờ Xử Lý (`AdminNav.tsx` - FR-A-73)**:
  - Header Admin tự động polling kiểm tra số đơn mới (`new`) và đơn yêu cầu đổi trả (`return_requested`).
  - Hiển thị huy hiệu số lượng đơn chờ xử lý nổi bật trên tab "Đơn hàng & SPX".
  - Tự động phát âm báo chuông nhẹ nhàng (sử dụng Web Audio API tổng hợp, không cần tải file mp3 ngoài) khi phát sinh đơn hàng mới trong lúc chủ shop đang mở trang.

## [0.13.0] - 2026-10-22 (Tích Hợp Telegram Bot Thông Báo Đơn & Đổi Trả, Khảo Sát Nguồn Khách, Xuất Đơn CSV)

### Added
- **Thông Báo Tự Động Qua Telegram Bot (`src/lib/telegram.ts` - FR-A-71, FR-A-74)**:
  - Tích hợp dispatcher gửi thông báo thời gian thực về nhóm chat Telegram của shop khi có:
    1. **Đơn hàng mới tạo**: Gồm mã đơn, tên khách, số điện thoại, địa chỉ nhận hàng, phương thức thanh toán (COD / VietQR), tổng tiền, nguồn traffic và link 1-click mở trang quản lý.
    2. **Yêu cầu đổi trả mới**: Gồm mã đơn, số điện thoại, lý do hoàn trả và đường dẫn xem video khui hàng của khách.
  - Thiết kế an toàn 100% theo tiêu chuẩn `FR-A-74`: Chạy nền không đồng bộ (asynchronous non-blocking), nếu chưa cài đặt Bot hoặc Telegram gặp sự cố mạng thì luồng đặt hàng và tạo yêu cầu của khách vẫn hoàn tất trơn tru.
  - Bổ sung bảng hướng dẫn 4 bước kích hoạt Telegram Bot trực tiếp trong trang Cấu hình Admin (`/admin/settings`).
- **Khảo Sát Nguồn Khách & Lưu Giữ UTM Toàn Site (`FR-C-27`, `FR-A-80`)**:
  - Tự động bắt và lưu tham số `utm_source` vào `sessionStorage` ngay khi khách hàng bấm vào web từ bất kỳ bài đăng mạng xã hội nào (TikTok, Facebook, Instagram, Threads, Zalo).
  - Bổ sung trường chọn *"Bạn biết Chocomino từ đâu?"* tại bước Thanh toán (`/thanh-toan`). Tự động phát hiện và điền sẵn kênh mạng xã hội kèm huy hiệu `✓ Đã nhận diện từ link`.
- **Xuất Toàn Bộ Danh Sách Đơn Hàng Ra File CSV (`/admin/orders` - FR-A-19)**:
  - Bổ sung nút **Xuất CSV** bên cạnh nút Xuất Excel SPX trong trang Quản lý đơn hàng.
  - File CSV được nhúng mã định danh UTF-8 BOM (`\uFEFF`), giúp mở trực tiếp trên Microsoft Excel tiếng Việt không bị lỗi font hoặc mất dấu.

## [0.12.0] - 2026-10-22 (Bổ Sung Floating Multi-Channel Contact, Nhân Bản Sản Phẩm & Marketing UTM Links)

### Added
- **Nút Liên Hệ Đa Kênh Nổi Trên Toàn Hệ Thống (`FloatingContact.tsx` - FR-A-83)**:
  - Tích hợp widget bong bóng nổi cố định góc phải màn hình cho khách hàng (`Zalo`, `Facebook Messenger`, `Hotline`).
  - Hỗ trợ hiệu ứng ping animation gây chú ý, tối ưu tương thích di động (tự động dịch chuyển lên cao tránh che thanh Mua ngay ở trang chi tiết sản phẩm).
  - Tự động ẩn trên màn hình Admin để không che các nút thao tác quản lý.
- **Tính Năng Nhân Bản Sản Phẩm (`/admin/products` - FR-A-09)**:
  - Bổ sung nút "Nhân bản" trực tiếp tại từng thẻ sản phẩm trong trang Quản lý sản phẩm.
  - Tự động sao chép toàn bộ tên, mô tả, danh mục, hình ảnh đại diện, trạng thái nổi bật và toàn bộ danh sách biến thể (tự động gán mã SKU hậu tố `-COPY`) vào modal tạo mới.
  - Giúp chủ shop tạo nhanh các mẫu squishy cùng bộ sưu tập hoặc tương tự mà không cần nhập lại từng biến thể thủ công.
- **Bộ Công Cụ Tạo Link Tiếp Thị Mạng Xã Hội (`/admin/settings` - FR-A-81)**:
  - Bổ sung bảng công cụ tạo và sao chép 1-click link chiến dịch UTM cho từng nền tảng: `TikTok Bio`, `Facebook/Messenger`, `Threads Bio`, `Instagram Bio`, `Zalo Chat`.
  - Hỗ trợ lưu nguồn truy cập `utm_source` khi khách hàng đặt hàng để chủ shop đo lường hiệu quả quảng cáo.

## [0.11.0] - 2026-10-22 (Tối Giản Hóa File Xuất Excel SPX — Duy Nhất 1 Sheet Đơn Hàng)

### Enhanced
- **Tối ưu hóa chức năng Xuất Excel SPX (`/api/admin/spx-export`)**:
  - Tự động loại bỏ hoàn toàn tất cả các sheet hướng dẫn thừa của phôi SPX (`Hướng dẫn tạo đơn`, `Ví dụ đơn mẫu`, `Tạo đơn (địa chỉ cũ)`, danh sách tỉnh/huyện cũ...).
  - File Excel xuất ra chỉ chứa **duy nhất 1 sheet** chứa toàn bộ các đơn hàng cần giao (`Tạo đơn (địa chỉ mới)`).
  - Tự động kích hoạt view mặc định tại ô A1, giảm dung lượng file xuống gần 50%, giúp chủ shop mở file lên là thấy ngay danh sách đơn hàng mà không cần chuyển đổi qua lại giữa các sheet hướng dẫn.

## [0.10.0] - 2026-10-22 (Bổ Sung In Phiếu Khổ A7 & Xuất File Excel SPX Động)

### Added & Enhanced
- **Hỗ trợ Khổ In Phiếu Giao Hàng A7 (74×105mm) (`/admin/orders/[id]/in-phieu`)**:
  - Bổ sung tùy chọn khổ giấy **A7 (74×105mm)** chuyên dụng cho các dòng máy in tem bưu phẩm mini hoặc giấy dán kiện nhỏ.
  - Tự động co giãn bố cục, phông chữ và căn lề siêu gọn gàng, tiền thu COD hiển thị nổi bật, hỗ trợ CSS in ấn `@page { size: 74mm 105mm; margin: 0; }`.
  - Cung cấp đầy đủ 3 tùy chọn khổ in: **Khổ A7 (74×105mm)**, **Tem nhiệt 100×150mm** (chuẩn máy in nhiệt SPX) và **Khổ A5 (148×210mm)**.
- **Xuất File Excel SPX Hàng Loạt Động (`/api/admin/spx-export`)**:
  - Kết nối trực tiếp cơ sở dữ liệu Supabase, tự động gom tất cả các đơn hàng đang ở trạng thái `confirmed` (Đã xác nhận) và `packing` (Đang đóng gói) để xuất file Excel.
  - Tự động fallback nạp dữ liệu mẫu hợp lệ nếu kho chưa có đơn chờ đóng gói để chủ shop luôn kiểm tra được định dạng file mẫu.
  - Xuất trực tiếp vào sheet `Tạo đơn (địa chỉ mới)` của `assets/spx_template.xlsx` chuẩn xác 100% các cột thông tin người nhận, tiền COD, khối lượng kg, mã đơn và ghi chú bưu gửi.

## [0.9.0] - 2026-10-22 (Tối Ưu Mobile PWA, Web App Icon & OpenGraph Social Sharing)

### Added
- **Chuẩn hóa Ứng dụng Di động PWA (Web App)**:
  - Khởi tạo file biểu tượng thương hiệu Chocomino vector chuẩn SVG [`public/icon.svg`](file:///d:/website_chocomino/public/icon.svg) phong cách bánh squishy cute màu hồng & chocolate.
  - Cấu hình file [`public/manifest.json`](file:///d:/website_chocomino/public/manifest.json) hỗ trợ người dùng có thể "Thêm vào Màn hình chính" (Add to Home Screen) trên iPhone và Android như một App di động thực thụ (theo đúng mục tiêu Mobile-First SRS 1.3).
  - Tích hợp siêu dữ liệu OpenGraph (OG Meta tags) trong `src/app/layout.tsx` hiển thị thẻ xem trước đẹp mắt khi gửi link web qua Zalo, Messenger, TikTok và Facebook.

## [0.8.0] - 2026-10-22 (Tách Biệt Màn Hình Đặt Hàng Thành Công COD & VietQR)

### Fixed & Enhanced
- **Tách biệt rõ ràng phương thức thanh toán COD vs VietQR (`/dat-hang-thanh-cong`)**:
  - Khắc phục triệt để lỗi logic `order?.paymentMethod === 'bank_qr' || true` khiến mọi đơn hàng (kể cả COD) đều hiển thị khung quét mã VietQR và đồng hồ đếm ngược 15 phút.
  - **Màn hình Đặt hàng Thành công dành riêng cho COD**:
    - Hiển thị icon xe giao hàng SPX và thông báo: *"Thanh toán khi nhận hàng (COD) - Bạn chỉ cần thanh toán tiền mặt cho nhân viên giao hàng SPX khi nhận gói hàng"*.
    - Hiển thị to rõ số tiền thực tế shipper cần thu, thông tin người nhận, số điện thoại, địa chỉ giao hàng và các lưu ý nhận bưu phẩm chuẩn TMĐT.
  - **Màn hình VietQR**: Chỉ kích hoạt khi khách hàng chọn thanh toán chuyển khoản hoặc giỏ hàng có sản phẩm Pre-order (bắt buộc trả trước).
  - Tự động fallback truy vấn dữ liệu từ Supabase nếu người dùng tải lại trang hoặc mở trực tiếp trên thiết bị khác.

## [0.7.0] - 2026-10-22 (Tự Động Hủy Đơn QR 15 Phút, Ẩn Danh PII 90 Ngày & Vercel Cron)

### Added
- **API Xử Lý Tác Vụ Định Kỳ (`/api/cron/cleanup`)**:
  - Tự động gọi hàm Stored Procedure `cancel_expired_qr_orders()` giải phóng tồn kho về lại biến thể và chuyển trạng thái đơn `cancelled` đối với các đơn hàng VietQR chưa thanh toán quá 15 phút (Q-14 / Quyết định D1).
  - Tự động gọi hàm Stored Procedure `anonymize_expired_customer_data()` mã hóa/ẩn danh thông tin cá nhân khách hàng (PII) đối với các đơn hàng đã kết thúc quá 3 tháng (90 ngày) theo đúng cam kết bảo mật (Q-19 / Quyết định D2).
  - Hỗ trợ cơ chế bảo vệ an toàn với khóa `CRON_SECRET` trong Header hoặc query param.
- **Cấu hình Vercel Free Cron Job (`vercel.json`)**:
  - Thiết lập lịch chạy tự động hàng ngày lúc 01:00 UTC (08:00 sáng giờ VN) hoàn toàn miễn phí trên gói Vercel Hobby.

## [0.6.0] - 2026-10-21 (Thêm Sản Phẩm Mới & Cấu Hình Biến Thể Đa Năng)

### Added
- **Giao diện Thêm Sản Phẩm Mới (`/admin/products`)**:
  - Modal tạo sản phẩm trực quan: Tên sản phẩm, danh mục, mô tả cảm giác mềm mịn, đường dẫn ảnh (URL online), đánh dấu sản phẩm nổi bật ⭐.
  - **Quản lý đa biến thể linh hoạt**: Cho phép thêm/xóa không giới hạn các phân loại (màu sắc, kích thước, combo), tự sinh mã SKU, định giá bán, giá so sánh gạch ngang, tồn kho ban đầu và cân nặng chuẩn SPX (kg).
  - **Cấu hình Pre-order thông minh**: Lựa chọn trạng thái hàng có sẵn hoặc Đặt trước kèm ngày dự kiến về hàng (ETA).
- **Backend & Database Atomic RPC**:
  - API `/api/admin/products/create` kiểm tra và chuẩn hóa dữ liệu đầu vào bằng Zod schema, tự động tạo slug chuẩn SEO không dấu.
  - Viết file migration SQL [`supabase/migrations/20261021_product_management.sql`](file:///d:/website_chocomino/supabase/migrations/20261021_product_management.sql) chứa hàm Stored Procedure `create_product_atomic` thực thi thêm sản phẩm, biến thể và hình ảnh trong một transaction an toàn, kèm chính sách RLS cho phép ghi dữ liệu.

## [0.5.0] - 2026-10-21 (Chính sách Đổi Trả 3 Ngày & Admin Xử Lý Hoàn Tiền)

### Added
- **Quy trình Yêu Cầu Đổi Trả Cho Khách Hàng (`/tra-cuu`)**:
  - Tích hợp form yêu cầu đổi trả ngay trên trang tra cứu đơn hàng theo quyết định D2/SRS.
  - Tự động kiểm tra thời hạn: Chỉ cho phép gửi yêu cầu trong vòng 3 ngày kể từ khi đơn hàng đạt trạng thái `completed`. Quá thời hạn sẽ hiển thị thông báo chính sách đổi trả đã hết hiệu lực.
  - **Bắt buộc link video unboxing mở hộp**: Khách hàng phải cung cấp liên kết video unboxing rõ nét (Google Drive, YouTube, TikTok, v.v.) để chống gian lận.
  - API `/api/orders/return-request` kiểm tra tính hợp lệ của đơn hàng, chuyển trạng thái đơn sang `return_requested` và lưu bản ghi vào bảng `return_requests`.
- **Giao diện Quản Lý Đổi Trả Admin (`/admin/orders`)**:
  - Thêm bộ lọc tab chuyên dụng **"Đổi trả"** trong danh sách đơn hàng.
  - Hiển thị badge trạng thái đặc biệt: `⚠️ Yêu cầu đổi trả` (nhấp nháy), `✓ Đã duyệt trả hàng`, `✕ Từ chối đổi trả`, `📦 Đã nhận hàng trả`, `💰 Đã hoàn tiền`.
  - Trong Modal chi tiết đơn hàng:
    - Hiển thị đầy đủ thông tin: Lý do khách chọn, mô tả chi tiết, liên kết video mở hộp mở tab mới.
    - Cụm nút xử lý nhanh 1 chạm: **Duyệt cho phép trả hàng** hoặc **Từ chối yêu cầu** kèm ô nhập ghi chú bắt buộc của shop (`shop_note`).
    - Nút **Xác nhận đã nhận hàng hoàn trả & Hoàn tất hoàn tiền** (`refunded`).
  - API `/api/admin/returns/[id]/resolve` xác thực quyền admin, cập nhật trạng thái `return_requests`, trạng thái đơn hàng `orders` và ghi nhận nhật ký `order_status_history`.

## [0.4.0] - 2026-10-21 (Bảo mật & Xác thực Phân quyền Admin)

### Added
- **Đăng nhập Quản trị viên (`/admin/login`)**:
  - Giao diện đăng nhập chuẩn thương hiệu Chocomino với tông hồng & nâu chocolate.
  - Kiểm tra điều kiện mật khẩu tối thiểu 10 ký tự (theo đặc tả SRS 3.8).
  - Tích hợp tài khoản Chủ shop mặc định (`admin@chocomino.local` / `Chocomino2026!`) và hỗ trợ xác thực danh sách nhân viên qua bảng `admin_users`.
- **Bảo mật Phiên & Token**:
  - Ký và xác thực token session an toàn bằng thuật toán HMAC-SHA256 lưu trong HTTP-only Cookie (`chocomino_admin_session`) với thời hạn 7 ngày.
  - API đăng xuất `/api/admin/auth/logout` xóa cookie an toàn.
- **Middleware Bảo vệ Tuyến đường (`middleware.ts`)**:
  - Tự động chặn truy cập trái phép vào toàn bộ phân hệ `/admin/*` và chuyển hướng về `/admin/login`.
  - Tự động chèn header `X-Robots-Tag: noindex, nofollow` để ngăn chặn hoàn toàn việc Google và các công cụ tìm kiếm index dữ liệu admin nội bộ.

## [0.3.0] - 2026-10-21 (Quản lý Đơn hàng Live & In Phiếu Giao Hàng Chuẩn SPX)

### Added
- **Quản lý Đơn hàng Sống (`/admin/orders`)**:
  - Truy vấn trực tiếp bảng `orders` và `order_items` từ Supabase.
  - Modal xem chi tiết đơn: Thông tin khách, số điện thoại, địa chỉ 2 cấp, sản phẩm, ghi chú và tóm tắt thanh toán.
  - **Chuyển trạng thái 1 chạm**: `new` -> `confirmed` (Xác nhận) -> `packing` (Đóng gói) -> `shipping` (Giao hàng) -> `completed` (Hoàn thành) hoặc Hủy đơn kèm lý do.
  - Modal nhập mã vận đơn SPX khi chuyển sang trạng thái "Đang giao".
  - API `/api/admin/orders/[id]/status` tự động cập nhật bảng `orders`, `order_status_history` và `shipments`.
- **In Phiếu Giao Hàng TMĐT (`/admin/orders/[id]/in-phieu`)**:
  - Hỗ trợ 2 khổ in: **Tem nhiệt 100×150mm** (chuẩn máy in nhiệt SPX) và **Khổ A5**.
  - CSS in ấn chuẩn `@media print` tự động ẩn toàn bộ header, công cụ điều khiển, chỉ in đúng tem giao hàng.
  - Hiển thị nổi bật **Tiền thu người nhận (COD)**: Số tiền COD thực tế cần thu hoặc hiển thị `0 VNĐ (ĐÃ THANH TOÁN)` nếu khách trả QR trước.
  - Mã đơn dạng text to rõ, thông tin người gửi, người nhận, danh sách hàng, ghi chú và chữ ký xác nhận.

## [0.2.0] - 2026-10-21 (Kết nối Supabase Live Data & Admin Suite)

### Added
- **Live Supabase Data Connection**:
  - Tích hợp hàm `getProducts()` và `getCategories()` nạp dữ liệu sống từ Supabase PostgreSQL.
  - Tối ưu tĩnh SSG (`generateStaticParams`) tự động sinh 4 trang chi tiết sản phẩm chuẩn SEO từ database.
- **Admin Products & Inventory Management (`/admin/products`)**:
  - Giao diện quản lý danh mục và danh sách sản phẩm với các biến thể (tên, SKU, trọng lượng, giá bán).
  - Tính năng điều chỉnh tồn kho nhanh (+1, -1, +5, -5) qua API `/api/admin/inventory/adjust`.
  - Tự động chuyển trạng thái `out_of_stock` khi tồn kho về 0 (trừ trường hợp pre-order) và ghi nhận lịch sử vào bảng `stock_movements`.
- **Admin Settings Page (`/admin/settings`)**:
  - Màn hình cấu hình thông tin cửa hàng, số điện thoại, địa chỉ kho lấy hàng SPX.
  - Biểu phí vận chuyển động: 18.000đ (TP.HCM mới) và 22.000đ (ngoại tỉnh).
  - Cấu hình thông số mặc định xuất file SPX.
- **Admin Navigation (`AdminNav`)**:
  - Thanh điều hướng admin chuyên dụng kết nối nhanh giữa Đơn hàng, Sản phẩm & Kho, Cài đặt và Web khách.

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
