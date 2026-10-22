import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createAdminClient } from '@/lib/supabase/server';
import { getAdminSession } from '@/lib/auth/admin';
import { recordAuditLog } from '@/lib/audit';
import { sendTelegramCancelNotification } from '@/lib/telegram';
import type { OrderStatus } from '@/types/database';

const VALID_STATUSES: OrderStatus[] = [
  'new',
  'confirmed',
  'awaiting_stock',
  'packing',
  'shipping',
  'completed',
  'cancelled',
  'return_requested',
  'return_approved',
  'return_rejected',
  'returned',
  'refunded',
];

const updateStatusSchema = z.object({
  nextStatus: z.enum(VALID_STATUSES as [OrderStatus, ...OrderStatus[]]),
  reason: z.string().optional(),
  trackingCode: z.string().optional(),
});

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: orderId } = await params;
    const body = await req.json();
    const parsed = updateStatusSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, errors: parsed.error.format() },
        { status: 400 }
      );
    }

    const { nextStatus, reason, trackingCode } = parsed.data;
    const supabase = createAdminClient();

    // 1. Fetch current order
    const { data: order, error: fetchErr } = await supabase
      .from('orders')
      .select('id, code, status, payment_status, phone, email, customer_name, total')
      .eq('id', orderId)
      .single();

    if (fetchErr || !order) {
      return NextResponse.json(
        { success: false, message: 'Không tìm thấy đơn hàng' },
        { status: 404 }
      );
    }

    const currentStatus = order.status;

    // 2. Validate transition rules (cannot cancel already completed orders without return flow)
    if (currentStatus === 'completed' && nextStatus === 'cancelled') {
      return NextResponse.json(
        { success: false, message: 'Đơn đã hoàn thành không thể hủy trực tiếp' },
        { status: 400 }
      );
    }

    // 3. If cancelling order, restore inventory
    if (nextStatus === 'cancelled' && currentStatus !== 'cancelled') {
      try {
        const { data: items } = await supabase
          .from('order_items')
          .select('id, variant_id, quantity')
          .eq('order_id', orderId);

        if (items && items.length > 0) {
          for (const it of items) {
            if (it.variant_id) {
              const { data: variant } = await supabase
                .from('product_variants')
                .select('id, stock_qty')
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
              }
            }
          }
        }
      } catch (stockErr) {
        console.warn('[Admin Status] Stock restore warning:', stockErr);
      }
    }

    // 4. Update order status
    const updateData: any = {
      status: nextStatus,
      updated_at: new Date().toISOString(),
    };

    if (nextStatus === 'cancelled' && reason) {
      updateData.cancel_reason = reason;
      if (order.payment_status === 'awaiting') {
        updateData.payment_status = 'failed';
      }
    }

    const { data: updatedRows, error: updateErr } = await supabase
      .from('orders')
      .update(updateData)
      .eq('id', orderId)
      .select('id, status');

    if (updateErr) {
      return NextResponse.json(
        { success: false, message: 'Lỗi cập nhật CSDL: ' + updateErr.message },
        { status: 500 }
      );
    }

    if (!updatedRows || updatedRows.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message:
            'Không thể cập nhật đơn hàng trong database. Vui lòng kiểm tra quyền RLS hoặc SUPABASE_SERVICE_ROLE_KEY.',
        },
        { status: 500 }
      );
    }

    // 5. Record status history
    try {
      await supabase.from('order_status_history').insert({
        order_id: orderId,
        from_status: currentStatus,
        to_status: nextStatus,
        changed_by: 'admin',
        reason: reason || `Admin cập nhật trạng thái sang ${nextStatus}`,
      });
    } catch (histErr) {
      console.warn('[Admin Status] Order status history error:', histErr);
    }

    // 6. If tracking code provided, upsert shipment
    if (trackingCode && trackingCode.trim()) {
      try {
        await supabase.from('shipments').insert({
          order_id: orderId,
          carrier: 'SPX',
          tracking_code: trackingCode.trim(),
          status: 'shipping',
        });
      } catch (shipErr) {
        console.warn('[Admin Status] Shipment insert warning:', shipErr);
      }
    }

    // 7. Record Audit Log (FR-A-62)
    const session = await getAdminSession();
    recordAuditLog({
      action: `order_status_${nextStatus}`,
      entity: 'order',
      entityId: order.code,
      actorName: session?.name || 'Trung (Chủ shop)',
      actorEmail: session?.email || 'admin@chocomino.local',
      actorRole: session?.role || 'owner',
      beforeData: { status: currentStatus },
      afterData: {
        status: nextStatus,
        reason: reason || null,
        trackingCode: trackingCode || null,
      },
    }).catch((e) => console.warn('[Admin Status] Audit log error:', e));

    // 8. If cancelled, dispatch Telegram alert (FR-A-71)
    if (nextStatus === 'cancelled') {
      sendTelegramCancelNotification({
        code: order.code,
        customerName: order.customer_name,
        phone: order.phone,
        reason: reason || 'Shop hủy đơn',
        total: order.total || 0,
        cancelledBy: 'admin',
      }).catch((e) => console.warn('[Admin Status] Telegram cancel warning:', e));
    }

    return NextResponse.json({
      success: true,
      orderId,
      code: order.code,
      fromStatus: currentStatus,
      toStatus: nextStatus,
    });
  } catch (err: any) {
    console.error('Lỗi khi đổi trạng thái đơn:', err);
    return NextResponse.json(
      { success: false, message: 'Đã có lỗi xảy ra' },
      { status: 500 }
    );
  }
}
