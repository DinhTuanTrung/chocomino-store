import { test, expect } from '@playwright/test';

test.describe('APPSEC & PENETRATION TESTING SUITE (ZERO-TRUST)', () => {
  test('SEC-01: Chống can thiệp giá (Price Tampering) tại tầng API Checkout', async ({ request }) => {
    // Kẻ tấn công cố gắng gửi payload với giá chỉ 1.000đ cho sản phẩm thực tế 45.000đ
    const maliciousPayload = {
      items: [
        {
          productId: 'p1',
          variantId: '0c57173b-eb63-4720-9a3b-cbb1b1c6053e',
          quantity: 1,
          price: 1000, // Cố tình hạ giá từ 45.000đ xuống 1.000đ
        },
      ],
      customerName: 'Hacker Thử Sửa Giá',
      phone: '0909998877',
      addressProvince: 'Thành phố Hồ Chí Minh',
      addressWard: 'Phường Bến Nghé',
      addressDetail: '123 Đường Hacker',
      paymentMethod: 'cod',
      shippingFee: 18000,
      total: 19000, // Client tự tính 1000 + 18000 = 19000
    };

    const response = await request.post('/api/checkout', {
      data: maliciousPayload,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Kỳ vọng bảo mật:
    // 1. Nếu API chấp nhận, tổng tiền (total) trong response BẮT BUỘC phải được tính lại từ database (ít nhất >= 45.000 + 18.000 = 63.000đ)
    // 2. Hoặc API từ chối với mã 400 Bad Request
    const data = await response.json();
    if (response.ok() && data.success && data.order) {
      expect(data.order.total).toBeGreaterThanOrEqual(63000);
      expect(data.order.subtotal).toBeGreaterThanOrEqual(45000);
    } else {
      expect([400, 422]).toContain(response.status());
    }
  });

  test('SEC-02: Chống Stored XSS trong thông tin khách hàng và memo đơn hàng', async ({ request, page }) => {
    const xssPayload = `<img src=x onerror="window.__xss_executed=true">`;

    // 1. Tạo đơn hàng chứa payload XSS qua API Checkout
    const res = await request.post('/api/checkout', {
      data: {
        items: [
          {
            productId: 'p1',
            productName: 'Squishy Bánh Mì',
            variantId: '0c57173b-eb63-4720-9a3b-cbb1b1c6053e',
            variantName: 'Vị Socola',
            quantity: 1,
            price: 45000,
          },
        ],
        customerName: xssPayload,
        phone: '0987654321',
        province: 'Thành phố Hồ Chí Minh',
        ward: 'Phường Bến Nghé',
        addressDetail: 'Địa chỉ Test XSS',
        paymentMethod: 'cod',
      },
    });

    const data = await res.json();
    expect(res.ok()).toBeTruthy();
    expect(data.success).toBeTruthy();
    const orderCode = data.order.code;

    // 2. Mở trang đơn hàng thành công trên trình duyệt
    await page.goto(`/dat-hang-thanh-cong?code=${orderCode}&pm=cod`);

    // 3. Xác thực script XSS không bao giờ được thực thi
    const isXssTriggered = await page.evaluate(() => (window as any).__xss_executed === true);
    expect(isXssTriggered).toBeFalsy();

    // 4. Xác thực HTML được escape an toàn (dưới dạng text node hoặc encoded string)
    const rawHtml = await page.content();
    expect(rawHtml).not.toContain('<img src=x onerror=');
  });

  test('SEC-03: Bảo vệ phân hệ Admin (Authentication Bypass Prevention)', async ({ browser }) => {
    // Tạo phiên duyệt web hoàn toàn ẩn danh, không có cookie
    const incognitoContext = await browser.newContext();
    const guestPage = await incognitoContext.newPage();

    // Cố gắng truy cập trái phép trực tiếp vào các trang nhạy cảm
    await guestPage.goto('/admin/orders');
    // Bắt buộc phải bị đẩy về trang /admin/login
    await expect(guestPage).toHaveURL(/\/admin\/login/);

    await guestPage.goto('/admin/settings');
    await expect(guestPage).toHaveURL(/\/admin\/login/);

    await guestPage.goto('/admin/audit-logs');
    await expect(guestPage).toHaveURL(/\/admin\/login/);

    await incognitoContext.close();
  });

  test('SEC-04: Rà soát rò rỉ dữ liệu nhạy cảm trong Client Storage (PII & Secret Audit)', async ({ page }) => {
    await page.goto('/');

    const storageAudit = await page.evaluate(() => {
      const localKeys = Object.keys(localStorage);
      const sessionKeys = Object.keys(sessionStorage);

      const allValues = [
        ...localKeys.map((k) => localStorage.getItem(k) || ''),
        ...sessionKeys.map((k) => sessionStorage.getItem(k) || ''),
      ].join(' ');

      return {
        hasAdminPassword: allValues.includes('Chocomino2026!'),
        hasServiceRoleKey: allValues.includes('service_role'),
        hasSecretPattern: /sk_live|private_key|webhook_secret/i.test(allValues),
      };
    });

    expect(storageAudit.hasAdminPassword).toBeFalsy();
    expect(storageAudit.hasServiceRoleKey).toBeFalsy();
    expect(storageAudit.hasSecretPattern).toBeFalsy();
  });
});
