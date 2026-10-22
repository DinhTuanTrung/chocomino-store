import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/client';
import { sendTelegramReturnNotification } from '@/lib/telegram';

const returnSchema = z.object({
  orderCode: z.string().min(6, 'Mã đơn hàng không hợp lệ'),
  phone: z.string().min(9, 'Số điện thoại không hợp lệ'),
  customerReason: z.string().min(3, 'Vui lòng chọn hoặc nhập lý do đổi trả'),
  customerDescription: z.string().optional(),
  videoUrl: z.string().url('Vui lòng cung cấp đường dẫn video khui hàng hợp lệ (Google Drive, YouTube, TikTok...)'),
  photos: z.array(z.string()).default([]),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = returnSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, errors: parsed.error.format() },
        { status: 400 }
      );
    }

    const { orderCode, phone, customerReason, customerDescription, videoUrl, photos } = parsed.data;
    const supabase = createClient();

    // 1. Fetch order by code
    const { data: order, error: fetchErr } = await supabase
      .from('orders')
      .select('id, code, phone, status, updated_at, total')
      .eq('code', orderCode.toUpperCase())
      .single();

    if (fetchErr || !order) {
      return NextResponse.json(
        { success: false, message: 'Không tìm thấy đơn hàng tương ứng' },
        { status: 404 }
      );
    }

    // 2. Verify phone matches
    const cleanPhone = phone.trim().replace(/^\+84/, '0');
    const orderCleanPhone = order.phone.trim().replace(/^\+84/, '0');
    if (!orderCleanPhone.endsWith(cleanPhone.slice(-9))) {
      return NextResponse.json(
        { success: false, message: 'Số điện thoại không khớp với thông tin đơn hàng' },
        { status: 403 }
      );
    }

    // 3. Check order status: Must be 'completed'
    if (order.status !== 'completed') {
      return NextResponse.json(
        { success: false, message: 'Chỉ đơn hàng đã giao hoàn thành mới có thể gửi yêu cầu đổi trả' },
        { status: 400 }
      );
    }

    // 4. Check 3-day return window (72 hours from updated_at)
    const completedDate = new Date(order.updated_at);
    const threeDaysInMillis = 3 * 24 * 60 * 60 * 1000;
    if (Date.now() - completedDate.getTime() > threeDaysInMillis) {
      return NextResponse.json(
        { success: false, message: 'Đã quá thời hạn 3 ngày đổi trả theo chính sách của shop' },
        { status: 400 }
      );
    }

    // 5. Check if return request already exists
    const { data: existingReturn } = await supabase
      .from('return_requests')
      .select('id, status')
      .eq('order_id', order.id)
      .single();

    if (existingReturn) {
      return NextResponse.json(
        { success: false, message: 'Đơn hàng này đã có yêu cầu đổi trả đang được xử lý' },
        { status: 400 }
      );
    }

    // 6. Insert return request record
    const { error: insertErr } = await supabase.from('return_requests').insert({
      order_id: order.id,
      status: 'pending',
      customer_reason: customerReason,
      customer_description: customerDescription || null,
      video_url: videoUrl,
      photos: photos || [],
      refund_amount: order.total,
    });

    if (insertErr) {
      return NextResponse.json(
        { success: false, message: insertErr.message },
        { status: 500 }
      );
    }

    // 7. Update order status to return_requested
    await supabase
      .from('orders')
      .update({
        status: 'return_requested',
        updated_at: new Date().toISOString(),
      })
      .eq('id', order.id);

    // 8. Log status history
    await supabase.from('order_status_history').insert({
      order_id: order.id,
      from_status: 'completed',
      to_status: 'return_requested',
      changed_by: 'customer',
      reason: `Khách gửi yêu cầu hoàn trả: ${customerReason}`,
    });

    // Dispatch Telegram Bot alert for return request (FR-A-71, FR-A-74)
    sendTelegramReturnNotification({
      orderCode: order.code,
      phone: cleanPhone,
      reason: customerReason,
      videoProofUrl: videoUrl,
    }).catch((tgErr) => console.warn('[Return] Telegram notification error:', tgErr));

    return NextResponse.json({
      success: true,
      message: 'Gửi yêu cầu đổi trả thành công. Shop sẽ liên hệ phản hồi sớm nhất!',
      orderCode: order.code,
    });
  } catch (err: any) {
    console.error('Lỗi khi gửi yêu cầu đổi trả:', err);
    return NextResponse.json(
      { success: false, message: 'Đã có lỗi xảy ra trên hệ thống' },
      { status: 500 }
    );
  }
}
