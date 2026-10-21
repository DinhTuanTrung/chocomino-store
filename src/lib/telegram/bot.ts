import type { Order } from '@/types/database';

export async function sendTelegramMessage(text: string): Promise<boolean> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  if (!token || !chatId) {
    console.warn('[Telegram] Chatomino Bot Token hoặc Chat ID chưa cấu hình');
    return false;
  }

  try {
    const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: 'HTML',
      }),
    });
    return res.ok;
  } catch (err) {
    console.error('[Telegram] Gửi tin nhắn thất bại:', err);
    return false;
  }
}

export async function notifyNewOrder(order: Order): Promise<boolean> {
  const paymentMethodLabel = order.payment_method === 'cod' ? '💵 COD' : '💳 Chuyển khoản VietQR';
  const preorderBadge = order.is_preorder ? ' ⏳ [PRE-ORDER]' : '';
  
  const text = `
<b>🍓 ĐƠN HÀNG MỚI${preorderBadge}</b>
━━━━━━━━━━━━━━━━━━━━
<b>Mã đơn:</b> <code>${order.code}</code>
<b>Khách hàng:</b> ${order.customer_name}
<b>SĐT:</b> ${order.phone}
<b>Địa chỉ:</b> ${order.address_detail}, ${order.address_ward}, ${order.address_province}
<b>Thanh toán:</b> ${paymentMethodLabel}
<b>Tổng thanh toán:</b> <b>${order.total.toLocaleString('vi-VN')}đ</b>
${order.note ? `<b>Ghi chú:</b> <i>${order.note}</i>\n` : ''}━━━━━━━━━━━━━━━━━━━━
👉 <a href="${process.env.NEXT_PUBLIC_BASE_URL || 'https://chocomino.vercel.app'}/admin/orders/${order.id}">Xem chi tiết đơn trong Admin</a>
`.trim();

  return sendTelegramMessage(text);
}

export async function notifyPaymentReceived(orderCode: string, amount: number): Promise<boolean> {
  const text = `
<b>💰 TIỀN ĐÃ VỀ TÀI KHOẢN!</b>
━━━━━━━━━━━━━━━━━━━━
<b>Mã đơn:</b> <code>${orderCode}</code>
<b>Số tiền nhận:</b> <b>${amount.toLocaleString('vi-VN')}đ</b>
<b>Trạng thái đơn:</b> Đã tự động chuyển sang "Đã thanh toán"
━━━━━━━━━━━━━━━━━━━━
`.trim();

  return sendTelegramMessage(text);
}

export async function notifyOrderNeedsReview(orderCode: string, reason: string): Promise<boolean> {
  const text = `
<b>⚠️ GIAO DỊCH CẦN XỬ LÝ TAY!</b>
━━━━━━━━━━━━━━━━━━━━
<b>Mã đơn:</b> <code>${orderCode}</code>
<b>Lý do:</b> ${reason}
━━━━━━━━━━━━━━━━━━━━
Vui lòng vào trang Admin để kiểm tra và đối soát giao dịch ngân hàng.
`.trim();

  return sendTelegramMessage(text);
}
