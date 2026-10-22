/**
 * Telegram Bot Notification Dispatcher (FR-A-71, FR-A-74)
 * Safely notifies shop owner about new orders, payments, and return requests.
 * If credentials are not configured, it fails gracefully without affecting order flow.
 */

export interface NewOrderNotificationPayload {
  code: string;
  customerName: string;
  phone: string;
  address: string;
  total: number;
  paymentMethod: 'cod' | 'bank_qr';
  isPreorder?: boolean;
  items: Array<{
    productName: string;
    variantName: string;
    quantity: number;
    price: number;
  }>;
  source?: string;
  note?: string;
}

export interface ReturnNotificationPayload {
  orderCode: string;
  phone: string;
  reason: string;
  videoProofUrl: string;
}

export interface CancelOrderNotificationPayload {
  code: string;
  customerName: string;
  phone: string;
  reason: string;
  total: number;
  cancelledBy: 'customer' | 'admin' | 'system';
}

export async function sendTelegramOrderNotification(payload: NewOrderNotificationPayload): Promise<boolean> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  if (!token || !chatId) {
    // Graceful skip if shop hasn't configured telegram bot yet
    return false;
  }

  try {
    const paymentLabel = payload.paymentMethod === 'cod' ? '💵 COD (Thu tiền khi nhận)' : '💳 Chuyển khoản VietQR';
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://chocomino-store.vercel.app';
    const adminUrl = `${baseUrl}/admin/orders`;

    const itemListText = payload.items
      .map((it) => `  • <b>${it.productName}</b> (${it.variantName}) × ${it.quantity} = ${(it.price * it.quantity).toLocaleString('vi-VN')}đ`)
      .join('\n');

    const message = [
      `🍫 <b>ĐƠN HÀNG MỚI CHOCOMINO!</b>`,
      `━━━━━━━━━━━━━━━━━━`,
      `📦 <b>Mã đơn:</b> <code>#${payload.code}</code> ${payload.isPreorder ? '⏳ <i>[Pre-order]</i>' : ''}`,
      `👤 <b>Khách hàng:</b> ${payload.customerName}`,
      `📞 <b>Số điện thoại:</b> ${payload.phone}`,
      `📍 <b>Địa chỉ:</b> ${payload.address}`,
      `💳 <b>Thanh toán:</b> ${paymentLabel}`,
      `💰 <b>Tổng thu:</b> <b>${payload.total.toLocaleString('vi-VN')}đ</b>`,
      `🌐 <b>Nguồn:</b> ${payload.source || 'Trực tiếp'}`,
      payload.note ? `📝 <b>Ghi chú:</b> <i>${payload.note}</i>` : '',
      `━━━━━━━━━━━━━━━━━━`,
      `🛍 <b>Sản phẩm:</b>\n${itemListText}`,
      `━━━━━━━━━━━━━━━━━━`,
      `👉 <a href="${adminUrl}">Mở Quản lý Đơn hàng</a>`,
    ]
      .filter(Boolean)
      .join('\n');

    const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: message,
        parse_mode: 'HTML',
        disable_web_page_preview: true,
      }),
    });

    if (!res.ok) {
      console.warn('[Telegram] Failed to send telegram message:', await res.text());
      return false;
    }
    return true;
  } catch (err) {
    // Non-blocking log as required by FR-A-74
    console.warn('[Telegram] Dispatch error (ignored for order flow):', err);
    return false;
  }
}

export async function sendTelegramReturnNotification(payload: ReturnNotificationPayload): Promise<boolean> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  if (!token || !chatId) {
    return false;
  }

  try {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://chocomino-store.vercel.app';
    const adminUrl = `${baseUrl}/admin/orders`;

    const message = [
      `⚠️ <b>YÊU CẦU ĐỔI TRẢ MỚI!</b>`,
      `━━━━━━━━━━━━━━━━━━`,
      `📦 <b>Mã đơn:</b> <code>#${payload.orderCode}</code>`,
      `📞 <b>SĐT khách:</b> ${payload.phone}`,
      `📝 <b>Lý do:</b> <i>${payload.reason}</i>`,
      `📹 <b>Video khui hàng:</b> <a href="${payload.videoProofUrl}">${payload.videoProofUrl}</a>`,
      `━━━━━━━━━━━━━━━━━━`,
      `👉 <a href="${adminUrl}">Xử lý trong Admin Đổi trả</a>`,
    ].join('\n');

    await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: message,
        parse_mode: 'HTML',
        disable_web_page_preview: true,
      }),
    });
    return true;
  } catch (err) {
    console.warn('[Telegram] Dispatch return error:', err);
    return false;
  }
}

export async function sendTelegramCancelNotification(payload: CancelOrderNotificationPayload): Promise<boolean> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  if (!token || !chatId) {
    return false;
  }

  try {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://chocomino-store.vercel.app';
    const adminUrl = `${baseUrl}/admin/orders`;

    const byLabel =
      payload.cancelledBy === 'customer'
        ? '👤 Khách hàng tự hủy'
        : payload.cancelledBy === 'system'
        ? '⏰ Hệ thống tự động hủy'
        : '🏪 Shop hủy';

    const message = [
      `🚫 <b>ĐƠN HÀNG ĐÃ BỊ HỦY!</b>`,
      `━━━━━━━━━━━━━━━━━━`,
      `📦 <b>Mã đơn:</b> <code>#${payload.code}</code>`,
      `👤 <b>Khách hàng:</b> ${payload.customerName}`,
      `📞 <b>Số điện thoại:</b> ${payload.phone}`,
      `💰 <b>Giá trị đơn:</b> <b>${payload.total.toLocaleString('vi-VN')}đ</b>`,
      `❌ <b>Người hủy:</b> ${byLabel}`,
      `📝 <b>Lý do:</b> <i>${payload.reason}</i>`,
      `━━━━━━━━━━━━━━━━━━`,
      `👉 <a href="${adminUrl}">Mở Quản lý Đơn hàng</a>`,
    ].join('\n');

    await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: message,
        parse_mode: 'HTML',
        disable_web_page_preview: true,
      }),
    });
    return true;
  } catch (err) {
    console.warn('[Telegram] Dispatch cancel error:', err);
    return false;
  }
}

export interface PaymentSuccessNotificationPayload {
  code: string;
  customerName: string;
  phone: string;
  amount: number;
  providerTxId: string;
}

export async function sendTelegramPaymentSuccessNotification(payload: PaymentSuccessNotificationPayload): Promise<boolean> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  if (!token || !chatId) {
    return false;
  }

  try {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://chocomino-store.vercel.app';
    const adminUrl = `${baseUrl}/admin/orders`;

    const message = [
      `💰 <b>XÁC NHẬN THANH TOÁN VIETQR THÀNH CÔNG!</b>`,
      `━━━━━━━━━━━━━━━━━━`,
      `📦 <b>Mã đơn:</b> <code>#${payload.code}</code>`,
      `👤 <b>Khách hàng:</b> ${payload.customerName}`,
      `📞 <b>Số điện thoại:</b> ${payload.phone}`,
      `💵 <b>Số tiền nhận:</b> <b>${payload.amount.toLocaleString('vi-VN')}đ</b>`,
      `🆔 <b>Mã GD Ngân hàng:</b> <code>${payload.providerTxId}</code>`,
      `━━━━━━━━━━━━━━━━━━`,
      `👉 <a href="${adminUrl}">Mở Quản lý Đơn hàng</a>`,
    ].join('\n');

    await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: message,
        parse_mode: 'HTML',
        disable_web_page_preview: true,
      }),
    });
    return true;
  } catch (err) {
    console.warn('[Telegram] Dispatch payment success error:', err);
    return false;
  }
}
