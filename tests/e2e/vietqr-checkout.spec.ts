import { test, expect } from '@playwright/test';

test.describe('E2E VIETQR & CHECKOUT FLOW (ZERO-TRUST QA)', () => {
  const testCustomer = {
    name: 'Đặng Tuấn Anh (QA Automation)',
    phone: '0933112233',
    email: 'tuananh.qa@chocomino.local',
    address: 'Số 45 Đường Nguyễn Huệ, Phường Bến Nghé, Quận 1',
  };

  test('TC-01: Luồng đặt hàng VietQR, kiểm tra hiển thị mã QR và bộ đếm ngược', async ({ page }) => {
    // 1. Truy cập trang chi tiết sản phẩm
    await page.goto('/san-pham/squishy-banh-mi-nuong-bo-mem-min-choco');
    await expect(page.locator('h1')).toContainText('Squishy Bánh Mì Nướng Bơ Mềm Mịn Choco');

    // 2. Thêm vào giỏ hàng
    const addToCartBtn = page.locator('button:has-text("Thêm vào giỏ hàng")').first();
    await addToCartBtn.click();

    // 3. Chuyển sang Giỏ hàng
    await page.goto('/gio-hang');
    await expect(page.locator('h1')).toContainText('Giỏ hàng');
    await expect(page.getByText('Squishy Bánh Mì Nướng Bơ Mềm Mịn Choco')).toBeVisible();

    // 4. Tiến hành thanh toán
    const checkoutBtn = page.locator('a[href="/thanh-toan"]');
    await checkoutBtn.click();
    await expect(page).toHaveURL(/\/thanh-toan/);

    // 5. Điền thông tin giao hàng
    await page.fill('input[placeholder="Nguyễn Văn A"]', testCustomer.name);
    await page.fill('input[placeholder="0912345678"]', testCustomer.phone);
    await page.fill('input[placeholder="email@example.com"]', testCustomer.email);
    await page.fill('input[placeholder*="38/32 Đường Số 2"]', testCustomer.address);

    // 6. Chọn phương thức thanh toán VietQR
    const vietqrRadio = page.locator('input[value="bank_qr"]');
    await vietqrRadio.check();
    await expect(vietqrRadio).toBeChecked();

    // 7. Xác nhận Đặt hàng
    const submitBtn = page.locator('button:has-text("Xác nhận Đặt hàng")');
    await submitBtn.click();

    // 8. Chờ chuyển tiếp sang trang Đặt hàng thành công
    await page.waitForURL(/\/dat-hang-thanh-cong\?code=CM/, { timeout: 15000 });
    const currentUrl = page.url();
    const orderCodeMatch = currentUrl.match(/code=(CM[A-Z0-9]+)/);
    expect(orderCodeMatch).not.toBeNull();
    const orderCode = orderCodeMatch![1];

    // 9. Xác thực giao diện VietQR
    await expect(page.locator('h1')).toContainText('Đặt hàng thành công!');
    await expect(page.getByText(orderCode)).toBeVisible();

    // Kiểm tra thông tin thanh toán ngân hàng
    await expect(page.getByText('Quét mã VietQR')).toBeVisible();
    await expect(page.locator('img[alt*="VietQR"], img[src*="qr.sepay.vn"]')).toBeVisible();

    // Kiểm tra bộ đếm ngược countdown timer (VD: 14:59 hoặc 15:00)
    const timerElement = page.locator('span:has-text(":")').first();
    await expect(timerElement).toBeVisible();

    // Kiểm tra nút sao chép số tài khoản
    const copyAccountBtn = page.locator('button:has-text("Sao chép")').first();
    await expect(copyAccountBtn).toBeVisible();
  });

  test('TC-02: Đồng bộ hai tab: Khách đặt đơn -> Admin nhận đơn tức thì', async ({ browser }) => {
    const userContext = await browser.newContext();
    const adminContext = await browser.newContext();

    const userPage = await userContext.newPage();
    const adminPage = await adminContext.newPage();

    // A. Khách hàng tạo đơn COD nhanh
    await userPage.goto('/san-pham/squishy-meo-beo-banh-bao-cute');
    const addBtn = userPage.locator('button:has-text("Thêm vào giỏ hàng")').first();
    if (await addBtn.isVisible()) {
      await addBtn.click();
    }

    await userPage.goto('/thanh-toan');
    await userPage.fill('input[placeholder="Nguyễn Văn A"]', 'Nguyễn Đồng Bộ (Tab Sync)');
    await userPage.fill('input[placeholder="0912345678"]', '0911223344');
    await userPage.fill('input[placeholder*="38/32 Đường Số 2"]', '12 Lê Duẩn, Quận 1');
    await userPage.locator('input[value="cod"]').check();

    await userPage.locator('button:has-text("Xác nhận Đặt hàng")').click();
    await userPage.waitForURL(/\/dat-hang-thanh-cong\?code=CM/);
    const orderCode = userPage.url().match(/code=(CM[A-Z0-9]+)/)![1];

    // B. Quản trị viên đăng nhập và kiểm tra đơn
    await adminPage.goto('/admin/login');
    await adminPage.fill('input[type="email"]', 'admin@chocomino.local');
    await adminPage.fill('input[type="password"]', 'Chocomino2026!');
    await adminPage.locator('button:has-text("Đăng nhập hệ thống")').click();
    await adminPage.waitForURL(/\/admin\/orders/);

    // Xác thực đơn hàng xuất hiện ở đầu bảng
    await expect(adminPage.locator(`tr:has-text("${orderCode}")`)).toBeVisible({ timeout: 10000 });
    await expect(adminPage.locator(`tr:has-text("${orderCode}")`)).toContainText('Nguyễn Đồng Bộ (Tab Sync)');

    // C. Đóng context
    await userContext.close();
    await adminContext.close();
  });

  test('TC-03: Thao tác Admin: Chuyển trạng thái đơn và kiểm tra phiếu in nhiệt A7', async ({ page }) => {
    // 1. Đăng nhập Admin
    await page.goto('/admin/login');
    await page.fill('input[type="email"]', 'admin@chocomino.local');
    await page.fill('input[type="password"]', 'Chocomino2026!');
    await page.locator('button:has-text("Đăng nhập hệ thống")').click();
    await page.waitForURL(/\/admin\/orders/);

    // 2. Mở đơn hàng đầu tiên
    const firstDetailBtn = page.locator('button[title="Xem chi tiết đơn"]').first();
    await firstDetailBtn.click();

    // 3. Kiểm tra các nút nghiệp vụ
    const confirmBtn = page.locator('button:has-text("Xác nhận đơn")');
    if (await confirmBtn.isVisible()) {
      await confirmBtn.click();
      await page.waitForTimeout(1000);
    }

    // 4. Mở phiếu in giao hàng SPX
    const printBtn = page.locator('a[title="In phiếu gửi SPX"], a:has-text("In phiếu")').first();
    await printBtn.click();
    await page.waitForURL(/\/in-phieu/);

    // 5. Kiểm tra layout phiếu in khổ A7 (76×130mm)
    await expect(page.locator('body')).toContainText('Phiếu giao hàng TMĐT');
    await expect(page.locator('body')).toContainText('NGƯỜI GỬI:');
    await expect(page.locator('body')).toContainText('NGƯỜI NHẬN:');
    await expect(page.locator('body')).toContainText('TIỀN THU NGƯỜI NHẬN (COD)');
  });
});
