import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/client';

const adjustSchema = z.object({
  variantId: z.string().uuid('ID biến thể không hợp lệ'),
  delta: z.number().int(),
  reason: z.string().default('manual_adjust'),
  note: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = adjustSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, errors: parsed.error.format() },
        { status: 400 }
      );
    }

    const { variantId, delta, reason, note } = parsed.data;
    const supabase = createClient();

    // 1. Fetch current variant
    const { data: variant, error: fetchErr } = await supabase
      .from('product_variants')
      .select('id, stock_qty, status, name')
      .eq('id', variantId)
      .single();

    if (fetchErr || !variant) {
      return NextResponse.json(
        { success: false, message: 'Không tìm thấy biến thể sản phẩm' },
        { status: 404 }
      );
    }

    const newStock = Math.max(0, variant.stock_qty + delta);
    const newStatus =
      variant.status === 'preorder'
        ? 'preorder'
        : newStock === 0
        ? 'out_of_stock'
        : 'in_stock';

    // 2. Update stock
    const { error: updateErr } = await supabase
      .from('product_variants')
      .update({
        stock_qty: newStock,
        status: newStatus,
        updated_at: new Date().toISOString(),
      })
      .eq('id', variantId);

    if (updateErr) {
      return NextResponse.json(
        { success: false, message: updateErr.message },
        { status: 500 }
      );
    }

    // 3. Log stock movement
    await supabase.from('stock_movements').insert({
      variant_id: variantId,
      change_qty: delta,
      reason,
      note: note || `Điều chỉnh tồn kho bởi Admin (${delta > 0 ? '+' : ''}${delta})`,
    });

    return NextResponse.json({
      success: true,
      newStock,
      newStatus,
    });
  } catch (err: any) {
    console.error('Inventory adjust error:', err);
    return NextResponse.json(
      { success: false, message: 'Đã có lỗi xảy ra' },
      { status: 500 }
    );
  }
}
