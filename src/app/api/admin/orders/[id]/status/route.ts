import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/client';
import { getAdminSession } from '@/lib/auth/admin';
import { recordAuditLog } from '@/lib/audit';
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
    const supabase = createClient();

    // 1. Fetch current order
    const { data: order, error: fetchErr } = await supabase
      .from('orders')
      .select('id, code, status, payment_status, phone, email, customer_name')
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

    // 3. Update order status
    const updateData: any = {
      status: nextStatus,
      updated_at: new Date().toISOString(),
    };

    if (nextStatus === 'cancelled' && reason) {
      updateData.cancel_reason = reason;
    }

    const { error: updateErr } = await supabase
      .from('orders')
      .update(updateData)
      .eq('id', orderId);

    if (updateErr) {
      return NextResponse.json(
        { success: false, message: updateErr.message },
        { status: 500 }
      );
    }

    // 4. Record status history
    await supabase.from('order_status_history').insert({
      order_id: orderId,
      from_status: currentStatus,
      to_status: nextStatus,
      changed_by: 'admin',
      reason: reason || `Đổi trạng thái sang ${nextStatus}`,
    });

    // 5. If tracking code provided, upsert shipment
    if (trackingCode && trackingCode.trim()) {
      await supabase.from('shipments').insert({
        order_id: orderId,
        carrier: 'SPX',
        tracking_code: trackingCode.trim(),
        status: 'shipping',
      });
    }

    // 6. Record Audit Log (FR-A-62)
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
    });

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
