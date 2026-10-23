# CHOCOMINO STORE — E2E & LOAD TESTING SUITE
**Tiêu chuẩn**: Zero-Trust QA & Fintech Application Security  
**Phạm vi**: React Storefront, Luồng thanh toán VietQR (SePay), Phân hệ Admin, Race Conditions & Webhook Idempotency.

---

## 1. Cấu trúc thư mục

```
tests/
├── e2e/
│   ├── vietqr-checkout.spec.ts     # Playwright: Luồng đặt hàng VietQR, Countdown timer, 2-Tab sync, In phiếu A7
│   └── security-tampering.spec.ts  # Playwright: Sửa giá payload, Stored XSS, BOLA Admin route, Rò rỉ PII
├── load/
│   ├── k6-inventory-race-condition.js # K6: 50 Virtual Users tranh mua món hàng cuối cùng (Zero Overselling)
│   └── k6-webhook-replay-attack.js    # K6: 20 request phát lại trùng lặp webhook SePay (Idempotency check)
├── playwright.config.ts            # Cấu hình đa thiết bị (Desktop Chrome, Pixel 7)
└── README.md                       # Hướng dẫn thực thi
```

---

## 2. Hướng dẫn chạy Playwright E2E Tests

### Cài đặt trình duyệt (Lần đầu tiên):
```bash
npx playwright install chromium
```

### Chạy toàn bộ bài test:
```bash
# Chạy trên môi trường live mặc định (https://chocomino-store.vercel.app)
npx playwright test

# Chạy trên môi trường local (nếu đang chạy `npm run dev`)
$env:PLAYWRIGHT_BASE_URL="http://localhost:3000"; npx playwright test
```

### Chạy riêng từng bài kiểm thử:
```bash
# Test luồng VietQR và Admin:
npx playwright test tests/e2e/vietqr-checkout.spec.ts --headed

# Test bảo mật & Can thiệp giá (AppSec):
npx playwright test tests/e2e/security-tampering.spec.ts --headed
```

### Xem báo cáo chi tiết trực quan (HTML Report):
```bash
npx playwright show-report
```

---

## 3. Hướng dẫn chạy K6 Concurrency & Race Condition Load Tests

### Cài đặt K6 (nếu chưa có trên máy):
```powershell
# Cài đặt qua winget trên Windows:
winget install k6 --source winget
# Hoặc tải file thực thi độc lập từ https://k6.io
```

### Kịch bản 1: Kiểm thử Race Condition Khấu trừ Tồn kho (50 VUs tranh mua 1 món cuối)
```bash
k6 run tests/load/k6-inventory-race-condition.js
```
*Kỳ vọng*: Đúng 1 request ghi nhận thành công (`successful_orders`), 49 request còn lại bị từ chối với thông báo hết hàng. Tồn kho trong CSDL không bao giờ bị âm.

### Kịch bản 2: Kiểm thử Replay Attack Webhook (Bắn lại 20 webhook trùng lặp liên tiếp)
```bash
k6 run tests/load/k6-webhook-replay-attack.js
```
*Kỳ vọng*: Backend phản hồi `200 OK` cho tất cả các request, nhưng chỉ ghi nhận 1 giao dịch duy nhất trong CSDL. Không xảy ra hiện tượng trừ kho hay hoàn tất đơn 20 lần.
