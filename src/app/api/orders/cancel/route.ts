import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/client';
import { sendTelegramCancelNotification } from '@/lib/telegram';
import { recordAuditLog } from '@/lib/audit';

const cancelSchema = z.object({
  orderCode: z.string().min(5, 'Mã đơn hàng không hợp lệ'),
  phone: z.string().min(8, 'Số điện thoại không hợp lệ'),
  reason: z.string().min(3, 'Vui lòng cung cấp lý do hủy đơn'),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = cancelSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, errors: parsed.error.format() },
        { status: 400 }
      );
    }

    const { orderCode, phone, reason } = parsed.data;
    const supabase = createClient();

    // 1. Fetch order
    const { data: order, error: fetchErr } = await supabase
      .from('orders')
      .select('id, code, phone, customer_name, status, payment_status, total')
      .eq('code', orderCode.trim().toUpperCase())
      .single();

    if (fetchErr || !order) {
      return NextResponse.json(
        { success: false, message: 'Không tìm thấy thông tin đơn hàng tương ứng.' },
        { status: 404 }
      );
    }

    // 2. Validate customer phone matches (last 9 digits)
    const cleanInputPhone = phone.trim().replace(/^\+84/, '0');
    const cleanOrderPhone = order.phone.trim().replace(/^\+84/, '0');
    if (!cleanOrderPhone.endsWith(cleanInputPhone.slice(-9))) {
      return NextResponse.json(
        { success: false, message: 'Số điện thoại không khớp với thông tin đơn hàng.' },
        { status: 403 }
      );
    }

    // 3. Validation per FR-C-54 & D16:
    // Only 'new' orders can be cancelled directly by customer.
    if (order.status === 'cancelled') {
      return NextResponse.json(
        { success: false, message: 'Đơn hàng này đã được hủy trước đó.' },
        { status: 400 }
      );
    }

    if (order.status !== 'new') {
      return NextResponse.json(
        {
          success: false,
          message:
            'Đơn hàng đã được xác nhận hoặc đang trong quá trình đóng gói/giao hàng. Vui lòng liên hệ trực tiếp hotline hoặc Zalo shop để được hỗ trợ!',
        },
        { status: 400 }
      );
    }

    if (order.payment_status === 'paid') {
      return NextResponse.json(
        {
          success: false,
          message:
            'Đơn hàng đã hoàn tất thanh toán. Vui lòng liên hệ shop để được hỗ trợ hủy và hoàn tiền theo quy định!',
        },
        { status: 400 }
      );
    }

    // 4. Fetch order items to restore stock
    const { data: items } = await supabase
      .from('order_items')
      .select('id, variant_id, quantity')
      .eq('order_id', order.id);

    if (items && items.length > 0) {
      for (const it of items) {
        if (it.variant_id) {
          const { data: variant } = await supabase
            .from('product_variants')
            .select('id, stock_qty, status')
            .eq('id', it.variant_id)
            .maybeSingle();

          if (variant) {
            const restoredStock = (variant.stock_qty || 0) + (it.quantity || 1);
            await supabase
              .from('product_variants')
              .update({
                stock_qty: restoredStock,
                status: 'in_stock',
                updated_at: new Date().toISOString(),
              })
              .eq('id', it.variant_id);

            // Log stock movement
            try {
              await supabase.from('stock_movements').insert({
                variant_id: it.variant_id,
                change_qty: it.quantity,
                reason: 'customer_cancelled',
                order_id: order.id,
              });
            } catch (e) {
              // Gracefully continue
            }
          }
        }
      }
    }

    // 5. Update order status to cancelled
    const { error: updateErr } = await supabase
      .from('orders')
      .update({
        status: 'cancelled',
        cancel_reason: reason,
        payment_status: order.payment_status === 'awaiting' ? 'failed' : order.payment_status,
        updated_at: new Date().toISOString(),
      })
      .eq('id', order.id);

    if (updateErr) {
      return NextResponse.json(
        { success: false, message: 'Không thể cập nhật trạng thái đơn hàng: ' + updateErr.message },
        { status: 500 }
      );
    }

    // 6. Record status transition history
    try {
      await supabase.from('order_status_history').insert({
        order_id: order.id,
        from_status: order.status,
        to_status: 'cancelled',
        changed_by: 'customer',
        reason: reason,
      });
    } catch (histErr) {
      console.warn('[CancelOrder] Failed to log order status history:', histErr);
    }

    // 7. Dispatch Telegram alert (non-blocking)
    sendTelegramCancelNotification({
      code: order.code,
      customerName: order.customer_name,
      phone: order.phone,
      reason,
      total: order.total,
      cancelledBy: 'customer',
    });

    // 8. Record Audit Log (FR-A-62)
    recordAuditLog({
      action: 'order_status_cancelled',
      entity: 'order',
      entityId: order.code,
      actorName: `Khách hàng (${order.customer_name})`,
      actorEmail: 'customer@chocomino.local',
      actorRole: 'customer',
      beforeData: { status: order.status },
      afterData: {
        status: 'cancelled',
        reason,
        cancelledBy: 'customer',
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Đơn hàng đã được hủy thành công.',
      code: order.code,
    });
  } catch (err: any) {
    console.error('[CancelOrder] Error:', err);
    return NextResponse.json(
      { success: false, message: 'Đã xảy ra lỗi khi hủy đơn hàng. Vui lòng thử lại!' },
      { status: 500 }
    );
  }
}
