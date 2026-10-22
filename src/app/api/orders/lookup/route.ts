import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/client';

// Simple in-memory sliding window rate limiter (FR-C-51)
interface RateLimitRecord {
  count: number;
  resetAt: number;
}

const rateLimitMap = new Map<string, RateLimitRecord>();
const WINDOW_MS = 10 * 60 * 1000; // 10 minutes
const MAX_ATTEMPTS = 10; // Max 10 attempts per 10 mins

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const record = rateLimitMap.get(ip);

  if (!record || now > record.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + WINDOW_MS });
    return false;
  }

  if (record.count >= MAX_ATTEMPTS) {
    return true;
  }

  record.count += 1;
  return false;
}

const lookupSchema = z.object({
  orderCode: z.string().min(5, 'Mã đơn hàng không hợp lệ'),
  phone: z.string().min(8, 'Số điện thoại không hợp lệ'),
});

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0].trim() || '127.0.0.1';

    // 1. Rate Limit Enforcement (FR-C-51)
    if (isRateLimited(ip)) {
      return NextResponse.json(
        {
          success: false,
          message:
            'Bạn đã thử tra cứu quá nhiều lần. Vui lòng thử lại sau 10 phút hoặc liên hệ hotline tiệm để được hỗ trợ!',
        },
        { status: 429 }
      );
    }

    const body = await req.json();
    const parsed = lookupSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, errors: parsed.error.format() },
        { status: 400 }
      );
    }

    const { orderCode, phone } = parsed.data;
    const cleanCode = orderCode.trim().toUpperCase();
    const cleanPhone = phone.trim().replace(/^\+84/, '0');

    const supabase = createClient();

    // 2. Query order
    const { data: dbOrder, error: dbErr } = await supabase
      .from('orders')
      .select('*, items:order_items(*), return:return_requests(*), shipment:shipments(*)')
      .eq('code', cleanCode)
      .single();

    // 3. Unified Error per FR-C-51 (Never leak existence of order)
    const NOT_FOUND_MSG = 'Không tìm thấy thông tin đơn hàng khớp với mã đơn và số điện thoại đã nhập.';

    if (dbErr || !dbOrder) {
      return NextResponse.json({ success: false, message: NOT_FOUND_MSG }, { status: 404 });
    }

    const orderCleanPhone = (dbOrder.phone || '').trim().replace(/^\+84/, '0');
    if (!orderCleanPhone.endsWith(cleanPhone.slice(-9))) {
      return NextResponse.json({ success: false, message: NOT_FOUND_MSG }, { status: 404 });
    }

    // 4. Calculate 3-day return eligibility (D14)
    const isCompleted = dbOrder.status === 'completed';
    const completedTime = new Date(dbOrder.updated_at).getTime();
    const isWithin3Days = Date.now() - completedTime <= 3 * 24 * 60 * 60 * 1000;
    const hasExistingReturn = dbOrder.return && dbOrder.return.length > 0;

    // 5. Mask sensitive info (FR-C-52)
    const maskedPhone = `*******${orderCleanPhone.slice(-3)}`;

    const sanitizedOrder = {
      id: dbOrder.id,
      code: dbOrder.code,
      customer_name: dbOrder.customer_name,
      phone: maskedPhone,
      raw_phone: orderCleanPhone, // For verified actions like cancel
      address_province: dbOrder.address_province,
      address_ward: dbOrder.address_ward,
      payment_method: dbOrder.payment_method,
      payment_status: dbOrder.payment_status,
      status: dbOrder.status,
      subtotal: dbOrder.subtotal,
      shipping_fee: dbOrder.shipping_fee,
      total: dbOrder.total,
      is_preorder: dbOrder.is_preorder,
      cancel_reason: dbOrder.cancel_reason,
      created_at: dbOrder.created_at,
      updated_at: dbOrder.updated_at,
      items: dbOrder.items || [],
      trackingCode: dbOrder.shipment?.[0]?.tracking_code || null,
      isEligibleForReturn: isCompleted && isWithin3Days && !hasExistingReturn,
      returnDetails: hasExistingReturn ? dbOrder.return[0] : null,
    };

    return NextResponse.json({
      success: true,
      order: sanitizedOrder,
    });
  } catch (err: any) {
    console.error('[Order Lookup API] Error:', err);
    return NextResponse.json(
      { success: false, message: 'Đã có lỗi xảy ra trong quá trình tra cứu. Vui lòng thử lại!' },
      { status: 500 }
    );
  }
}
