# SRS — Website bán hàng "chocomino" (squishy shop)

| Mục | Nội dung |
|---|---|
| Phiên bản | 0.3 — đã cập nhật theo trả lời Q-01…Q-24 và file Excel mẫu SPX của Trung |
| Ngày soạn | 21/10/2026 |
| Chủ shop / người duyệt | Trung |
| Người đọc chính | Google Antigravity (AI coding agent: code, deploy, bảo trì) |
| Mục tiêu ra mắt | Tháng 11/2026 |

## 0. Quy ước đọc tài liệu (dành cho Antigravity)

1. Mỗi yêu cầu có mã: `FR-C-xx` (khách), `FR-A-xx` (admin), `NFR-xx` (phi chức năng), `INT-xx` (tích hợp). Ưu tiên: **Bắt buộc** / **Nên có** / **Tùy chọn**.
2. `[Đề xuất thêm]` = ngoài danh sách yêu cầu gốc của Trung, **chưa được duyệt, không được code** cho đến khi Trung đồng ý.
3. `[Cần xác minh]` = thông tin (phí, giới hạn, API, chính sách) chưa chắc chắn. Antigravity **không tự suy diễn**: phải kiểm tra tài liệu chính thức của dịch vụ và báo lại Trung trước khi dựa vào.
4. `[Chờ Trung chọn]` = có nhiều phương án, chưa chốt. Không code phần phụ thuộc cho đến khi có quyết định (mục 13.1b liệt kê).
5. Nếu gặp điểm mơ hồ: ghi vào danh sách câu hỏi mở và hỏi Trung, không tự giả định.
6. Ngôn ngữ giao diện: tiếng Việt. Tiền tệ: VNĐ, định dạng `18.000đ`. Múi giờ: Asia/Ho_Chi_Minh (UTC+7).

### Các quyết định Trung đã chốt khi soạn SRS

| # | Câu hỏi | Quyết định |
|---|---|---|
| D1 | Zalo / Threads / TikTok là gì? | **Cả hai vai trò**: (1) kênh để khách đi vào web (nguồn traffic), (2) kênh để shop nhận thông báo đơn. Xem mục 3.9 và 7.5 để biết kênh nào khả thi. |
| D2 | Ghi chú lý do hoàn trả do ai nhập? | **Cả hai**: khách nêu lý do khi gửi yêu cầu hoàn; shop ghi chú xử lý khi duyệt/từ chối/hoàn tất. |
| D3 (Q-01) | "Trong TP.HCM" tính theo? | **Phạm vi TP.HCM cũ** (không gồm khu vực Bình Dương, Bà Rịa – Vũng Tàu cũ). |
| D4 (Q-02) | Ngân sách 500.000đ | **500.000đ / tháng** (chi phí chạy hằng tháng, gồm cả phần quy đổi tên miền theo tháng). |
| D5 (Q-03) | Hosting | **Vercel**. Xem mục 6.1b. |
| D6 (Q-04) | Dịch vụ xác nhận chuyển khoản | **Trung giao AI đề xuất** → xem đề xuất ở mục 7.1 (Trung duyệt). |
| D7 (Q-05) | API SPX | **Không dùng được API SPX**. Vận chuyển theo quy trình **file Excel mẫu của SPX** (xem 3.5, INT-02). |
| D8 (Q-04b) | Ngân hàng nhận tiền | **Techcombank, tài khoản cá nhân** → xem 7.1 |
| D9 (Q-22) | Kiểu địa chỉ | **2 cấp (tỉnh/thành → phường/xã)**, khớp sheet "Tạo đơn (địa chỉ mới)" của mẫu SPX |
| D10 (Q-24) | Database | **Supabase** (Postgres + Storage + Auth) |
| D11 (Q-06) | Đăng nhập admin | **Tên đăng nhập/email + mật khẩu** (xem 3.8) |
| D12 (Q-07) | Kênh thông báo cho shop | **Telegram** (kèm Email) |
| D13 (Q-08) | Pre-order | **Cho trộn giỏ hàng sẵn + pre-order**; **pre-order thanh toán QR (trả đủ trước)**. Còn mở: giao 1 lần hay tách giao (Q-08b) |
| D14 (Q-09) | Đổi trả | **3 ngày**; **bắt buộc video khui hàng**; **shop chịu phí vận chuyển** hoàn/đổi |
| D15 (Q-10) | Hết hạn đơn QR chưa thanh toán | **5 phút** (xem R-16, Q-10b) |
| D16 (Q-11) | Khách tự hủy đơn | **Có** |
| D17 (Q-12) | Các mục `[Đề xuất thêm]` | **Duyệt tất cả** (xếp lịch ở bảng dưới) |
| D18 (Q-13) | Nhân viên | **~5 người, được xem đầy đủ** thông tin khách |
| D19 (Q-14) | Font / Logo | **Font A (Baloo 2 + Nunito); Logo A (logo chữ)** |
| D20 (Q-15) | Tên miền | **Không mua tên miền riêng** (dùng địa chỉ miễn phí của Vercel) → xem 9.1, 7.3 |
| D21 (Q-16) | Video sản phẩm | **Tối đa 5MB, tự lưu** |
| D22 (Q-17) | Tên shop / địa chỉ lấy hàng | **chocomino — Đ. Số 2/38/32 Bình Đường 1, Khu Phố, Dĩ An, Hồ Chí Minh, Việt Nam**; số điện thoại cập nhật sau |
| D23 (Q-18) | Hình thức hoạt động | **Cá nhân** (xem 8.3) |
| D24 (Q-19) | Lưu dữ liệu khách | **1 tháng** (xem 8.2, Q-19b) |
| D25 (Q-20) | Quảng cáo / pixel | **Không chạy** → bỏ pixel |
| D26 (Q-21) | Nhập sản phẩm | **Chủ shop tự nhập** |

### Các mục `[Đề xuất thêm]` đã được duyệt (D17) và lịch làm

Duyệt = được đưa vào phạm vi; để không đe dọa ngày ra mắt, mục nào ở G3 trở đi sẽ bị cắt trước nếu trễ.

| Mã | Hạng mục | Giai đoạn |
|---|---|---|
| FR-A-71 | Thông báo qua Telegram | G2 (Bắt buộc) |
| FR-C-27 | Hỏi "Bạn biết shop từ đâu?" + utm | G2 |
| FR-A-08 | Nhập sản phẩm hàng loạt từ CSV | G3 (giúp nhập 50–100 sản phẩm) |
| FR-A-19 | Xuất danh sách đơn ra CSV | G3 |
| FR-A-83 | Nút chat Messenger/Zalo | G3 |
| FR-A-09 | Nhân bản sản phẩm | G3/G5 |
| FR-C-10 | "Báo tôi khi có hàng" | G5 |
| FR-C-33 | Miễn phí ship theo ngưỡng (mặc định tắt cho đến khi Trung đặt ngưỡng) | G5 |
| Web Push (PWA) | Thông báo đẩy cho chủ shop | G5 `[Cần xác minh]` |

---

## 1. Tổng quan dự án

### 1.1 Mục tiêu
Xây website bán hàng mới hoàn toàn cho shop squishy **chocomino** để khách tự chọn hàng, đặt đơn (không cần tài khoản), thanh toán COD hoặc chuyển khoản QR, và đơn được chuyển về cho shop xử lý. Giảm việc chốt đơn thủ công qua inbox Facebook/Instagram/Threads/TikTok.

### 1.2 Phạm vi
- Website khách (mobile-first) + trang admin cho shop.
- Database, hệ thống admin và quy trình đơn hàng riêng, thiết kế từ đầu.
- **Không** kế thừa, tích hợp hay đồng bộ với hệ thống/database nào có sẵn.

### 1.3 Đối tượng người dùng

| Vai trò | Mô tả | Thiết bị chính |
|---|---|---|
| Khách | Người mua squishy, chủ yếu đi vào từ mạng xã hội, không đăng nhập | Điện thoại (trình duyệt trong app Facebook/Instagram/TikTok/Threads/Zalo) |
| Chủ shop (Owner) | Trung — toàn quyền | Điện thoại + máy tính |
| Nhân viên (Staff) | Xử lý đơn, đóng gói (~5 người — D18) | Điện thoại + máy tính |
| Antigravity | Bảo trì kỹ thuật | — |

### 1.4 Quy mô thiết kế
50–100 sản phẩm (có biến thể), ~20 đơn/ngày, ~50 lượt khách/ngày.

### 1.5 Giả định
- Shop có tài khoản ngân hàng nhận tiền (loại tài khoản: cá nhân hay doanh nghiệp — **[Cần xác nhận]**, ảnh hưởng khả năng dùng dịch vụ xác nhận chuyển khoản).
- Trung tự chụp ảnh/quay video sản phẩm và nhập nội dung ban đầu.
- Ngân sách: ưu tiên miễn phí, tối đa **500.000 VNĐ/tháng** tổng chi phí chạy hệ thống (D4).
- Một ngôn ngữ (tiếng Việt), chỉ giao hàng trong Việt Nam.

### 1.6 Thuật ngữ

| Thuật ngữ | Giải thích đơn giản |
|---|---|
| Biến thể (variant) | Phiên bản khác nhau của 1 sản phẩm (màu, kích thước, mẫu). Mỗi biến thể có giá/tồn kho riêng |
| Pre-order | Đặt trước: hàng chưa có sẵn, khách đặt rồi shop nhập về |
| COD | Thanh toán khi nhận hàng |
| Webhook | Dịch vụ bên ngoài "gọi" vào website để báo có sự kiện (vd: tiền đã vào tài khoản) |
| API | Cách để 2 hệ thống nói chuyện với nhau |
| Deploy | Đưa bản code mới lên mạng cho khách dùng |
| MVP | Bản đầu tiên đủ dùng, ra mắt sớm |
| SPX | SPX Express (đơn vị vận chuyển của Shopee) |

---

## 2. Yêu cầu chức năng phía khách (không đăng ký / đăng nhập)

### 2.1 Danh mục và trang sản phẩm

| Mã | Yêu cầu | Ưu tiên |
|---|---|---|
| FR-C-01 | Trang chủ: banner, danh mục, sản phẩm mới, sản phẩm bán chạy, sản phẩm pre-order | Bắt buộc |
| FR-C-02 | Trang danh mục: lưới sản phẩm (2 cột trên điện thoại), lọc theo trạng thái (còn hàng / pre-order), sắp xếp (mới nhất, giá tăng/giảm) | Bắt buộc |
| FR-C-03 | Tìm kiếm theo tên sản phẩm (không phân biệt hoa thường, không phân biệt dấu tiếng Việt) | Nên có |
| FR-C-04 | Trang chi tiết: nhiều ảnh (vuốt/zoom), video, mô tả, giá, chọn biến thể, chọn số lượng, nút "Thêm vào giỏ" | Bắt buộc |
| FR-C-05 | Giá hiển thị theo biến thể đang chọn; nếu các biến thể giá khác nhau hiển thị "từ X đ" ở danh sách | Bắt buộc |
| FR-C-06 | Trạng thái theo từng biến thể: **Còn hàng**, **Hết hàng**, **Pre-order** (hiện ngày dự kiến có hàng nếu admin nhập) | Bắt buộc |
| FR-C-07 | Hết hàng: nút mua bị vô hiệu, hiển thị nhãn "Hết hàng" | Bắt buộc |
| FR-C-08 | Hiển thị cảnh báo "Chỉ còn N" khi tồn kho ≤ ngưỡng do admin cấu hình | Tùy chọn |
| FR-C-09 | Nút chia sẻ sản phẩm + thẻ xem trước (Open Graph) đẹp khi dán link vào Zalo/Messenger/Threads | Nên có |
| FR-C-10 | `[Đề xuất thêm]` "Báo tôi khi có hàng" (khách để SĐT/email, shop xem danh sách trong admin) | Tùy chọn |

### 2.2 Giỏ hàng

| Mã | Yêu cầu | Ưu tiên |
|---|---|---|
| FR-C-11 | Thêm nhiều sản phẩm/biến thể; đổi số lượng; xóa dòng; xem tạm tính | Bắt buộc |
| FR-C-12 | Giỏ lưu trên trình duyệt của khách (localStorage), còn giữ khi tải lại trang. Không cần tài khoản | Bắt buộc |
| FR-C-13 | Khi mở giỏ/thanh toán, kiểm tra lại giá và tồn kho với server; nếu đổi thì báo rõ cho khách | Bắt buộc |
| FR-C-14 | Giới hạn số lượng tối đa mỗi dòng = tồn kho hiện có (trừ pre-order: theo giới hạn admin đặt, nếu có) | Bắt buộc |
| FR-C-15 | Biểu tượng giỏ cố định ở thanh trên, có số lượng | Bắt buộc |

### 2.3 Thanh toán (checkout)

| Mã | Yêu cầu | Ưu tiên |
|---|---|---|
| FR-C-20 | Form: Họ tên*, SĐT*, Địa chỉ giao hàng*, Email*, Ghi chú (tùy chọn). (* = bắt buộc) | Bắt buộc |
| FR-C-21 | Validate SĐT Việt Nam (10 số, đầu 03/05/07/08/09, hoặc +84), email đúng định dạng, họ tên và địa chỉ không rỗng; thông báo lỗi tiếng Việt, hiển thị ngay tại ô lỗi | Bắt buộc |
| FR-C-22 | Địa chỉ **kiểu 2 cấp (D9)**: Tỉnh/Thành → Phường/Xã (dropdown phụ thuộc) → Số nhà, đường. Danh mục lấy từ sheet `State_list(2)` (34 tỉnh/thành) và `City_list(2)` (~3.321 xã/phường) trong **file mẫu SPX** để tên khớp 100% khi xuất Excel; có thể cập nhật khi SPX đổi mẫu | Bắt buộc |
| FR-C-23 | Tóm tắt đơn (sản phẩm, số lượng, tạm tính, phí ship, tổng) hiển thị trước khi xác nhận | Bắt buộc |
| FR-C-24 | Chọn phương thức: **COD** hoặc **Chuyển khoản QR**. Đơn có **sản phẩm pre-order chỉ được chọn QR** (D13) | Bắt buộc |
| FR-C-25 | Chống bấm đặt đơn nhiều lần (disable nút + idempotency key phía server) | Bắt buộc |
| FR-C-26 | Checkbox đồng ý Chính sách đổi trả + Chính sách bảo mật (link mở trang riêng) | Bắt buộc |
| FR-C-27 | `[Đề xuất thêm]` Hỏi "Bạn biết shop từ đâu?" (Facebook/Instagram/Threads/TikTok/Zalo/Khác); nếu link có tham số `utm_source` thì tự điền | Nên có |
| FR-C-28 | Trang "Đặt hàng thành công": mã đơn, tóm tắt, hướng dẫn bước tiếp theo, link tra cứu đơn | Bắt buộc |

### 2.4 Phí vận chuyển

| Mã | Yêu cầu | Ưu tiên |
|---|---|---|
| FR-C-30 | Phí ship tự tính theo Tỉnh/Thành đã chọn: **18.000đ** nếu thuộc TP.HCM, **22.000đ** nếu ngoài TP.HCM | Bắt buộc |
| FR-C-31 | Hai mức phí lưu trong bảng cấu hình (`settings`), admin đổi được, không hard-code | Bắt buộc |
| FR-C-32 | Phí ship tính **một lần cho mỗi đơn** (không cộng theo số sản phẩm). Nếu đơn có tách giao (xem 2.7) thì `[Chờ Trung chọn]` | Bắt buộc |
| FR-C-33 | `[Đề xuất thêm]` Miễn phí ship khi đơn đạt ngưỡng X đ (admin cấu hình, mặc định tắt) | Tùy chọn |

> **Đã chốt (D3):** "trong TP.HCM" = **phạm vi TP.HCM cũ**. File mẫu SPX cho thấy "Thành phố Hồ Chí Minh" (kiểu 2 cấp) hiện gồm **168 phường/xã**, trong đó có cả phường thuộc Bình Dương và Bà Rịa – Vũng Tàu cũ (vd "Phường Dĩ An", "Phường Thủ Dầu Một", "Phường Vũng Tàu"). Mẫu **không** ghi phường nào thuộc TP.HCM cũ. Cách làm: bảng `wards` có cờ `in_old_hcm` (true/false/chưa phân loại) → phí 18.000đ khi `true`, 22.000đ khi còn lại. Antigravity đề xuất phân loại ban đầu từ nguồn hành chính chính thống `[Cần xác minh]`, **Trung duyệt 1 lần** 168 dòng trong admin trước khi ra mắt (Q-22b). Phường chưa phân loại → tạm tính 22.000đ và báo admin. **Hệ quả cần Trung xác nhận:** khách ở khu Bình Dương cũ (kể cả Dĩ An, nơi đặt shop) trả 22.000đ.

### 2.5 Thanh toán: COD và chuyển khoản QR

| Mã | Yêu cầu | Ưu tiên |
|---|---|---|
| FR-C-40 | **COD**: đơn tạo xong vào trạng thái "Mới", thanh toán = "Chưa thanh toán (COD)" | Bắt buộc |
| FR-C-41 | **Chuyển khoản QR**: sau khi đặt, hiển thị mã QR có sẵn số tiền + nội dung chuyển khoản = mã đơn, kèm số tài khoản, tên chủ tài khoản, ngân hàng, nút sao chép | Bắt buộc |
| FR-C-42 | Xác nhận chuyển khoản **tự động** qua webhook (xem INT-01). Khi nhận đủ tiền: đơn đổi sang "Đã thanh toán", trang QR của khách tự chuyển sang "Thanh toán thành công" (polling nhẹ 5 giây/lần hoặc realtime), gửi email | Bắt buộc |
| FR-C-43 | Đơn chuyển khoản chưa thanh toán sau **5 phút** (D15; admin cấu hình được) → tự hủy, trả lại tồn kho, báo email. Hiển thị đồng hồ đếm ngược rõ ràng trên trang QR | Bắt buộc |
| FR-C-44 | Chuyển thiếu/thừa/sai nội dung: không tự xác nhận, đánh dấu "Cần xử lý tay" để admin xem | Bắt buộc |
| FR-C-45 | Khách có thể mở lại trang QR từ trang tra cứu đơn khi đơn còn chờ thanh toán | Nên có |
| FR-C-46 | Tiền về **sau khi đơn đã tự hủy do hết hạn**: không tự khôi phục; đánh dấu `needs_review`, báo shop (Telegram/email); shop chọn khôi phục đơn (nếu còn hàng) hoặc hoàn tiền | Bắt buộc |
| FR-C-47 | Nút "Thanh toán lại / gia hạn" khi hết 5 phút (1 lần, nếu hàng còn) để giảm đơn mất do khách chuyển sang app ngân hàng chậm — xem R-16, Q-10b | Nên có |

### 2.6 Tra cứu trạng thái đơn (không đăng nhập)

**Đề xuất xác thực (mã đơn + SĐT):**

| Phương án | Ưu | Nhược |
|---|---|---|
| A. Mã đơn + SĐT đầy đủ (đề xuất mặc định) | Đơn giản, khách dễ nhớ | Ai biết cả hai mới xem được (rủi ro thấp) |
| B. Mã đơn + 4 số cuối SĐT | Nhập nhanh hơn | Yếu hơn, dễ dò |
| C. Link "magic" gửi trong email, không cần nhập | Tiện nhất | Link bị chuyển tiếp thì lộ đơn |

| Mã | Yêu cầu | Ưu tiên |
|---|---|---|
| FR-C-50 | Trang `/tra-cuu`: nhập mã đơn + SĐT → xem trạng thái, lịch sử trạng thái (kèm giờ), sản phẩm, tổng tiền, mã vận đơn + link theo dõi SPX (nếu có) `[Cần xác minh định dạng link]` | Bắt buộc |
| FR-C-51 | Giới hạn thử sai (rate limit, vd 5 lần/10 phút/IP); thông báo chung "Không tìm thấy đơn" dù sai mã hay sai SĐT (không tiết lộ đơn có tồn tại) | Bắt buộc |
| FR-C-52 | Che bớt thông tin nhạy cảm (SĐT hiện 3 số cuối, địa chỉ chỉ hiện tỉnh/phường) | Bắt buộc |
| FR-C-53 | Trong trang tra cứu, khách có thể **gửi yêu cầu hoàn/đổi** (xem 2.8) khi đơn đủ điều kiện | Bắt buộc |
| FR-C-54 | Khách có thể **tự hủy đơn** khi đơn còn "Mới" và chưa thanh toán (đơn đã thanh toán/đã xác nhận → liên hệ shop) — **Trung đã duyệt (D16)** | Nên có |

### 2.7 Pre-order và hết hàng

**Quy tắc cơ bản (Bắt buộc):**
- Hết hàng: không đặt được (FR-C-07).
- Pre-order: đặt được; đơn được gắn cờ `is_preorder`; hiển thị rõ ngày dự kiến và lưu ý "hàng chưa có sẵn" ở trang sản phẩm, giỏ, checkout, email, trang tra cứu.
- Khách phải tích xác nhận "Tôi hiểu đây là sản phẩm đặt trước" khi giỏ có pre-order.
- Đơn pre-order dùng thêm trạng thái **"Chờ hàng về"** (xem 3.2).
- Nếu pre-order không nhập được hàng: shop hủy với lý do, hoàn tiền (nếu đã trả) theo quy trình 2.8.
- **(D13)** Giỏ được phép trộn hàng sẵn + pre-order; giỏ có pre-order **bắt buộc thanh toán QR, trả đủ trước** (không COD).

**Các điểm đã chốt / còn mở:** P1 = cho trộn giỏ (D13) nhưng **chưa rõ giao 1 lần hay tách giao** (Q-08b); P2 = **phương án A** (QR trả đủ trước, D13); P3 còn mở.

| Vấn đề | Phương án | Ưu | Nhược |
|---|---|---|---|
| P1. Giỏ có cả hàng sẵn + pre-order | A. Cấm trộn, phải đặt riêng | Đơn giản nhất, không lệch ship | Khách phải đặt 2 lần |
| | B. Cho trộn, giao 1 lần khi đủ hàng | Phí ship 1 lần, dễ hiểu | Khách chờ lâu cho hàng có sẵn |
| | C. Cho trộn, tách 2 lần giao | Hàng sẵn đến sớm | Phức tạp, phải tính ship 2 lần hoặc chịu lỗ |
| P2. Thanh toán pre-order | A. Chỉ chuyển khoản trả đủ trước | Giảm bom hàng | Khách ngại |
| | B. Cho cả COD | Khách thoải mái | Rủi ro bom hàng, tồn hàng nhập |
| | C. Đặt cọc một phần | Cân bằng | Logic tiền phức tạp hơn (thu phần còn lại) |
| P3. Giới hạn số lượng pre-order | Có giới hạn tổng + hạn chót đặt / Không giới hạn | — | — |

**Giữ tồn kho (Bắt buộc):** tồn kho trừ ngay khi tạo đơn (cả COD và QR); hoàn lại khi đơn hủy/hết hạn. Dùng transaction database để không bán lố khi 2 khách mua cùng lúc.

### 2.8 Hoàn trả / hủy / hoàn tiền (luồng ghi chú lý do — quyết định D2)

```
Khách gửi yêu cầu hoàn (kèm LÝ DO của khách + ảnh nếu có)
      ↓
Trạng thái đơn: "Yêu cầu hoàn trả"
      ↓
Shop xem → Duyệt / Từ chối (GHI CHÚ XỬ LÝ của shop, bắt buộc khi từ chối)
      ↓ (duyệt)
"Đã duyệt hoàn" → khách gửi hàng về → "Đã nhận hàng hoàn" → "Đã hoàn tiền" (nếu có) / "Đã đổi hàng"
```

| Mã | Yêu cầu | Ưu tiên |
|---|---|---|
| FR-C-60 | Form yêu cầu hoàn trên trang tra cứu: chọn lý do (hàng lỗi / giao sai / hư hỏng khi vận chuyển / khác) + ô mô tả + tải tối đa 3 ảnh (≤ 5MB/ảnh, tự nén) + **video khui hàng bắt buộc (D14)**: tải lên (giới hạn dung lượng `[Chờ Trung chọn]` — video quay điện thoại thường lớn hơn 5MB, xem Q-28) hoặc dán link | Bắt buộc |
| FR-C-61 | Chỉ cho gửi yêu cầu khi đơn ở trạng thái "Hoàn thành" và trong **3 ngày** (D14; admin cấu hình). Mốc tính: từ lúc shop chuyển đơn sang "Hoàn thành" (không có API SPX nên chưa biết ngày giao thật — Q-27) | Bắt buộc |
| FR-C-62 | Mỗi đơn có thể có yêu cầu hoàn liên quan; lưu **hai trường riêng**: `customer_reason` (khách) và `shop_note` (shop) | Bắt buộc |
| FR-C-63 | Khách nhận email mỗi khi yêu cầu hoàn đổi trạng thái | Bắt buộc |
| FR-C-64 | Hủy đơn trước khi giao (do khách liên hệ hoặc do shop): admin chọn/ghi **lý do hủy** (bắt buộc) | Bắt buộc |

### 2.9 Email cho khách

| Mã | Sự kiện | Ưu tiên |
|---|---|---|
| FR-C-70 | Xác nhận đã nhận đơn (kèm mã đơn, tóm tắt, link tra cứu, hướng dẫn QR nếu chuyển khoản) | Bắt buộc |
| FR-C-71 | Đã nhận thanh toán | Bắt buộc |
| FR-C-72 | Mỗi lần trạng thái đổi: Xác nhận / Đóng gói / Đang giao (kèm mã vận đơn) / Hoàn thành / Hủy (kèm lý do) | Bắt buộc |
| FR-C-73 | Cập nhật yêu cầu hoàn trả (nhận, duyệt, từ chối kèm ghi chú, hoàn tất) | Bắt buộc |
| FR-C-74 | Đơn pre-order: email khi hàng về, chuyển sang xử lý | Bắt buộc |
| FR-C-75 | Email nhắc thanh toán (đơn QR chưa trả, trước khi hết hạn) | Tùy chọn |
| FR-C-76 | Mẫu email đồng bộ thương hiệu hồng cute, đọc tốt trên điện thoại, có chân trang liên hệ shop | Nên có |
| FR-C-77 | Gửi email lỗi không được làm hỏng việc tạo đơn: ghi log, tự thử lại, admin xem được email thất bại | Bắt buộc |

---

## 3. Yêu cầu chức năng phía shop (admin)

### 3.1 Quản lý sản phẩm

| Mã | Yêu cầu | Ưu tiên |
|---|---|---|
| FR-A-01 | Thêm/sửa/ẩn/xóa mềm sản phẩm: tên, slug, mô tả (định dạng cơ bản), danh mục, trạng thái hiển thị | Bắt buộc |
| FR-A-02 | Biến thể: tên (vd màu/mẫu), SKU, giá, giá so sánh (gạch ngang, tùy chọn), tồn kho, **cân nặng (kg)** (SPX bắt buộc; có giá trị mặc định trong cài đặt, Q-29), trạng thái (còn hàng / hết hàng / pre-order), ngày dự kiến, giới hạn pre-order | Bắt buộc |
| FR-A-03 | Ảnh: tải nhiều ảnh, kéo thả sắp xếp, chọn ảnh đại diện; tự nén + tạo nhiều kích cỡ (WebP/JPEG) | Bắt buộc |
| FR-A-04 | Video sản phẩm: tải file **≤ 5MB**, lưu tự chủ (D21) trên Supabase Storage; từ chối file lớn hơn và hướng dẫn nén; chỉ tải khi khách bấm phát | Bắt buộc |
| FR-A-05 | Trạng thái tự động: tồn kho về 0 → "Hết hàng" (trừ biến thể đang đặt pre-order) | Bắt buộc |
| FR-A-06 | Điều chỉnh tồn kho nhanh (+/−) kèm lý do; ghi lịch sử biến động kho | Bắt buộc |
| FR-A-07 | Quản lý danh mục (thêm/sửa/sắp xếp) | Bắt buộc |
| FR-A-08 | `[Đề xuất thêm]` Nhập sản phẩm hàng loạt từ file CSV (vì có 50–100 sản phẩm) | Nên có |
| FR-A-09 | `[Đề xuất thêm]` Nhân bản sản phẩm | Tùy chọn |

### 3.2 Quản lý đơn hàng

**Trạng thái đơn:**

| Mã trạng thái | Hiển thị | Ghi chú |
|---|---|---|
| `new` | Mới | Vừa tạo |
| `confirmed` | Xác nhận | Shop đã xác nhận (hoặc tự động khi đã thanh toán — cấu hình) |
| `awaiting_stock` | Chờ hàng về | Chỉ đơn pre-order |
| `packing` | Đóng gói | |
| `shipping` | Giao | Đã giao cho SPX, có mã vận đơn |
| `completed` | Hoàn thành | |
| `cancelled` | Hủy | Bắt buộc có lý do hủy |
| `return_requested` | Yêu cầu hoàn trả | Khách gửi |
| `return_approved` | Đã duyệt hoàn | Shop duyệt |
| `return_rejected` | Từ chối hoàn | Bắt buộc ghi chú xử lý |
| `returned` | Đã nhận hàng hoàn | |
| `refunded` | Đã hoàn tiền / đã đổi | Kết thúc |

Luồng chính: **mới → xác nhận → (chờ hàng về) → đóng gói → giao → hoàn thành**; nhánh phụ: hủy (từ mới/xác nhận/chờ hàng/đóng gói), hoàn trả (từ hoàn thành). Quy tắc chuyển trạng thái hợp lệ phải kiểm tra ở server (không cho nhảy tùy tiện).

**Trạng thái thanh toán (tách riêng khỏi trạng thái đơn):** `unpaid` (COD/chưa trả), `awaiting` (chờ chuyển khoản), `paid`, `expired`, `needs_review` (sai số tiền/nội dung), `refund_pending`, `refunded`.

| Mã | Yêu cầu | Ưu tiên |
|---|---|---|
| FR-A-10 | Danh sách đơn: lọc theo trạng thái, thanh toán, ngày, pre-order, nguồn; tìm theo mã đơn/tên/SĐT; phân trang | Bắt buộc |
| FR-A-11 | Chi tiết đơn gồm đủ: **tên, SĐT, địa chỉ, email, sản phẩm (biến thể, SL, giá), ghi chú khách, phương thức/tình trạng thanh toán, phí ship, tổng, lý do hủy/hoàn (nếu có), lịch sử trạng thái (ai đổi, lúc nào)** | Bắt buộc |
| FR-A-12 | Đổi trạng thái 1 chạm; mỗi lần đổi ghi lịch sử và gửi email khách (có thể tắt gửi email cho từng lần đổi) | Bắt buộc |
| FR-A-13 | Hủy đơn: bắt buộc chọn/ghi lý do; trả lại tồn kho; nếu đã thanh toán → chuyển `refund_pending` | Bắt buộc |
| FR-A-14 | Xử lý yêu cầu hoàn: xem lý do + ảnh của khách; duyệt/từ chối kèm **ghi chú xử lý**; đánh dấu đã nhận hàng/đã hoàn tiền | Bắt buộc |
| FR-A-15 | Ghi chú nội bộ cho từng đơn (khách không thấy) | Bắt buộc |
| FR-A-16 | Xác nhận thanh toán thủ công (khi webhook lỗi / "Cần xử lý tay") | Bắt buộc |
| FR-A-17 | Cấu hình: đơn đã thanh toán có tự chuyển "Xác nhận" không | Nên có |
| FR-A-18 | Pre-order: màn hình lọc "Chờ hàng về", nút "Hàng đã về" chuyển hàng loạt đơn liên quan sang xử lý (có xác nhận trước) | Bắt buộc |
| FR-A-19 | `[Đề xuất thêm]` Xuất danh sách đơn ra CSV | Tùy chọn |

### 3.3 Thông tin mỗi đơn gửi về shop

| Mã | Yêu cầu | Ưu tiên |
|---|---|---|
| FR-A-20 | Khi có đơn mới, gửi **thông báo xác nhận đơn** về shop qua kênh đã chọn (xem 3.9), nội dung: mã đơn, tên, SĐT, địa chỉ, danh sách sản phẩm (biến thể × SL), ghi chú, phương thức thanh toán + tình trạng, tổng tiền, cờ pre-order, link mở thẳng trang đơn trong admin | Bắt buộc |
| FR-A-21 | Thông báo riêng khi: tiền chuyển khoản đã về, đơn cần xử lý tay, khách gửi yêu cầu hoàn (kèm lý do của khách) | Bắt buộc |

### 3.4 Quản lý khách hàng

| Mã | Yêu cầu | Ưu tiên |
|---|---|---|
| FR-A-30 | Hồ sơ khách tự tạo/cập nhật theo SĐT khi có đơn (không cần khách đăng ký) | Bắt buộc |
| FR-A-31 | Xem danh sách khách: tên, SĐT, email, số đơn, tổng chi tiêu, đơn gần nhất, nguồn; tìm kiếm | Bắt buộc |
| FR-A-32 | Xem lịch sử đơn của từng khách; ghi chú nội bộ về khách | Bắt buộc |
| FR-A-33 | Cảnh báo khách có tiền sử hủy/hoàn nhiều lần (chỉ hiển thị, không tự chặn) | Tùy chọn |
| FR-A-34 | Xuất/xóa (ẩn danh hóa) dữ liệu khách khi khách yêu cầu (phục vụ quyền dữ liệu cá nhân) | Nên có |

### 3.5 Vận chuyển SPX và in phiếu giao hàng

**Đã chốt (D7):** không dùng được API SPX → vận chuyển theo quy trình **file Excel mẫu của SPX**. Trung đã gửi file mẫu `collect_fee_mass_order_creation_template_vn_2level_addr.xlsx`; mapping cột bên dưới (3.5b) lấy từ file đó, **không đoán**.

| Cấp | Nội dung | Ưu tiên |
|---|---|---|
| Quy trình chính (MVP) | Website xuất file Excel theo mẫu SPX → shop tải lên spx.vn (**Tạo đơn → Tạo nhiều đơn hàng → Chọn tệp**, theo sheet hướng dẫn của mẫu) → nhập **mã vận đơn** về website; in phiếu giao hàng do website tạo | Bắt buộc |
| ~~Cấp 2 (API SPX)~~ | Không thực hiện (D7) | — |

| Mã | Yêu cầu | Ưu tiên |
|---|---|---|
| FR-A-40 | Trường mã vận đơn + hãng vận chuyển trên mỗi đơn; nhập khi chuyển sang "Giao" | Bắt buộc |
| FR-A-41 | In phiếu giao hàng: khổ A5 và 100×150mm (chọn được), CSS in chuẩn; gồm logo/tên shop, địa chỉ lấy hàng (cấu hình), người nhận (tên, SĐT, địa chỉ), danh sách hàng, **số tiền COD cần thu** (0 nếu đã thanh toán), ghi chú, mã đơn + mã vạch/QR | Bắt buộc |
| FR-A-42 | In hàng loạt nhiều đơn một lần (chọn nhiều đơn → in) | Nên có |
| FR-A-43 | ~~Tích hợp API SPX~~ — **Hủy bỏ** (D7, không có quyền truy cập API) | — |
| FR-A-44 | **Xuất Excel theo mẫu SPX**: chọn nhiều đơn (mặc định các đơn "Đóng gói") → sinh file `.xlsx` từ **bản sao nguyên vẹn của file mẫu** theo mapping 3.5b. Có kiểm tra dữ liệu trước khi xuất (thiếu cân nặng, phường/xã không khớp danh mục, SĐT sai…) và báo từng đơn lỗi | Bắt buộc |
| FR-A-45 | **Nhập mã vận đơn**: (a) nhập tay từng đơn; (b) import file kết quả (Excel/CSV) ghép theo **mã đơn website** (đã điền vào cột `Mã khách hàng` khi xuất); xem trước + báo dòng lỗi/không khớp rồi mới ghi. Khi ghi: đơn chuyển "Giao", gửi email có mã vận đơn (có thể tắt). Định dạng file kết quả của SPX `[Cần xác minh — Q-26]` | Bắt buộc |
| FR-A-46 | Cấu hình trong `settings`: tên shop, **địa chỉ lấy hàng (D22)**, SĐT (cập nhật sau), cân nặng mặc định, và giá trị mặc định các cột SPX (giao hàng một phần, thử hàng, xem hàng, phí từ chối nhận, giá trị cao, hình thức thanh toán phí ship — Q-25) | Bắt buộc |
| FR-A-47 | Lưu lịch sử mỗi lần xuất (ai, lúc nào, những đơn nào) để tránh tạo vận đơn trùng; cảnh báo nếu đơn đã được xuất trước đó | Nên có |

### 3.5b Mapping xuất Excel SPX (đọc từ file mẫu)

File mẫu có các sheet: `Tạo đơn (địa chỉ cũ)`, **`Tạo đơn (địa chỉ mới)`** (dùng sheet này — D9), `Hướng dẫn tạo đơn`, `Ví dụ đơn mẫu`, và các sheet danh mục ẩn/hiện (`State_list(2)`, `City_list(2)`, `State_list`, `City_list`, `District_list`). Dòng 1 là tiêu đề, dữ liệu từ dòng 2. Cột `*` = bắt buộc.

| Cột | Trường SPX | Lấy từ website |
|---|---|---|
| A | *Mã đơn hàng | Số thứ tự trong file (1, 2, 3…). Các dòng sản phẩm của **cùng một đơn dùng chung số này** (theo ví dụ trong mẫu); thông tin người nhận chỉ điền ở dòng đầu của đơn |
| B | *Tên người nhận | `orders.customer_name` |
| C | *Số điện thoại | `orders.phone`, ghi dạng **text** để giữ số 0 đầu |
| D | *Tỉnh/Thành Phố | Đúng từng ký tự theo `State_list(2)` (vd "Thành phố Hồ Chí Minh") |
| E | *Xã/Phường | Đúng từng ký tự theo `City_list(2)` (vd "Phường Dĩ An") |
| F | *Địa chỉ chi tiết | Số nhà, đường + phường/xã + tỉnh/thành (mẫu ví dụ ghi đầy đủ như vậy) |
| G, H | Lưu ý về địa chỉ; Mã bưu chính | Để trống |
| I | *Tên sản phẩm | Tên sản phẩm + biến thể (không trùng tên trong cùng một bưu gửi) |
| J, K | Số lượng; Giá tiền | `order_items.quantity`, `unit_price` (luôn điền) |
| L | *Tổng cân nặng bưu gửi (KG) | Tổng cân nặng các món (dòng đầu của đơn); dùng `weight_kg` hoặc mặc định |
| M, N, O | Chiều dài/rộng/cao (cm) | Không bắt buộc; để trống hoặc mặc định |
| P | Mã khách hàng | **Mã đơn website (vd CM7K2P9Q)** để import ngược |
| Q | *Giá trị đơn hàng | Tổng giá trị hàng của đơn `[Cần xác minh: có tính phí ship khách trả hay không]` |
| R | *Giao hàng một phần (Y/N) | Mặc định N (cấu hình, Q-25) |
| S | *Cho phép thử hàng (Y/N) | Mặc định cấu hình (Q-25) |
| T | *Cho xem hàng, không cho thử (Y/N) | Mặc định cấu hình; **bắt buộc = Y nếu S = Y hoặc R = Y** (theo sheet hướng dẫn) |
| U, V | Thu phí từ chối nhận / Phí cần thu | N / trống (nếu U = Y thì phí > 1.000 theo ràng buộc của mẫu) |
| W | *Thu COD (Y/N) | Y nếu thanh toán COD; N nếu đã trả QR |
| X | Số tiền COD | Tổng phải thu của đơn COD (gồm phí ship thu khách); trống nếu W = N |
| Y | Bưu gửi giá trị cao (Y/N) | Mặc định N (cấu hình) |
| Z | *Hình thức thanh toán | "Người gửi trả" hoặc "Người nhận trả" (đúng chính tả; mặc định cấu hình, Q-25) |
| AA | Lưu ý giao hàng | `orders.note` của khách (cắt gọn nếu quá dài) |
| AB, AC | Cột nhắc nhở / "Đủ điều kiện" | Công thức có sẵn của mẫu — **không ghi đè** |

**Quy tắc kỹ thuật bắt buộc (theo ghi chú trong mẫu):**
1. Dùng **bản sao nguyên vẹn của file mẫu** làm khuôn (giữ danh sách chọn, ràng buộc dữ liệu); **không thêm cột hoặc sheet mới** vì mẫu cấm.
2. Vùng ràng buộc dữ liệu của mẫu chạy đến khoảng dòng 496 → mỗi file tối đa ~495 dòng; vượt thì tự chia nhiều file.
3. Một số công thức ở cột AB/AC của sheet "địa chỉ mới" trong mẫu có tham chiếu lỗi (`#REF!`) → **không dựa vào** cột "Đủ điều kiện"; tự kiểm tra dữ liệu trước khi xuất. Cần **thử tải 1 file thật lên SPX** trước ngày ra mắt `[Cần xác minh]`.
4. Lưu mẫu trong repo (`assets/spx_template.xlsx`, ghi rõ ngày); khi SPX đổi mẫu, Trung tải mẫu mới để Antigravity cập nhật mapping (cột nằm trong cấu hình).
5. Nhân viên thao tác: chọn đơn → "Xuất Excel SPX" → tải lên spx.vn → lấy mã vận đơn → nhập/import vào website.

### 3.6 Báo cáo / thống kê (đề xuất nhóm báo cáo)

| Mã | Báo cáo | Nội dung | Ưu tiên |
|---|---|---|---|
| FR-A-50 | Tổng quan (dashboard) | Đơn mới hôm nay, đơn chờ xử lý, doanh thu hôm nay/tuần/tháng, sản phẩm sắp hết hàng | Bắt buộc |
| FR-A-51 | Doanh thu | Theo ngày/tuần/tháng; COD vs chuyển khoản; trừ đơn hủy/hoàn | Bắt buộc |
| FR-A-52 | Đơn hàng | Số đơn theo trạng thái; tỉ lệ hủy/hoàn; thời gian xử lý trung bình | Nên có |
| FR-A-53 | Sản phẩm | Bán chạy, bán chậm, tồn kho thấp, pre-order đang chờ | Nên có |
| FR-A-54 | Khách hàng | Khách mới vs quay lại, top khách | Tùy chọn |
| FR-A-55 | Nguồn đơn | Số đơn/doanh thu theo Facebook/Instagram/Threads/TikTok/Zalo (dựa trên utm/khảo sát FR-C-27) | Nên có |
| FR-A-56 | Lý do hủy/hoàn | Thống kê theo lý do để cải thiện | Tùy chọn |

Doanh thu chỉ hiển thị cho **Chủ** (xem phân quyền 3.7).

### 3.7 Phân quyền (Chủ / Nhân viên)

| Chức năng | Chủ (Owner) | Nhân viên (Staff) |
|---|:---:|:---:|
| Xem dashboard đơn/việc cần làm | ✅ | ✅ |
| Xem báo cáo doanh thu, nguồn, khách | ✅ | ❌ |
| Xem danh sách + chi tiết đơn | ✅ | ✅ |
| Đổi trạng thái đơn (xác nhận → giao → hoàn thành) | ✅ | ✅ |
| Hủy đơn | ✅ | ✅ (bắt buộc lý do) |
| Duyệt/từ chối hoàn trả, xác nhận hoàn tiền | ✅ | ❌ (chỉ xem + ghi chú) |
| Xác nhận thanh toán thủ công | ✅ | ❌ |
| Nhập mã vận đơn, in phiếu | ✅ | ✅ |
| Xem/sửa sản phẩm, giá | ✅ | Xem; sửa tồn kho + trạng thái ✅; sửa giá/xóa ❌ |
| Quản lý khách (xem) | ✅ | ✅ (xem đầy đủ, D18) |
| Xuất dữ liệu khách, xóa/ẩn danh | ✅ | ❌ |
| Cấu hình shop (phí ship, ngân hàng, kênh thông báo, chính sách) | ✅ | ❌ |
| Quản lý tài khoản nhân viên | ✅ | ❌ |
| Xem nhật ký hoạt động (audit log) | ✅ | ❌ |

| Mã | Yêu cầu | Ưu tiên |
|---|---|---|
| FR-A-60 | Quyền kiểm tra **ở server** cho mọi thao tác (không chỉ ẩn nút) | Bắt buộc |
| FR-A-61 | Chủ tạo/vô hiệu hóa tài khoản nhân viên; luôn có ít nhất 1 Chủ | Bắt buộc |
| FR-A-62 | Nhật ký hoạt động: ai, làm gì, lúc nào (đổi trạng thái, đổi giá, xóa, đăng nhập) | Nên có |

### 3.8 Đăng nhập admin (đã chọn phương án A: tên đăng nhập/email + mật khẩu — D11)

| Phương án | Ưu | Nhược |
|---|---|---|
| A. Email + mật khẩu (+ 2FA TOTP bằng app Google Authenticator) | Không phụ thuộc bên thứ ba, quen thuộc | Phải có quy trình quên mật khẩu (cần email chạy ổn) |
| B. Đăng nhập Google (chỉ cho các email trong danh sách cho phép) | Không phải nhớ mật khẩu, Google lo bảo mật/2FA | Phụ thuộc Google; cần thiết lập OAuth |
| C. Magic link qua email | Không mật khẩu | Phụ thuộc email giao đúng lúc |
| D. Passkey | Bảo mật cao, tiện trên điện thoại | Hỗ trợ không đồng đều, Antigravity khó debug hơn |

Yêu cầu (D11), triển khai bằng Supabase Auth hoặc tương đương:
- (Bắt buộc) Mật khẩu ≥ 10 ký tự, lưu dạng băm; phiên hết hạn hợp lý; khóa tạm khi nhập sai nhiều lần; admin ở đường dẫn riêng và `noindex`.
- (Bắt buộc) Chủ tạo tài khoản và **đặt lại mật khẩu cho nhân viên** trong admin (không phụ thuộc email vì chưa có tên miền riêng — D20).
- (Bắt buộc) Có ~5 nhân viên dùng mật khẩu → Chủ **vô hiệu hóa ngay** tài khoản khi nhân viên nghỉ và xóa họ khỏi nhóm Telegram.
- (Nên có) Bật 2FA (TOTP) tùy chọn, khuyến nghị bật cho Chủ vì mật khẩu đơn thuần là mức bảo vệ thấp cho dữ liệu khách.

### 3.9 Kênh thông báo đơn mới về shop (đánh giá khả thi, quyết định D1)

Hai vai trò của Zalo/Threads/TikTok: **nhận thông báo** (mục này) và **kéo khách vào web** (mục 3.10).

| Kênh | Khả thi để shop **nhận thông báo đơn**? | Điều kiện / giới hạn | Phí |
|---|---|---|---|
| **Email** | ✅ Khả thi, chắc chắn | Cần dịch vụ gửi email (mục 7.3) | Miễn phí ở quy mô này `[Cần xác minh giới hạn]` |
| **Telegram bot** `[Đề xuất thêm]` | ✅ Khả thi | Tạo bot qua BotFather, gửi tin vào chat/nhóm riêng của shop. Là kênh duy nhất ngoài email mình thấy đơn giản, miễn phí, có API chính thức | Miễn phí `[Cần xác minh]` |
| **Zalo OA / ZNS** | ⚠️ Có thể nhưng hạn chế | Cần tạo Zalo Official Account (có thể cần giấy tờ doanh nghiệp/hộ KD), điều kiện gửi tin chủ động và tin ZNS có phí/duyệt mẫu | `[Cần xác minh toàn bộ]` |
| **Zalo cá nhân** | ❌ Không | Không có API chính thức để website tự nhắn tin tài khoản cá nhân; cách "lách" vi phạm điều khoản, dễ bị khóa tài khoản | — |
| **Threads** | ❌ Không phù hợp | Là nền tảng đăng bài, không phải kênh nhận thông báo nội bộ; không có cơ chế tin nhắn riêng cho mục đích này `[Cần xác minh]` | — |
| **TikTok** | ❌ Không phù hợp | Tương tự: không có API nhắn tin thông báo cho chủ shop phù hợp mục đích này `[Cần xác minh]` | — |
| Web Push (PWA) `[Đề xuất thêm]` | ⚠️ Có điều kiện | Chủ shop cài web vào màn hình chính điện thoại; iOS có hạn chế `[Cần xác minh]` | Miễn phí |

**Đề xuất thực tế:** Email (Bắt buộc) + Telegram (Nên có, `[Đề xuất thêm]` cần Trung duyệt). Zalo OA để giai đoạn sau nếu Trung có OA và chấp nhận điều kiện. Threads/TikTok **không** dùng làm kênh nhận thông báo. **(D12)** Trung chọn Telegram: tin nhắn chứa SĐT/địa chỉ khách nên chỉ gửi vào nhóm riêng của shop, kiểm soát thành viên (xem 3.8).

| Mã | Yêu cầu | Ưu tiên |
|---|---|---|
| FR-A-70 | Thông báo đơn mới qua Email cho shop (có thể nhiều địa chỉ) | Bắt buộc |
| FR-A-71 | Thông báo đơn mới + sự kiện (tiền về, cần xử lý tay, yêu cầu hoàn) qua **Telegram bot** vào nhóm chat của shop (Trung đã duyệt, D12); bật/tắt trong admin | Bắt buộc |
| FR-A-72 | Kiến trúc "kênh thông báo" dạng plugin: thêm kênh mới (Zalo OA…) không phải sửa luồng đơn | Nên có |
| FR-A-73 | Trang admin có chỉ báo số đơn mới chưa xem + âm báo khi đang mở trang | Nên có |
| FR-A-74 | Lỗi gửi thông báo không làm hỏng đơn; ghi log; thử lại | Bắt buộc |

### 3.10 Kéo khách vào web từ mạng xã hội (vai trò "nguồn traffic")

| Mã | Yêu cầu | Ưu tiên |
|---|---|---|
| FR-A-80 | Tạo/ghi nhớ tham số `utm_source`, `utm_medium` khi khách vào web; lưu cùng đơn | Nên có |
| FR-A-81 | Trang admin có bảng link mẫu sẵn cho từng nền tảng (dán vào bio/bài đăng): `/?utm_source=tiktok`, `facebook`, `instagram`, `threads`, `zalo` | Nên có |
| FR-A-82 | Web phải chạy tốt trong trình duyệt tích hợp của Facebook/Instagram/TikTok/Threads/Zalo (kiểm thử bắt buộc, xem mục 12) | Bắt buộc |
| FR-A-83 | `[Đề xuất thêm]` Nút "Hỏi shop qua Messenger/Zalo" (link chat) ở chân trang và trang sản phẩm | Tùy chọn |

---

## 4. Yêu cầu phi chức năng

| Mã | Nhóm | Yêu cầu | Ưu tiên |
|---|---|---|---|
| NFR-01 | Mobile-first | Thiết kế trước cho màn 360–430px; nút ≥ 44px; không cuộn ngang; chữ ≥ 16px ở ô nhập (tránh iOS tự phóng to) | Bắt buộc |
| NFR-02 | Tốc độ | LCP ≤ 2,5 giây trên 4G ở trang chủ và trang sản phẩm; ảnh WebP + lazy-load + đúng kích cỡ; JS tối thiểu | Bắt buộc |
| NFR-03 | Tốc độ | Video không tự tải nặng: chỉ tải khi khách bấm phát | Bắt buộc |
| NFR-04 | Tương thích | Chạy tốt trên Chrome/Safari mới nhất (iOS, Android) và trình duyệt in-app của Facebook, Instagram, TikTok, Threads, Zalo | Bắt buộc |
| NFR-05 | Bảo mật | HTTPS toàn site; mật khẩu băm (argon2/bcrypt); chống SQL injection/XSS/CSRF; validate dữ liệu ở server; rate limit đăng nhập, tra cứu, đặt đơn | Bắt buộc |
| NFR-06 | Bảo mật | Khóa bí mật (API key) chỉ ở biến môi trường, không đưa vào code/repo | Bắt buộc |
| NFR-07 | Bảo mật | Webhook thanh toán xác thực chữ ký/khóa + chống trùng lặp (xem INT-01) | Bắt buộc |
| NFR-08 | Bảo mật | Không lưu số thẻ/dữ liệu thanh toán nhạy cảm (chỉ COD + chuyển khoản, không có thẻ) | Bắt buộc |
| NFR-09 | Dữ liệu | Chỉ thu thập dữ liệu cần thiết cho đơn hàng; admin che bớt dữ liệu cho Staff | Bắt buộc |
| NFR-10 | Sao lưu | Sao lưu database tự động hằng ngày, giữ ≥ 14 bản gần nhất, lưu ở nơi tách khỏi nơi chạy website; **thử khôi phục** ít nhất 1 lần trước khi ra mắt | Bắt buộc |
| NFR-11 | Sao lưu | Ảnh/video sản phẩm cũng được sao lưu (hoặc lưu ở dịch vụ có bản dự phòng) | Nên có |
| NFR-12 | Chịu tải | Chạy ổn với 20 đơn/ngày, 50 khách/ngày; thiết kế chịu được đột biến (vd livestream/viral) ≥ 10 lượt đặt đơn trong 5 phút không lỗi, không bán lố | Bắt buộc |
| NFR-13 | Độ tin cậy | Mục tiêu hoạt động ≥ 99% mỗi tháng (mức nỗ lực tối đa, phụ thuộc hosting miễn phí) `[Cần xác minh SLA hosting]` | Nên có |
| NFR-14 | Mở rộng | Cấu trúc module (sản phẩm, đơn, thanh toán, vận chuyển, thông báo) để thêm tính năng sau; thay đổi dịch vụ ngoài (thanh toán, email) qua lớp trừu tượng | Nên có |
| NFR-15 | Bảo trì bởi AI | Repo Git có README, `.env.example`, migration database, dữ liệu mẫu (seed), test tự động cho luồng đặt đơn/thanh toán/trạng thái, `CHANGELOG.md`, `RUNBOOK.md` (cách deploy, rollback, khôi phục backup, xử lý sự cố thường gặp) | Bắt buộc |
| NFR-16 | Bảo trì bởi AI | Deploy tự động từ nhánh `main` (CI/CD); có môi trường thử (staging) tách biệt dữ liệu thật | Bắt buộc |
| NFR-17 | Giám sát | Ghi log lỗi; cảnh báo tới Chủ (email/Telegram) khi: webhook thanh toán lỗi, gửi email lỗi liên tục, site không truy cập được | Nên có |
| NFR-18 | Khả năng tiếp cận | Độ tương phản chữ/nền đạt mức đọc được (≥ 4,5:1 cho chữ thường); thẻ `alt` cho ảnh | Nên có |
| NFR-19 | Múi giờ/định dạng | Mọi thời gian lưu UTC, hiển thị UTC+7; tiền tệ là số nguyên VNĐ (không dùng số thực) | Bắt buộc |

---

## 5. Giao diện và thương hiệu

### 5.1 Phong cách
Hồng, cute, ấm áp, mềm mại (hợp squishy): bo góc lớn, nút tròn, bóng nhẹ, icon dễ thương. Tránh quá nhiều hiệu ứng làm chậm máy.

### 5.2 Bảng màu đề xuất (Trung duyệt / chỉnh)

| Vai trò | Màu | Mã HEX gợi ý |
|---|---|---|
| Chính (nút, nhấn) | Hồng kẹo | `#F9739B` |
| Hồng đậm (hover, giá) | Hồng đậm | `#E24C7C` |
| Nền nhạt | Hồng phấn | `#FFE8EF` |
| Nền trang | Kem | `#FFF9F6` |
| Chữ chính | Nâu chocolate (hợp tên "choco") | `#5A3A3A` |
| Nhấn phụ | Xanh mint | `#9ADFC8` |
| Cảnh báo/hết hàng | Xám ấm | `#A39A9A` |
| Pre-order (nhãn) | Vàng bơ | `#FFD76A` |

Màu chữ trên nền hồng phải đạt tương phản đủ đọc (Antigravity kiểm tra).

### 5.3 Font (đã chọn phương án A: **Baloo 2** tiêu đề + **Nunito** nội dung — D19)
Cần font hỗ trợ tiếng Việt đầy đủ (Google Fonts, miễn phí):

| Phương án | Tiêu đề | Nội dung | Cảm giác |
|---|---|---|---|
| A | Baloo 2 | Nunito | Tròn, cute, dễ đọc |
| B | Quicksand | Nunito | Mềm, nhẹ nhàng |
| C | Fredoka | Nunito | Rất tròn, vui, hơi "trẻ con" |

Antigravity phải **kiểm tra hiển thị đủ dấu tiếng Việt** trước khi dùng.

### 5.4 Logo (đã chọn hướng A: logo chữ "chocomino" — D19)
| Hướng | Ưu | Nhược | Chi phí |
|---|---|---|---|
| A. Logo chữ (wordmark) "chocomino" bằng font tròn + 1 icon nhỏ (vd giọt kem/dấu ♥) | Làm ngay, nhẹ, đồng bộ | Đơn giản | 0đ |
| B. Tự thiết kế trên Canva (Trung đang có kết nối Canva) | Nhiều mẫu, tự chỉnh | Cần thời gian chọn | 0đ (bản miễn phí, kiểm tra điều khoản dùng thương mại `[Cần xác minh]`) |
| C. Tạo bằng AI rồi chỉnh | Nhanh, độc đáo | Cần kiểm tra bản quyền/giấy phép dùng thương mại `[Cần xác minh]`, chất lượng không đều | 0đ hoặc tùy công cụ |
| D. Thuê designer | Chất lượng cao | Có thể vượt ngân sách | `[Cần xác minh]` |

Trong lúc chưa có logo: dùng phương án A làm tạm (đủ để ra mắt). Yêu cầu: logo/favicon xuất dạng SVG + PNG; có phiên bản nền sáng.

### 5.5 Bố cục các trang chính (wireframe bằng chữ, mobile)

**Trang chủ**
```
[Thanh trên: ☰ menu | logo chocomino | 🔍 | 🛒(2)]
[Banner trượt: khuyến mãi / hàng mới / pre-order]
[Lưới biểu tượng danh mục tròn, cuộn ngang]
[Mục "Hàng mới về": lưới 2 cột — ảnh vuông, tên, giá, nhãn]
[Mục "Đang pre-order": cuộn ngang, nhãn vàng + ngày dự kiến]
[Mục "Bán chạy"]
[Chân trang: liên hệ, chính sách, link MXH, nút chat]
```
**Danh mục / tìm kiếm:** thanh lọc cố định (trạng thái, sắp xếp) + lưới 2 cột, tải thêm khi cuộn ("Xem thêm").
**Chi tiết sản phẩm:** ảnh/video vuốt ngang + chấm trang → tên, giá, nhãn trạng thái → chọn biến thể (nút tròn/chip) → số lượng → mô tả (thu gọn/mở rộng) → sản phẩm liên quan → **thanh cố định dưới đáy: "Thêm vào giỏ"**.
**Giỏ hàng:** danh sách dòng (ảnh nhỏ, tên, biến thể, ±, xóa) → tạm tính → "Thanh toán".
**Thanh toán:** 1 cột: thông tin → địa chỉ → phương thức thanh toán → tóm tắt (có phí ship) → đồng ý chính sách → "Đặt hàng".
**Trang QR:** mã QR lớn, số tiền, nội dung, nút sao chép, đồng hồ đếm hạn thanh toán, trạng thái tự cập nhật.
**Tra cứu đơn:** 2 ô (mã đơn, SĐT) → kết quả dạng timeline trạng thái.
**Admin (điện thoại + máy tính):** menu: Tổng quan | Đơn hàng | Sản phẩm | Khách hàng | Báo cáo | Cài đặt. Danh sách đơn dạng thẻ trên điện thoại, bảng trên máy tính.

---

## 6. Đề xuất kiến trúc và công nghệ (đã chốt: Vercel + Supabase — D5, D10)

Tiêu chí: miễn phí/rẻ, Antigravity bảo trì được, dùng thương mại được, không cần thao tác tay phức tạp. Các số liệu giới hạn/phí dưới đây phần lớn `[Cần xác minh]` trên trang chính thức tại thời điểm triển khai (chính sách free tier hay thay đổi).

### 6.1 Phương án tổng thể

| | A. Next.js + Supabase + Vercel | B. Cloudflare (Pages/Workers + D1 + R2) | C. VPS nhỏ + Docker (Node + Postgres) | D. Firebase (Next.js/React + Firestore) |
|---|---|---|---|---|
| Mô tả | Web Next.js; DB Postgres + đăng nhập + lưu file của Supabase; chạy trên Vercel | Toàn bộ trên Cloudflare: web, API, database SQLite (D1), lưu file (R2) | 1 máy chủ ảo tự cài mọi thứ | Dịch vụ Google, database kiểu NoSQL |
| Lý do | Hệ sinh thái phổ biến, AI quen code nhất, có sẵn đăng nhập/DB/lưu ảnh | Gần như một chỗ cho mọi thứ, miễn phí nhiều, nhanh toàn cầu | Toàn quyền, không giới hạn kiểu free-tier | Dễ bắt đầu, có sẵn đăng nhập |
| Ưu | Phát triển nhanh; nhiều tài liệu; Postgres mạnh cho đơn/tồn kho (transaction) | Không bị "ngủ" do ít truy cập; chi phí gần 0; băng thông R2 không tính phí egress `[Cần xác minh]` | Không bị ràng buộc điều khoản free-tier; dùng thương mại thoải mái | Hạ tầng Google ổn định |
| Nhược | **Vercel gói Hobby có điều khoản hạn chế dùng thương mại** `[Cần xác minh — rất quan trọng]`; Supabase gói free có thể tạm dừng project khi ít hoạt động `[Cần xác minh]` | Hệ sinh thái mới hơn; D1 (SQLite) có giới hạn, cách làm transaction/tồn kho cần cẩn thận; AI có thể ít quen hơn | **Chi phí hằng tháng** (có thể vượt ngân sách nếu 500k là tổng cả năm); Antigravity phải tự vá bảo mật, cập nhật OS, sao lưu | NoSQL khó làm báo cáo và tồn kho nhất quán; Cloud Functions có thể cần gói trả theo mức dùng + thẻ `[Cần xác minh]` |
| Chi phí ước tính | 0đ nếu hợp điều khoản; nếu phải lên gói trả phí thì tốn thêm `[Cần xác minh]` | ~0đ (cộng tên miền) `[Cần xác minh]` | Thường từ vài chục đến vài trăm nghìn/tháng `[Cần xác minh giá nhà cung cấp VN/quốc tế]` | 0đ ở mức nhỏ, có thể phát sinh `[Cần xác minh]` |
| Hợp với yêu cầu "AI tự bảo trì" | Rất hợp | Hợp | Trung bình (nhiều việc vận hành) | Hợp |
| Rủi ro lớn nhất | Điều khoản thương mại + free-tier ngủ | Giới hạn D1/Workers khi mở rộng | Vượt ngân sách + công vận hành | Chi phí bất ngờ |

*Gợi ý tham khảo (không chốt):* A và B hợp nhất với "miễn phí + AI bảo trì"; C chỉ hợp nếu Trung chấp nhận trả phí hằng tháng. Antigravity cần xác minh điều khoản của từng nhà cung cấp trước khi Trung quyết.

### 6.1b Quyết định đã chốt: hosting Vercel, ngân sách 500.000đ/tháng (D4, D5)

**Điểm phải xác minh ngay (Antigravity báo lại Trung trước khi code):**

| Vấn đề | Ghi chú |
|---|---|
| Điều khoản gói Hobby (miễn phí) của Vercel | Theo mình biết gói Hobby dành cho dự án cá nhân/phi thương mại → website bán hàng có thể phải dùng gói trả phí (Pro) `[Cần xác minh — quan trọng]` |
| Giá gói Pro | Tính bằng USD/tháng/thành viên + phần dùng vượt mức `[Cần xác minh giá hiện hành và quy đổi VNĐ]`. Nếu Pro chiếm gần hết 500k/tháng thì database, email, tên miền phải nằm trong phần còn lại hoặc free tier |
| Cron job (hết hạn đơn QR, đối soát thanh toán 15–30 phút) | Giới hạn tần suất cron phụ thuộc gói `[Cần xác minh]`; nếu không đủ → dùng GitHub Actions hoặc dịch vụ cron ngoài |
| Thời gian chạy tối đa của function, kết nối database | Vercel chạy theo kiểu serverless: cần connection pooler cho Postgres, webhook phải trả lời nhanh `[Cần xác minh giới hạn]` |

**Ngân sách mẫu mỗi tháng (điền số thật sau khi xác minh):**

| Khoản | Số tiền/tháng | Trạng thái |
|---|---|---|
| Vercel (Hobby hoặc Pro) | ? | `[Cần xác minh]` |
| Database | ? | `[Cần xác minh]` |
| Tên miền | 0đ (không mua — D20) | Đã chốt |
| Email gửi đơn | ? | `[Cần xác minh]` |
| Dịch vụ xác nhận chuyển khoản | ? | `[Cần xác minh]` |
| **Tổng** | **≤ 500.000đ** | Antigravity lập bảng số liệu thật |

**Database đi kèm Vercel: đã chọn Supabase (D10)** — dùng cho database, lưu ảnh/video và đăng nhập admin. Bảng so sánh giữ để tham khảo. Rủi ro đã biết: gói free của Supabase có thể tạm dừng khi ít hoạt động `[Cần xác minh]`; shop có đơn hằng ngày nên ít khả năng, Antigravity vẫn phải kiểm tra và nêu phương án giữ hoạt động hoặc nâng gói trong ngân sách 500k/tháng:

| Phương án | Ưu | Nhược |
|---|---|---|
| Supabase (Postgres + Storage + Auth) | Gói gọn DB + lưu ảnh + đăng nhập admin; AI quen | Gói free có thể tạm dừng khi ít hoạt động `[Cần xác minh]`; thêm 1 nhà cung cấp |
| Neon (Postgres serverless, tích hợp được từ Vercel) | Hợp mô hình serverless; Postgres chuẩn (transaction tồn kho) | Cần tự làm đăng nhập admin + lưu ảnh (Vercel Blob/R2); có độ trễ khi "thức dậy" `[Cần xác minh]` |
| Postgres khác trong Vercel Marketplace | Thanh toán gộp một chỗ | `[Cần xác minh]` danh sách/giá |

Với ngân sách 500k/tháng, phương án VPS (mục 6.1, cột C) vẫn khả thi nhưng Trung đã chọn Vercel nên không phát triển thêm.

### 6.2 Lưu trữ ảnh/video (đã chốt D21: tự lưu, video ≤ 5MB, trên Supabase Storage)

Ước tính dung lượng tối đa: 100 sản phẩm × (5 ảnh ≈ 150KB + 1 video 5MB) ≈ 0,6GB. Antigravity phải đối chiếu với giới hạn dung lượng và băng thông của gói Supabase đang dùng `[Cần xác minh]`; nếu vượt → nén mạnh hơn hoặc báo Trung. Bảng dưới là phương án đã cân nhắc (chọn A + C):

| Phương án | Ưu | Nhược |
|---|---|---|
| A. Lưu ảnh ở object storage (Supabase Storage / Cloudflare R2) + tự nén | Chủ động, đồng bộ website | Có giới hạn dung lượng free `[Cần xác minh]` |
| B. Video: nhúng từ YouTube (không công khai/unlisted) hoặc TikTok | Không tốn dung lượng/băng thông | Phụ thuộc bên thứ ba, hiện quảng cáo/gợi ý video, TikTok nhúng có thể thay đổi `[Cần xác minh]` |
| C. Video tự lưu (giới hạn ≤ 30MB, nén sẵn) | Gọn, đồng nhất giao diện | Tốn dung lượng/băng thông, cần tối ưu |

### 6.3 Các thành phần khác (đề xuất tham khảo)

| Thành phần | Lựa chọn | Ghi chú |
|---|---|---|
| Frontend | React-based (Next.js hoặc Astro + React) | Mobile-first, SSR/SSG cho SEO và tốc độ |
| Ngôn ngữ | TypeScript | AI dễ sinh/kiểm tra code |
| Database | PostgreSQL (A, C) hoặc SQLite/D1 (B) | Cần transaction cho tồn kho |
| Tác vụ nền (hết hạn đơn, đối soát thanh toán, gửi lại email) | Cron của nền tảng hosting hoặc GitHub Actions | `[Cần xác minh giới hạn cron của gói free]` |
| Theo dõi lỗi | Log của hosting; Sentry free tùy chọn | `[Cần xác minh]` |

---

## 7. Tích hợp bên ngoài

### 7.1 INT-01 — Xác nhận chuyển khoản tự động `[AI đề xuất — Trung duyệt]`

Cách hoạt động chung: website tạo mã QR (số tiền + nội dung = mã đơn) → khách chuyển → dịch vụ phát hiện biến động số dư → gọi webhook báo cho website → website đối chiếu và xác nhận.

| Phương án | Mô tả | Điều kiện / giới hạn | Phí |
|---|---|---|---|
| **SePay** | Theo dõi biến động số dư tài khoản ngân hàng của shop, gọi webhook về website; có tạo ảnh QR qua `qr.sepay.vn/img`; có API giao dịch để đối soát | Theo tài liệu SePay: webhook cần URL HTTPS công khai; hỗ trợ xác thực HMAC-SHA256/API Key; tự thử lại tối đa 7 lần (~33 phút); **webhook có thể mất nếu endpoint sập > 5 giờ → cần cron đối soát 15–30 phút/lần**; một số ngân hàng (BIDV, OCB, MSB, KienLongBank) chỉ xác thực qua tài khoản ảo (VA) theo tài liệu. Danh sách ngân hàng hỗ trợ: `[Cần xác minh]` | **Gói/giá miễn phí và giới hạn số giao dịch: `[Cần xác minh]`** |
| **Casso** | Dịch vụ tương tự (theo dõi giao dịch, webhook) | `[Cần xác minh]` điều kiện, ngân hàng hỗ trợ | `[Cần xác minh]` |
| **payOS** | Cổng thanh toán QR | `[Cần xác minh]` điều kiện đăng ký (có thể cần thông tin doanh nghiệp), ngân hàng | `[Cần xác minh]` |
| Chỉ tạo QR VietQR + **xác nhận tay** | Tạo ảnh QR (không tự xác nhận); shop xem app ngân hàng rồi bấm "Đã thanh toán" | Miễn phí, nhưng **không đạt yêu cầu "tự động"** — chỉ làm phương án dự phòng (FR-A-16) | 0đ |

**Đề xuất (Trung giao AI chọn, D6):**
1. **Chính: SePay** — lý do: có tài liệu kỹ thuật rõ ràng cho webhook + tạo QR + API đối soát (đã kiểm tra), webhook có xác thực HMAC, hợp với website tự code. Điều kiện chốt: xác minh được (a) ngân hàng của shop được hỗ trợ, (b) gói/phí phù hợp 500k/tháng với ~20 đơn/ngày (~600 giao dịch/tháng), `[Cần xác minh]`.
2. **Dự phòng: Casso** nếu SePay không hỗ trợ ngân hàng của shop hoặc giá không phù hợp `[Cần xác minh]`.
3. **Luôn có:** xác nhận tay trong admin (FR-A-16) khi dịch vụ lỗi.
4. payOS không ưu tiên vì chưa rõ điều kiện đăng ký cho shop `[Cần xác minh]`.
**Đã biết (D8): Techcombank, tài khoản cá nhân.** Theo tài liệu SePay: kết nối **API** được liệt kê cho một số ngân hàng (TPBank, VietinBank, ACB, MBBank ở mục đồng bộ giao dịch) và **mọi ngân hàng dùng được qua kết nối SMS Banking**. Techcombank cá nhân có kết nối API hay phải qua SMS Banking: **`[Cần xác minh trực tiếp trên my.sepay.vn/hỗ trợ SePay]`**. Nếu phải qua SMS Banking, việc xác nhận phụ thuộc SMS biến động số dư của ngân hàng (có thể mất phí, có thể trễ/mất) → bắt buộc có đối soát + xác nhận tay (FR-A-16) và báo Trung (Q-30). Nếu SePay không phù hợp, đánh giá Casso `[Cần xác minh]`.

Yêu cầu kỹ thuật bắt buộc cho webhook (theo khuyến nghị bảo mật của dịch vụ):

| Mã | Yêu cầu | Ưu tiên |
|---|---|---|
| INT-01a | Xác thực mọi webhook (chữ ký HMAC hoặc API key so sánh an toàn); chỉ chấp nhận từ IP cho phép nếu dịch vụ công bố danh sách | Bắt buộc |
| INT-01b | Chống trùng: lưu `transaction_id` UNIQUE; webhook lặp lại không được cộng/đổi trạng thái 2 lần | Bắt buộc |
| INT-01c | Chỉ xác nhận khi **đúng tài khoản nhận + đúng mã đơn trong nội dung + số tiền khớp** (đúng tổng đơn); sai → `needs_review` | Bắt buộc |
| INT-01d | Cron đối soát 15–30 phút: gọi API lấy giao dịch gần đây, so với database, bổ sung giao dịch thiếu | Bắt buộc |
| INT-01e | Trả mã phản hồi đúng quy ước dịch vụ yêu cầu; xử lý nhanh (timeout ngắn) | Bắt buộc |
| INT-01f | Có chế độ giả lập giao dịch để test (dùng công cụ giả lập của dịch vụ nếu có) | Nên có |

**Mã đơn** (đồng thời là nội dung chuyển khoản): đề xuất `CM` + 6 ký tự chữ-số ngẫu nhiên (loại ký tự dễ nhầm O/0, I/1), không dấu gạch/cách, vd `CM7K2P9Q`, để ngân hàng không làm hỏng nội dung và dịch vụ nhận diện được. Cách cấu hình nhận diện tiền tố ở dịch vụ: `[Cần xác minh]`.

### 7.2 INT-02 — SPX (vận chuyển)

| Thông tin | Trạng thái |
|---|---|
| Có API cho đối tác/shop | Trung xác nhận **không có quyền dùng API SPX** (D7) |
| Chức năng API (tạo đơn, lấy mã vận đơn, theo dõi, lấy nhãn) | Không áp dụng (dùng Excel mẫu) |
| Link theo dõi công khai cho khách | `[Cần xác minh]` định dạng link |
| Phí vận chuyển thực tế vs phí thu khách (18k/22k) | Phí SPX thực tế có thể khác → Trung tự theo dõi lỗ/lãi `[Cần xác minh]` |

Quyết định (D7): **không có API SPX**; chỉ làm quy trình Excel mẫu + nhập mã vận đơn (FR-A-40, 41, 44, 45, 46). Nếu sau này Trung có API key thì thêm module mới, không cần sửa luồng đơn. Link theo dõi cho khách: `[Cần xác minh]` định dạng link tra cứu công khai của SPX.

### 7.3 INT-03 — Email `[Chờ Trung chọn — phụ thuộc Q-31]`

| Phương án | Ưu | Nhược |
|---|---|---|
| Resend | API đơn giản, free tier cho shop nhỏ | Cần tên miền riêng để gửi từ địa chỉ của shop; giới hạn free `[Cần xác minh]` |
| Brevo (Sendinblue) | Free tier có hạn mức hằng ngày | Giới hạn/điều khoản `[Cần xác minh]`; email có thể kèm chân trang quảng cáo ở gói free `[Cần xác minh]` |
| Gmail SMTP | Không cần tên miền | Giới hạn gửi/ngày, dễ vào spam, Google có thể chặn khi tự động gửi `[Cần xác minh]` — **rủi ro, chỉ dùng tạm** |

Lưu ý (D20, không mua tên miền): để email gửi đúng địa chỉ shop và ít vào spam, các dịch vụ gửi email thường cần xác thực tên miền (SPF/DKIM) `[Cần xác minh từng dịch vụ]`. Khi không có tên miền, cân nhắc:
1. **Gmail SMTP** với Gmail riêng của shop (mật khẩu ứng dụng): đơn giản, hợp ~20 đơn/ngày nhưng có giới hạn gửi/ngày và Google có thể chặn gửi tự động `[Cần xác minh]` → rủi ro.
2. Dịch vụ gửi email chỉ cho phép dùng địa chỉ đã xác minh làm người gửi: thường hạn chế hoặc dễ vào spam khi gửi từ Gmail `[Cần xác minh]`.
3. **Mua tên miền rẻ** (ngân sách 500k/tháng đủ chỗ; giá `[Cần xác minh]`) → giải quyết cả email lẫn độ tin cậy khi khách chuyển khoản. Mình đề nghị Trung xem lại (Q-31).
Giảm thiểu dù chọn gì: trang "Đặt hàng thành công" + trang QR hiển thị đủ thông tin; khách luôn tra cứu được bằng mã đơn + SĐT (không phụ thuộc email).

### 7.4 INT-04 — Telegram (nếu duyệt)
Tạo bot qua BotFather, lấy token + chat id, website gọi API gửi tin. Chi phí 0đ `[Cần xác minh]`.

### 7.5 INT-05 — Zalo OA / ZNS (giai đoạn sau)
Chỉ làm nếu Trung có OA và chấp nhận điều kiện/phí: `[Cần xác minh toàn bộ]` (điều kiện đăng ký OA, phí ZNS, duyệt mẫu tin).

### 7.6 INT-06 — Pixel quảng cáo (KHÔNG làm — Trung không chạy quảng cáo, D25)

---

## 8. Dữ liệu và pháp lý

### 8.1 Mô hình dữ liệu (các bảng, trường chính)

Quy ước: `id` (UUID), `created_at`, `updated_at` (UTC); tiền là số nguyên VNĐ.

| Bảng | Trường chính |
|---|---|
| `categories` | name, slug, sort_order, is_active |
| `wards` | province, ward (đúng chính tả theo mẫu SPX), `in_old_hcm` (true/false/chưa phân loại), is_active — seed từ sheet `City_list(2)` của mẫu SPX |
| `products` | name, slug, description, category_id, is_active, is_featured, deleted_at |
| `product_variants` | product_id, name, sku, price, compare_price, stock_qty, status (`in_stock`/`out_of_stock`/`preorder`), preorder_eta, preorder_limit, **weight_kg**, sort_order, is_active |
| `product_media` | product_id, type (`image`/`video`), url, sort_order, is_primary |
| `customers` | name, phone (unique), email, note, first_source, total_orders, total_spent |
| `orders` | code (unique, vd CM7K2P9Q), customer_id, customer_name, phone, email, address_province, address_ward, address_detail, note, is_preorder, status, payment_method (`cod`/`bank_qr`), payment_status, subtotal, shipping_fee, total, source (utm), cancel_reason, internal_note, expires_at, idempotency_key, anonymized_at |
| `order_items` | order_id, product_id, variant_id, product_name_snapshot, variant_name_snapshot, unit_price, quantity, line_total |
| `order_status_history` | order_id, from_status, to_status, changed_by, reason, created_at |
| `payments` | order_id, method, amount, status, paid_at, bank_tx_id |
| `bank_transactions` | provider_tx_id (UNIQUE), account_number, amount, content, matched_order_id, raw_payload, status, received_at |
| `shipments` | order_id, carrier (`SPX`), tracking_code, status, label_url, created_at |
| `return_requests` | order_id, status, **customer_reason**, customer_description, photos, **shop_note**, resolved_by, resolution (`refund`/`exchange`/`rejected`), refund_amount, created_at, resolved_at |
| `stock_movements` | variant_id, change_qty, reason (`order`/`cancel`/`manual`/`restock`), order_id, user_id |
| `notifications_log` | channel, recipient, template, order_id, status, error, attempts |
| `admin_users` | email, name, role (`owner`/`staff`), password_hash (nếu dùng), 2fa_secret, is_active, last_login |
| `audit_log` | user_id, action, entity, entity_id, before/after, created_at |
| `settings` | key/value: ship_hcm, ship_other, bank_info, payment_timeout_hours, return_window_days, low_stock_threshold, pickup_address, shop_contact, notification_channels, policy_texts |
| `back_in_stock_requests` | variant_id, contact, created_at (chỉ khi FR-C-10 được duyệt) |

**Ràng buộc quan trọng:** snapshot tên/giá vào `order_items` (đổi giá sau không ảnh hưởng đơn cũ); `stock_qty ≥ 0`; mọi thay đổi tồn kho đi qua transaction + ghi `stock_movements`.

### 8.2 Lưu trữ dữ liệu khách
- Dữ liệu cá nhân: họ tên, SĐT, email, địa chỉ → chỉ phục vụ xử lý đơn, giao hàng, chăm sóc khách.
- Mã hóa khi truyền (HTTPS); hạn chế quyền xem theo vai trò; không đưa dữ liệu khách vào log công khai.
- **Thời gian lưu (D24): 1 tháng.** Mặc định triển khai: **30 ngày sau khi đơn kết thúc** (hoàn thành/hủy/hoàn tiền xong), tự ẩn danh hóa họ tên, SĐT, email, địa chỉ, ghi chú và payload giao dịch ngân hàng của đơn; **giữ lại dữ liệu không định danh** (sản phẩm, số tiền, tỉnh/thành, nguồn, thời gian) cho báo cáo. Có trường `anonymized_at`; tác vụ chạy định kỳ.
- **Mâu thuẫn cần Trung xác nhận (Q-19b):** quy tắc này làm mất lịch sử khách/"khách quay lại" (FR-A-30…33, FR-A-54) và có thể ảnh hưởng nghĩa vụ lưu chứng từ/thuế `[Cần xác minh]`. Nếu Trung muốn giữ hồ sơ khách lâu hơn thì đổi thành "giữ đến khi khách yêu cầu xóa" (cấu hình, không cần code lại).
- Không bán/chia sẻ dữ liệu khách cho bên thứ ba ngoài những bên cần để vận hành (đơn vị vận chuyển, dịch vụ email…) — phải nêu trong Chính sách bảo mật.

### 8.3 Pháp lý cần xác minh (không phải tư vấn pháp lý)
Mình không phải luật sư; các mục dưới đây **cần Trung/chuyên gia xác minh**:

| Vấn đề | Ghi chú |
|---|---|
| Thông báo/đăng ký website thương mại điện tử với Bộ Công Thương | Theo mình biết, website bán hàng có thể phải thông báo/đăng ký theo quy định về thương mại điện tử (vd Nghị định 52/2013/NĐ-CP và văn bản sửa đổi) — `[Cần xác minh điều kiện áp dụng, thủ tục, phí]`. Trung xác nhận shop hoạt động **dưới hình thức cá nhân** (D23): cần xác minh nghĩa vụ đăng ký/thông báo website, nghĩa vụ thuế của cá nhân bán hàng online, và việc nhận tiền bán hàng vào tài khoản cá nhân (Techcombank) — hỏi cơ quan thuế/Bộ Công Thương/ngân hàng |
| Bảo vệ dữ liệu cá nhân | Theo mình biết có Nghị định 13/2023/NĐ-CP và luật về bảo vệ dữ liệu cá nhân mới có hiệu lực từ 2026 — `[Cần xác minh nghĩa vụ cụ thể: thông báo, đồng ý, quyền của khách]` |
| Thông tin bắt buộc hiển thị trên website (tên/địa chỉ chủ shop, liên hệ, chính sách…) | `[Cần xác minh]` |
| Thuế/hóa đơn khi bán online | Ngoài phạm vi SRS; `[Cần xác minh]` với kế toán/cơ quan thuế |
| Quy định về hàng hóa (squishy là đồ chơi): nhãn, an toàn cho trẻ em | `[Cần xác minh]` |

### 8.4 Nội dung mẫu để Trung duyệt
*(Chỗ có ngoặc vuông `[...]` là Trung phải điền/quyết định. Đây là bản nháp, cần Trung (và nếu có thể, người am hiểu pháp lý) duyệt.)*

**A. Chính sách đổi trả (bản nháp)**
1. Chocomino chấp nhận đổi/trả khi: sản phẩm bị lỗi từ shop, giao sai mẫu/sai số lượng, hư hỏng do vận chuyển.
2. Thời hạn gửi yêu cầu: trong vòng **3 ngày** kể từ khi đơn được xác nhận hoàn thành, qua trang Tra cứu đơn hàng trên website.
3. Khách cần cung cấp: lý do, mô tả, **ảnh** sản phẩm/bao bì và **video khui hàng (bắt buộc)** quay liên tục từ lúc mở kiện hàng.
4. Sản phẩm trả về phải còn nguyên trạng, chưa qua sử dụng, [còn đầy đủ phụ kiện/tem].
5. Không áp dụng đổi/trả với: đổi ý/không thích **[Trung quyết định]**; hàng pre-order đã đặt **[Trung quyết định]**; hàng hư hỏng do khách sử dụng.
6. Hoàn tiền: về hình thức khách đã thanh toán, trong **[X] ngày làm việc** sau khi shop nhận lại hàng và kiểm tra. **Phí vận chuyển hoàn/đổi do shop chịu** (D14).
7. Shop phản hồi yêu cầu trong **[X] giờ/ngày**.
8. Pre-order: nếu shop không nhập được hàng, shop hủy đơn và hoàn **100%** số tiền đã thanh toán.

**B. Điều khoản sử dụng (bản nháp, rút gọn)**
1. Thông tin shop: **[Tên pháp lý/chủ shop, địa chỉ, SĐT, email]**.
2. Giá và tình trạng hàng có thể thay đổi; đơn chỉ được xác nhận khi shop xác nhận (hoặc khi đã nhận thanh toán, tùy cấu hình).
3. Khách cam kết cung cấp thông tin giao hàng chính xác; shop không chịu trách nhiệm khi giao sai do thông tin sai.
4. Hình ảnh sản phẩm mang tính minh họa, có thể sai khác nhỏ về màu sắc do màn hình.
5. Quy định hủy đơn: khách có thể tự hủy khi đơn còn ở trạng thái Mới và chưa thanh toán; các trường hợp khác liên hệ shop.
6. Pre-order: thời gian hàng về là dự kiến, có thể thay đổi.
7. Quyền sở hữu nội dung (ảnh/mô tả) thuộc chocomino; không sao chép khi chưa được phép.
8. Luật áp dụng: pháp luật Việt Nam; giải quyết tranh chấp: **[thương lượng/tòa án có thẩm quyền]**.

**C. Chính sách bảo mật (bản nháp, rút gọn)**
1. Dữ liệu thu thập: họ tên, SĐT, email, địa chỉ giao hàng, nội dung ghi chú, dữ liệu kỹ thuật cơ bản (loại thiết bị, trang đã xem, nguồn truy cập nếu có).
2. Mục đích: xử lý và giao đơn, thông báo tình trạng đơn, chăm sóc/đổi trả, thống kê vận hành. **[Chỉ gửi email quảng cáo nếu khách đồng ý riêng — nếu Trung muốn.]**
3. Chia sẻ: chỉ với bên cần thiết để thực hiện đơn (đơn vị vận chuyển SPX, dịch vụ gửi email, dịch vụ xác nhận thanh toán); không bán dữ liệu.
4. Lưu trữ và bảo mật: biện pháp kỹ thuật (HTTPS, phân quyền); thời gian lưu **[X]**.
5. Quyền của khách: yêu cầu xem, sửa, xóa dữ liệu qua **[email/liên hệ]**.
6. Cookie/công nghệ theo dõi: nêu rõ nếu dùng pixel/analytics (xem 9.3).
7. Liên hệ giải đáp: **[thông tin liên hệ]**.

---

## 9. Giải thích đơn giản các mục Trung chưa rõ

### 9.1 Tên miền riêng (vd `chocomino.vn`)
- **Là gì:** địa chỉ website của riêng shop, thay vì địa chỉ kiểu `chocomino.vercel.app`.
- **Lợi ích:** nhìn tin cậy hơn khi khách chuyển khoản; dễ nhớ, dễ gõ vào bio; **giúp email của shop không rơi vào spam** (cần cho gửi email đơn hàng); đổi nhà cung cấp hosting sau này mà địa chỉ không đổi.
- **Chi phí:** trả theo năm cho nhà đăng ký; mức giá phụ thuộc đuôi tên miền (`.com`, `.vn`, `.id.vn`…) `[Cần xác minh giá thực tế]`. Tên miền thường chiếm phần đáng kể của ngân sách 500k nếu chọn đuôi đắt.
- **Quyết định (D20): không mua tên miền riêng ở bản đầu**; dùng địa chỉ miễn phí của nền tảng. Hệ quả: địa chỉ ít "chuyên nghiệp" hơn, email gửi đơn khó cấu hình/dễ vào spam (xem 7.3), khi muốn đổi sang tên miền riêng sau này thì link cũ cần chuyển hướng. Vì ngân sách là 500k/**tháng**, mình đề nghị Trung cân nhắc lại (Q-31).

### 9.2 SEO (để Google tìm thấy web)
- **Là gì:** làm cho Google hiển thị web của shop khi người ta tìm "squishy …".
- **Làm gì:** tiêu đề/mô tả từng trang, URL dễ đọc, ảnh nhẹ có `alt`, trang tải nhanh, sơ đồ trang (`sitemap`), dữ liệu cấu trúc sản phẩm (schema).
- **Lợi ích:** khách tìm thấy shop không cần quảng cáo, miễn phí về lâu dài. Nhưng cần thời gian (tuần–tháng) và web mới ít có thứ hạng ngay.
- **Chi phí:** 0đ (chủ yếu là công làm đúng).
- **Có nên làm ở bản đầu?** **Nên làm phần cơ bản** (rẻ, làm một lần, Antigravity tự làm được): tốc độ tải (NFR-02), thẻ title/description, Open Graph, sitemap, robots. Chiến dịch SEO sâu (viết blog…) để sau.

### 9.3 Pixel quảng cáo (Facebook/TikTok)
- **Là gì:** đoạn mã nhỏ gắn vào web để Facebook/TikTok biết khách đã xem sản phẩm/đặt hàng, rồi nhắm quảng cáo đúng người (vd người đã xem nhưng chưa mua).
- **Lợi ích:** chỉ có giá trị khi Trung **chạy quảng cáo trả phí**; giúp đo hiệu quả quảng cáo.
- **Chi phí:** pixel miễn phí, nhưng tiền quảng cáo là chi phí riêng.
- **Lưu ý:** thu thập hành vi khách → phải nêu trong Chính sách bảo mật và có thể cần banner đồng ý cookie `[Cần xác minh quy định]`; làm chậm web một chút nếu cài tùy tiện.
- **Có nên làm ở bản đầu?** **Chưa cần**, trừ khi Trung đã chắc chắn chạy ads ngay khi ra mắt. Trung xác nhận **không chạy quảng cáo** (D25) → không làm pixel.

---

## 10. Kế hoạch triển khai (kịp tháng 11/2026)

Hôm nay là 21/10/2026, còn khoảng 5–6 tuần đến hết tháng 11 → lịch chặt, cần Trung trả lời nhanh các câu ở mục 13.1b.

| Giai đoạn | Thời gian đề xuất | Nội dung | Điều kiện hoàn thành |
|---|---|---|---|
| **G0. Chốt quyết định** | 21–27/10 | Trung duyệt SRS, trả lời các câu mở ở mục 13.1, chọn stack/hosting/email/thanh toán/font/logo; xác minh SePay với Techcombank cá nhân (hoặc dịch vụ thay thế); thử tải 1 file Excel mẫu lên SPX; Trung bắt đầu chụp ảnh + chuẩn bị dữ liệu sản phẩm | Có danh sách quyết định đã chốt |
| **G1. MVP lõi** | 28/10–10/11 | Hạ tầng + CI/CD + staging; sản phẩm/biến thể/trạng thái; giỏ hàng; checkout COD; phí ship; đơn + admin quản lý đơn; đăng nhập admin + phân quyền; email xác nhận + đổi trạng thái | Đặt được đơn COD end-to-end trên staging |
| **G2. Thanh toán + vận hành** | 11–17/11 | Chuyển khoản QR + webhook + đối soát; tra cứu đơn; pre-order; hoàn trả (cả hai ghi chú); mã vận đơn nhập tay + in phiếu; thông báo đơn mới (email + Telegram nếu duyệt) | Luồng QR tự xác nhận chạy trên tiền thật nhỏ |
| **G3. Hoàn thiện + kiểm thử** | 18–24/11 | Giao diện hồng cute hoàn chỉnh; báo cáo cơ bản; SEO cơ bản; sao lưu + thử khôi phục; kiểm thử trên in-app browser; nhập đủ sản phẩm; chính sách đã duyệt | Đạt checklist nghiệm thu mục 12 |
| **G4. Ra mắt mềm** | 25–30/11 | Chạy thử trên địa chỉ miễn phí của Vercel (D20) với vài khách quen/đơn thật; sửa lỗi; thông báo ra mắt | Nhận đơn thật ổn định ≥ vài ngày |
| **G5. Nâng cấp (sau 11/2026)** | Sau ra mắt | API SPX cấp 2, Zalo OA, nhập CSV hàng loạt, "báo khi có hàng", miễn ship theo ngưỡng, báo cáo nâng cao, pixel | — |

**Mốc MVP bắt buộc để ra mắt:** FR-C-01…07, 11…15, 20…31, 40…44, 50…53, 60…64, 70…72, 77; FR-A-01…07, 10…16, 18, 20…21, 30…32, 40…41, 44…46, 50…51, 60…61, 70, 74; INT-01, INT-03; NFR-01…12, 15, 16.

---

## 11. Phạm vi KHÔNG làm ở bản đầu (out of scope — đề xuất, Trung duyệt)

| # | Hạng mục | Lý do |
|---|---|---|
| O-1 | Tài khoản khách / đăng nhập / điểm thưởng | Yêu cầu gốc: không cần đăng ký |
| O-2 | Thanh toán thẻ/ví điện tử (Momo, ZaloPay, thẻ quốc tế) | Ngoài yêu cầu; thêm phí + thủ tục |
| O-3 | Mã giảm giá / voucher / flash sale | Ngoài yêu cầu; có thể thêm sau |
| O-4 | Đa ngôn ngữ, giao quốc tế | Chỉ bán trong Việt Nam |
| O-5 | Đánh giá/bình luận sản phẩm của khách | Cần kiểm duyệt, ngoài yêu cầu |
| O-6 | Ứng dụng di động riêng (app store) | Web mobile-first là đủ |
| O-7 | Đồng bộ với sàn TMĐT (Shopee/TikTok Shop) hoặc kho ngoài | Dự án độc lập |
| O-8 | Chatbot/AI trả lời tự động trên web | Ngoài phạm vi |
| O-9 | Tích hợp nhiều hãng vận chuyển (chỉ SPX) | Ngoài yêu cầu |
| O-10 | Marketing tự động (email quảng cáo hàng loạt), blog | Giai đoạn sau |
| O-11 | Hóa đơn điện tử, kế toán | Ngoài phạm vi |
| O-12 | Zalo OA/ZNS, pixel quảng cáo; API SPX (không khả dụng, D7) | Có thiết kế sẵn chỗ gắn, làm ở G5 nếu điều kiện cho phép |

---

## 12. Tiêu chí nghiệm thu và checklist kiểm thử

### 12.1 Khách: duyệt sản phẩm + giỏ hàng

| Kiểm thử | Kết quả mong đợi |
|---|---|
| Mở trang chủ trên điện thoại 360px | Không cuộn ngang, ảnh tải nhanh, bố cục đúng |
| Mở chi tiết sản phẩm có 3 biến thể | Đổi biến thể → đổi giá, ảnh (nếu có), trạng thái |
| Biến thể "Hết hàng" | Nút mua bị vô hiệu |
| Biến thể "Pre-order" | Hiện ngày dự kiến + cảnh báo |
| Thêm vào giỏ, tải lại trang | Giỏ vẫn còn |
| Admin đổi giá khi khách đang có giỏ | Vào thanh toán thấy cảnh báo + giá mới |
| Số lượng > tồn kho | Bị chặn, báo rõ |
| Tìm "bánh" / "banh" (không dấu) | Kết quả hợp lý |

### 12.2 Khách: checkout + phí ship

| Kiểm thử | Kết quả mong đợi |
|---|---|
| Bỏ trống trường bắt buộc | Báo lỗi tiếng Việt tại ô |
| SĐT sai định dạng (`123`) | Chặn |
| Địa chỉ trong TP.HCM | Ship = 18.000đ (theo định nghĩa đã chốt ở Q-01) |
| Địa chỉ ngoài TP.HCM | Ship = 22.000đ |
| Đổi tỉnh sau khi đã chọn | Phí cập nhật ngay |
| Bấm "Đặt hàng" 2 lần liên tiếp | Chỉ tạo 1 đơn |
| Cùng lúc 2 khách mua món chỉ còn 1 | Chỉ 1 đơn thành công, đơn kia báo hết hàng |
| Admin đổi phí ship trong cài đặt | Đơn mới áp dụng, đơn cũ không đổi |

### 12.3 Thanh toán

| Kiểm thử | Kết quả mong đợi |
|---|---|
| Đặt COD | Đơn `new`, thanh toán `unpaid`, có email xác nhận |
| Đặt QR | Hiện QR đúng số tiền + nội dung = mã đơn |
| Chuyển đúng tiền + đúng nội dung (giả lập hoặc tiền thật nhỏ) | ≤ 1 phút: đơn `paid`, trang QR đổi "thành công", email gửi, shop được báo |
| Gửi lại cùng webhook 2 lần | Không xử lý lần 2 |
| Chuyển thiếu/thừa tiền | `needs_review`, không tự xác nhận, shop được báo |
| Chuyển sai nội dung | Không khớp đơn, vào danh sách "giao dịch chưa khớp" |
| Webhook giả (sai chữ ký) | Bị từ chối |
| Tắt endpoint vài phút rồi bật + cron đối soát | Giao dịch bị lỡ được bổ sung |
| Không thanh toán sau N giờ | Đơn tự hủy, tồn kho trả lại, email báo |
| Admin xác nhận thủ công | Đơn `paid`, ghi lịch sử |

### 12.4 Tra cứu đơn

| Kiểm thử | Kết quả mong đợi |
|---|---|
| Mã đơn + SĐT đúng | Hiện timeline + chi tiết (đã che bớt) |
| Sai SĐT / sai mã | Thông báo chung, không lộ đơn tồn tại |
| Thử sai > 5 lần | Bị khóa tạm thời |
| Đơn có mã vận đơn | Hiện mã + link theo dõi |

### 12.5 Pre-order / hết hàng

| Kiểm thử | Kết quả mong đợi |
|---|---|
| Đặt pre-order | Đơn gắn cờ, trạng thái "Chờ hàng về" sau xác nhận, email nêu rõ |
| Giỏ trộn hàng sẵn + pre-order | Hành xử đúng phương án đã chốt ở P1 |
| Admin bấm "Hàng đã về" | Các đơn liên quan chuyển xử lý, khách nhận email |
| Pre-order không nhập được hàng, shop hủy | Có lý do, hoàn tiền nếu đã trả, email báo |

### 12.6 Hoàn trả (quyết định D2)

| Kiểm thử | Kết quả mong đợi |
|---|---|
| Khách gửi yêu cầu hoàn (đơn đã hoàn thành, trong hạn) | Lưu `customer_reason` + ảnh; trạng thái `return_requested`; shop được báo kèm lý do |
| Đơn quá hạn / chưa hoàn thành | Không cho gửi |
| Shop từ chối không ghi chú | Bị chặn (bắt buộc ghi chú) |
| Shop duyệt + ghi chú | Lưu `shop_note`; khách nhận email có ghi chú |
| Hoàn tất hoàn tiền | Trạng thái `refunded`, thanh toán `refunded` |

### 12.7 Admin: sản phẩm + đơn + vận chuyển

| Kiểm thử | Kết quả mong đợi |
|---|---|
| Tạo sản phẩm 3 biến thể + 5 ảnh + 1 video | Hiển thị đúng ngoài web; ảnh được nén |
| Chỉnh tồn kho +/− | Ghi lịch sử kho; hết → "Hết hàng" |
| Đổi trạng thái sai thứ tự (vd "mới" → "hoàn thành") | Bị chặn |
| Hủy đơn không lý do | Bị chặn; có lý do → tồn kho trả, email báo |
| Nhập mã vận đơn + chuyển "Giao" | Khách nhận email có mã vận đơn |
| In phiếu A5 và 100×150mm | Đúng khổ, đủ thông tin, **tiền COD đúng** (0 nếu đã thanh toán) |
| In hàng loạt 5 đơn | Mỗi đơn 1 phiếu |
| Lịch sử trạng thái | Ghi đúng người, đúng giờ |

### 12.8 Phân quyền + đăng nhập + thông báo

| Kiểm thử | Kết quả mong đợi |
|---|---|
| Staff vào trang báo cáo doanh thu (gõ thẳng URL) | Bị từ chối (kiểm tra ở server) |
| Staff gọi API sửa giá | Bị từ chối |
| Đăng nhập sai nhiều lần | Bị giới hạn |
| Phiên hết hạn | Phải đăng nhập lại |
| Đơn mới | Shop nhận email (và Telegram nếu bật) trong ≤ 1 phút, đủ trường theo FR-A-20 |
| Dịch vụ email lỗi | Đơn vẫn tạo được; có log + thử lại |
| Vô hiệu hóa 1 nhân viên | Không đăng nhập được |

### 12.9 Phi chức năng

| Kiểm thử | Kết quả mong đợi |
|---|---|
| Lighthouse mobile (trang chủ, chi tiết) | Hiệu năng/trải nghiệm đạt mức "tốt" đã thống nhất; LCP ≤ 2,5s |
| Mở web trong in-app browser Facebook, Instagram, TikTok, Threads, Zalo | Hiển thị + đặt đơn bình thường; QR hiển thị đúng; link sao chép số tài khoản dùng được |
| Test tải: 10 đơn trong 5 phút | Không lỗi, không bán lố |
| Sao lưu + khôi phục thử | Khôi phục được dữ liệu tới thời điểm sao lưu |
| Quét bảo mật cơ bản (header, XSS, CSRF) | Không có lỗi nghiêm trọng |
| Xem mã nguồn/repo | Không có khóa bí mật bị lộ |
| Bàn giao | Có README, `.env.example`, RUNBOOK, test chạy xanh |

### 12.10 Điều kiện ra mắt (Go/No-Go)
- Toàn bộ mục **Bắt buộc** thuộc MVP qua kiểm thử.
- Ít nhất **3 đơn thật** end-to-end (COD, QR, pre-order) thành công.
- Chính sách đổi trả, điều khoản, bảo mật đã được Trung duyệt và đăng.
- Đã thử khôi phục sao lưu thành công.
- Email xác nhận gửi được tới hộp thư Gmail/Outlook thật (kiểm tra cả mục spam) với cấu hình đã chọn; 1 file Excel SPX xuất ra tải lên spx.vn thành công.

---

## 13. Câu hỏi còn mở và rủi ro

### 13.1 Quyết định đã chốt
Q-01 → Q-24 đã được Trung trả lời; xem bảng D1–D26 ở mục 0.

### 13.1b Câu hỏi mới / còn mở

| # | Câu hỏi | Ảnh hưởng |
|---|---|---|
| Q-08b | Giỏ trộn hàng sẵn + pre-order: **giao 1 lần khi đủ hàng** (B) hay **tách giao 2 lần** (C; phí ship tính thế nào)? | 2.7, FR-A-18 |
| Q-10b | Hết hạn QR **5 phút** là đúng ý Trung? Khách chuyển app ngân hàng thường mất lâu hơn. Đề xuất: giữ 5 phút + nút gia hạn 1 lần (FR-C-47), hoặc tăng lên 15–30 phút | FR-C-43 |
| Q-19b | "Lưu dữ liệu khách 1 tháng" = ẩn danh hóa **30 ngày sau khi đơn kết thúc** (mất lịch sử khách quay lại)? Hay giữ hồ sơ khách đến khi khách yêu cầu xóa? | 8.2, FR-A-30…33 |
| Q-22b | Trung duyệt cờ `in_old_hcm` cho 168 phường/xã của "Thành phố Hồ Chí Minh"; khách khu Bình Dương cũ (vd Dĩ An, nơi đặt shop) trả 22.000đ, đúng ý? | FR-C-30 |
| Q-25 | Giá trị mặc định các cột SPX: Giao hàng một phần, Cho phép thử hàng, Cho xem hàng không cho thử, Phí từ chối nhận, Bưu gửi giá trị cao, Hình thức thanh toán phí ship (shop trả = "Người gửi trả"?) | FR-A-44, 46 |
| Q-26 | Sau khi tải file lên SPX, Trung lấy mã vận đơn bằng cách nào (file kết quả tải về, hay xem trên web)? Gửi giúp 1 file/ảnh mẫu để làm tính năng import | FR-A-45 |
| Q-27 | Hạn đổi trả 3 ngày tính từ lúc nào: khi shop bấm "Hoàn thành" (vì không có API để biết ngày giao thật)? | FR-C-61 |
| Q-28 | Video khui hàng thường > 5MB: cho khách tải lên mức lớn hơn (vd 20–30MB), dán link (Drive/YouTube), hay vẫn 5MB? | FR-C-60 |
| Q-29 | Cân nặng mỗi sản phẩm (kg, SPX bắt buộc): Trung nhập từng sản phẩm hay dùng 1 mức mặc định (vd 0,2kg/món)? | FR-A-02, 44 |
| Q-30 | Techcombank cá nhân + SePay: Trung đã đăng ký SMS Banking/thông báo biến động số dư chưa? Chấp nhận có thể phát sinh phí ngân hàng? | INT-01 |
| Q-31 | Không mua tên miền: Trung có Gmail riêng của shop để gửi email đơn, hay muốn xem lại việc mua tên miền? | INT-03, 9.1 |
| Q-32 | Số điện thoại shop (cập nhật sau), email liên hệ, tên hiển thị người gửi trên SPX | FR-A-46, phiếu in |
| Q-33 | Nhập 50–100 sản phẩm: Trung muốn nhập CSV (FR-A-08) hay từng sản phẩm trong admin? | G3 |

### 13.2 Rủi ro

| # | Rủi ro | Mức | Giảm thiểu |
|---|---|---|---|
| R-01 | Thời gian rất sát (≈ 5–6 tuần) và nhiều quyết định chưa chốt | Cao | Chốt G0 trong tuần đầu; giữ MVP gọn; cắt `Nên có`/`Tùy chọn` nếu trễ |
| R-02 | Dịch vụ xác nhận chuyển khoản: phí/giới hạn/ngân hàng chưa xác minh | Cao | Xác minh sớm ở G0; giữ phương án xác nhận tay (FR-A-16) |
| R-03 | Mẫu Excel SPX thay đổi cột/định dạng, hoặc tải lên bị lỗi do địa chỉ/SĐT sai định dạng | Trung bình | Cột map nằm trong cấu hình, dễ cập nhật; kiểm tra dữ liệu trước khi xuất; bản xem trước khi import mã vận đơn |
| R-04 | Điều khoản free-tier của hosting (dùng thương mại, tạm dừng khi ít hoạt động) | Cao | Xác minh điều khoản trước khi chọn; thử "tỉnh dậy" khi ít truy cập |
| R-05 | Danh mục địa chỉ hành chính thay đổi (sáp nhập tỉnh/phường) → sai phí ship/địa chỉ | Trung bình | Chốt định nghĩa (Q-01); dùng nguồn danh mục chính thống, có thể cập nhật |
| R-06 | Email vào spam, khách không nhận được xác nhận/QR | Trung bình | Dùng tên miền + SPF/DKIM; luôn có trang tra cứu + hiển thị QR ngay sau đặt |
| R-07 | Bán lố khi nhiều người mua cùng lúc (livestream/viral) | Trung bình | Transaction + khóa tồn kho; test tải |
| R-08 | Webhook mất/trùng → xác nhận sai | Trung bình | INT-01a…d (xác thực, chống trùng, đối soát) |
| R-09 | In-app browser (Facebook/TikTok…) có hạn chế (lưu giỏ, sao chép, mở app ngân hàng) | Trung bình | Kiểm thử sớm; nút "Mở bằng trình duyệt" nếu cần |
| R-10 | Lộ dữ liệu khách / tài khoản admin bị xâm nhập | Cao | 2FA, phân quyền, rate limit, audit log, sao lưu |
| R-11 | Quy định pháp lý TMĐT/dữ liệu cá nhân chưa rõ | Trung bình | Xác minh (8.3); có thể hỏi người am hiểu |
| R-12 | Antigravity phụ thuộc duy nhất 1 "người" bảo trì | Trung bình | NFR-15 (tài liệu, test, runbook, repo Git); Trung giữ quyền sở hữu tài khoản hosting/tên miền/repo |
| R-13 | Phí ship thực tế SPX cao hơn phí thu khách (18k/22k) → lỗ | Thấp–TB | Trung theo dõi; có thể đổi trong cài đặt |
| R-14 | Ảnh/video nặng làm chậm web, vượt hạn mức lưu trữ free | Trung bình | Tự nén ảnh, giới hạn video, nhúng video ngoài |
| R-15 | Bom hàng COD / pre-order | Trung bình | Pre-order chỉ QR trả đủ (D13); cảnh báo khách có tiền sử (FR-A-33) |
| R-16 | QR hết hạn chỉ 5 phút (D15): khách chuyển sang app ngân hàng/in-app browser chậm → đơn bị hủy, tiền về muộn | Cao | FR-C-46, FR-C-47; đồng hồ đếm ngược rõ; Q-10b |
| R-17 | Không có tên miền → email gửi đơn dễ vào spam / khó cấu hình | Trung bình | 7.3, Q-31; trang tra cứu thay email |
| R-18 | Techcombank cá nhân có thể phải kết nối SePay qua SMS Banking → trễ/mất giao dịch | Cao | Đối soát + xác nhận tay; xác minh sớm; Q-30 |
| R-19 | Xóa dữ liệu khách sau 1 tháng làm mất lịch sử khách/báo cáo và có thể vướng nghĩa vụ lưu chứng từ | Trung bình | Giữ dữ liệu không định danh; xác nhận Q-19b; hỏi thuế |
| R-20 | Video khui hàng thường > 5MB, khó tải lên | Trung bình | Q-28: nâng giới hạn riêng cho video hoàn trả hoặc cho dán link |
| R-21 | Cờ `in_old_hcm` gắn sai → tính sai phí ship | Trung bình | Trung duyệt 168 dòng trước ra mắt (Q-22b) |

---

## 14. Tóm tắt

**Đã làm (v0.3):**
- Đưa toàn bộ trả lời Q-01 → Q-24 vào SRS (bảng D1–D26 ở mục 0), duyệt tất cả `[Đề xuất thêm]` và xếp lịch.
- Đọc file Excel mẫu SPX: có mapping từng cột (mục 3.5b), quy tắc xuất file, và danh mục địa chỉ 2 cấp (34 tỉnh/thành, ~3.321 phường/xã) để dùng cho form địa chỉ.
- Cập nhật phí ship (TP.HCM cũ), Supabase + Vercel, QR hết hạn 5 phút, đổi trả 3 ngày + video khui hàng, đăng nhập user/password, Telegram, font/logo, bỏ pixel, giữ dữ liệu 1 tháng.

**Còn thiếu / cần xác minh:**
- 13 câu mới ở mục 13.1b. Quan trọng nhất: **Q-10b** (5 phút QR quá ngắn?), **Q-19b** (1 tháng làm mất lịch sử khách), **Q-30** (SePay với Techcombank cá nhân), **Q-22b** (duyệt cờ TP.HCM cũ cho 168 phường/xã), **Q-26** (mã vận đơn lấy về từ SPX thế nào).
- Chưa xác minh: giá/điều khoản Vercel Pro và Supabase, phí SePay/Casso, giới hạn email khi không có tên miền, nghĩa vụ pháp lý/thuế của cá nhân bán online.
- Chính sách đổi trả/điều khoản/bảo mật còn chỗ `[...]` cần Trung điền.

**Bước tiếp theo:**
1. Trung trả lời nhóm câu quan trọng ở trên và các câu Q-25, Q-29.
2. Giao Antigravity xác minh: SePay + Techcombank cá nhân, gói Vercel/Supabase trong 500k/tháng, thử tải 1 file Excel mẫu lên SPX.
3. Chốt để có SRS v1.0 và bắt đầu G1 (MVP) theo lịch mục 10.

> ⚠️ Dữ liệu khách (tên, SĐT, địa chỉ) là dữ liệu cá nhân — Telegram nhóm shop chỉ nên có người cần xử lý đơn; Trung nên là người **sở hữu** tài khoản Vercel, Supabase, Telegram bot và repo mã nguồn.
