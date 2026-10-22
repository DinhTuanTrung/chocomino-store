import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createAdminClient } from '@/lib/supabase/server';
import { sendTelegramOrderNotification } from '@/lib/telegram';

// Clean character set for order code (no 0/O, 1/I)
const ORDER_CODE_CHARS = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
function generateOrderCode(): string {
  let result = 'CM';
  for (let i = 0; i < 6; i++) {
    result += ORDER_CODE_CHARS.charAt(Math.floor(Math.random() * ORDER_CODE_CHARS.length));
  }
  return result;
}

const checkoutSchema = z.object({
  customerName: z.string().min(2, 'Họ tên phải có ít nhất 2 ký tự'),
  phone: z.string().regex(/^(0|\+84)(3|5|7|8|9)[0-9]{8}$/, 'Số điện thoại không hợp lệ'),
  email: z.string().email('Email không đúng định dạng').optional().nullable().or(z.literal('')),
  province: z.string().min(1, 'Vui lòng chọn Tỉnh/Thành'),
  ward: z.string().min(1, 'Vui lòng chọn Phường/Xã'),
  addressDetail: z.string().min(3, 'Vui lòng nhập số nhà, tên đường cụ thể'),
  note: z.string().optional(),
  source: z.string().optional(),
  paymentMethod: z.enum(['cod', 'bank_qr']),
  items: z.array(
    z.object({
      variantId: z.string(),
      productId: z.string(),
      productName: z.string(),
      variantName: z.string(),
      price: z.number().int().nonnegative(),
      quantity: z.number().int().positive(),
      weightKg: z.number().default(0.2),
      isPreorder: z.boolean().default(false),
    })
  ).min(1, 'Giỏ hàng trống'),
  idempotencyKey: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = checkoutSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, errors: parsed.error.format() },
        { status: 400 }
      );
    }

    const {
      customerName,
      phone,
      email,
      province,
      ward,
      addressDetail,
      note,
      source,
      paymentMethod,
      items,
      idempotencyKey,
    } = parsed.data;

    // Calculate shipping fee: 18.000d for HCM, 22.000d for others, 0d if freeship (FR-C-33)
    const isHCM = province.includes('Hồ Chí Minh');
    const baseShippingFee = isHCM ? 18000 : 22000;
    const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

    const supabase = createAdminClient();
    let isFreeShip = false;
    try {
      const { data: setRow } = await supabase
        .from('settings')
        .select('value')
        .eq('key', 'free_shipping_threshold')
        .single();
      const threshold = Number(setRow?.value || 0);
      if (threshold > 0 && subtotal >= threshold) {
        isFreeShip = true;
      }
    } catch (e) {
      // safe fallback
    }

    const shippingFee = isFreeShip ? 0 : baseShippingFee;
    const total = subtotal + shippingFee;
    const hasPreorder = items.some((it) => it.isPreorder);

    // Enforce pre-order rule: pre-order must use bank_qr
    if (hasPreorder && paymentMethod === 'cod') {
      return NextResponse.json(
        { success: false, message: 'Đơn hàng có sản phẩm đặt trước bắt buộc thanh toán QR' },
        { status: 400 }
      );
    }

    // Check if customer phone is blocked (FR-A-33)
    try {
      const { data: custRow } = await supabase
        .from('customers')
        .select('is_blocked')
        .eq('phone', phone)
        .single();
      if (custRow?.is_blocked) {
        return NextResponse.json(
          {
            success: false,
            message: 'Số điện thoại này hiện đang bị tạm khóa đặt hàng. Vui lòng liên hệ hotline shop để được hỗ trợ!',
          },
          { status: 403 }
        );
      }
    } catch (e) {
      // safe fallback
    }

    const orderCode = generateOrderCode();

    // Try creating via Supabase if connected
    try {
      const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      const allValidUUIDs = items.every((i) => isUUID.test(i.variantId));

      if (allValidUUIDs) {
        const { data: rpcData, error: rpcError } = await supabase.rpc('create_order_atomic', {
          p_order: {
            code: orderCode,
            customer_name: customerName,
            phone,
            email,
            address_province: province,
            address_ward: ward,
            address_detail: addressDetail,
            note: note || null,
            source: source || 'direct',
            payment_method: paymentMethod,
            shipping_fee: shippingFee,
            idempotency_key: idempotencyKey || null,
          },
          p_items: items.map((it) => ({
            variant_id: it.variantId,
            product_id: it.productId,
            product_name_snapshot: it.productName,
            variant_name_snapshot: it.variantName,
            unit_price: it.price,
            quantity: it.quantity,
          })),
        });

        if (rpcError) {
          console.warn('[Checkout] RPC atomic checkout warning, fallback to direct insert:', rpcError.message);
          await supabase.from('orders').insert({
            code: orderCode,
            customer_name: customerName,
            phone,
            email,
            address_province: province,
            address_ward: ward,
            address_detail: addressDetail,
            note: note || null,
            is_preorder: hasPreorder,
            status: 'new',
            payment_method: paymentMethod,
            payment_status: paymentMethod === 'bank_qr' ? 'awaiting' : 'unpaid',
            subtotal,
            shipping_fee: shippingFee,
            total,
            source: source || 'direct',
            idempotency_key: idempotencyKey || null,
            expires_at: paymentMethod === 'bank_qr' ? new Date(Date.now() + 15 * 60 * 1000).toISOString() : null,
          });
        }
      } else {
        // Fallback direct insert for mock IDs
        await supabase.from('orders').insert({
          code: orderCode,
          customer_name: customerName,
          phone,
          email,
          address_province: province,
          address_ward: ward,
          address_detail: addressDetail,
          note: note || null,
          is_preorder: hasPreorder,
          status: 'new',
          payment_method: paymentMethod,
          payment_status: paymentMethod === 'bank_qr' ? 'awaiting' : 'unpaid',
          subtotal,
          shipping_fee: shippingFee,
          total,
          source: source || 'direct',
          idempotency_key: idempotencyKey || null,
          expires_at: paymentMethod === 'bank_qr' ? new Date(Date.now() + 15 * 60 * 1000).toISOString() : null,
        });
      }

      // Upsert customer CRM record (FR-A-30)
      try {
        await supabase.from('customers').upsert(
          {
            phone,
            name: customerName,
            email: email || null,
            first_source: source || 'direct',
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'phone' }
        );
      } catch (crmErr) {
        console.warn('[Checkout] Customer CRM upsert error:', crmErr);
      }
    } catch (dbErr) {
      console.warn('[Checkout] Supabase call exception:', dbErr);
    }

    // Dispatch Telegram Bot notification in background (FR-A-71, FR-A-74)
    sendTelegramOrderNotification({
      code: orderCode,
      customerName,
      phone,
      address: `${addressDetail}, ${ward}, ${province}`,
      total,
      paymentMethod,
      isPreorder: hasPreorder,
      items: items.map((it) => ({
        productName: it.productName,
        variantName: it.variantName,
        quantity: it.quantity,
        price: it.price,
      })),
      source,
      note,
    }).catch((tgErr) => console.warn('[Checkout] Background Telegram error:', tgErr));

    return NextResponse.json({
      success: true,
      order: {
        code: orderCode,
        total,
        subtotal,
        shippingFee,
        paymentMethod,
        customerName,
        phone,
        email,
        address: `${addressDetail}, ${ward}, ${province}`,
        isPreorder: hasPreorder,
        expiresAt: paymentMethod === 'bank_qr' ? new Date(Date.now() + 15 * 60 * 1000).toISOString() : null,
      },
    });
  } catch (err: any) {
    console.error('[Checkout API Error]:', err);
    return NextResponse.json(
      { success: false, message: 'Đã có lỗi xảy ra khi tạo đơn hàng' },
      { status: 500 }
    );
  }
}
