import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/client';
import { getAdminSession } from '@/lib/auth/admin';
import { recordAuditLog } from '@/lib/audit';

const resolveSchema = z.object({
  resolution: z.enum(['approved', 'rejected', 'refunded']),
  shopNote: z.string().min(3, 'Ghi chú xử lý của shop là bắt buộc (theo quyết định D2/SRS)'),
});

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: returnRequestId } = await params;
    const body = await req.json();
    const parsed = resolveSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, errors: parsed.error.format() },
        { status: 400 }
      );
    }

    const { resolution, shopNote } = parsed.data;
    const supabase = createClient();

    // 1. Fetch return request
    const { data: returnReq, error: fetchErr } = await supabase
      .from('return_requests')
      .select('id, order_id, status, customer_reason')
      .eq('id', returnRequestId)
      .single();

    if (fetchErr || !returnReq) {
      return NextResponse.json(
        { success: false, message: 'Không tìm thấy yêu cầu hoàn trả' },
        { status: 404 }
      );
    }

    const orderId = returnReq.order_id;

    // 2. Map resolution to order status
    let nextOrderStatus: 'return_approved' | 'return_rejected' | 'refunded';
    let nextReturnStatus: string;

    if (resolution === 'approved') {
      nextOrderStatus = 'return_approved';
      nextReturnStatus = 'approved';
    } else if (resolution === 'rejected') {
      nextOrderStatus = 'return_rejected';
      nextReturnStatus = 'rejected';
    } else {
      nextOrderStatus = 'refunded';
      nextReturnStatus = 'resolved';
    }

    // 3. Update return_requests
    const { error: updateReturnErr } = await supabase
      .from('return_requests')
      .update({
        status: nextReturnStatus,
        shop_note: shopNote,
        resolved_by: 'admin',
        resolution,
        resolved_at: new Date().toISOString(),
      })
      .eq('id', returnRequestId);

    if (updateReturnErr) {
      return NextResponse.json(
        { success: false, message: updateReturnErr.message },
        { status: 500 }
      );
    }

    // 4. Update order status
    await supabase
      .from('orders')
      .update({
        status: nextOrderStatus,
        updated_at: new Date().toISOString(),
      })
      .eq('id', orderId);

    // 5. Record status history
    await supabase.from('order_status_history').insert({
      order_id: orderId,
      from_status: 'return_requested',
      to_status: nextOrderStatus,
      changed_by: 'admin',
      reason: `Shop ${resolution === 'approved' ? 'duyệt' : resolution === 'rejected' ? 'từ chối' : 'hoàn tất'} đổi trả. Ghi chú: ${shopNote}`,
    });

    // 6. Record Audit Log (FR-A-62)
    const session = await getAdminSession();
    recordAuditLog({
      action: `resolve_return_${resolution}`,
      entity: 'return_request',
      entityId: String(returnRequestId),
      actorName: session?.name || 'Trung (Chủ shop)',
      actorEmail: session?.email || 'admin@chocomino.local',
      actorRole: session?.role || 'owner',
      beforeData: {
        orderId,
        previousStatus: returnReq.status,
      },
      afterData: {
        orderId,
        resolution,
        shopNote,
        nextOrderStatus,
      },
    });

    return NextResponse.json({
      success: true,
      returnRequestId,
      orderId,
      resolution,
      shopNote,
    });
  } catch (err: any) {
    console.error('Lỗi khi xử lý hoàn trả:', err);
    return NextResponse.json(
      { success: false, message: 'Đã có lỗi xảy ra' },
      { status: 500 }
    );
  }
}
