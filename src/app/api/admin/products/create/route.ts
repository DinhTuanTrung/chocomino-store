import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/client';
import { createAdminClient } from '@/lib/supabase/server';
import { getAdminSession } from '@/lib/auth/admin';
import { recordAuditLog } from '@/lib/audit';

const createProductSchema = z.object({
  name: z.string().min(2, 'Tên sản phẩm phải có ít nhất 2 ký tự'),
  slug: z.string().optional(),
  categoryId: z.string().optional().nullable(),
  description: z.string().optional(),
  isFeatured: z.boolean().default(false),
  imageUrl: z.string().url('URL ảnh không đúng định dạng').optional().or(z.literal('')),
  variants: z
    .array(
      z.object({
        name: z.string().min(1, 'Tên phân loại không được để trống'),
        sku: z.string().optional(),
        price: z.number().int().nonnegative('Giá bán không được âm'),
        comparePrice: z.number().int().nonnegative().optional().nullable(),
        stockQty: z.number().int().nonnegative('Số lượng tồn không được âm'),
        weightKg: z.number().positive().default(0.2),
        status: z.enum(['in_stock', 'out_of_stock', 'preorder']).default('in_stock'),
        preorderEta: z.string().optional().nullable(),
      })
    )
    .min(1, 'Sản phẩm phải có ít nhất 1 phân loại/biến thể'),
});

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[đĐ]/g, 'd')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '');
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = createProductSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, errors: parsed.error.format() },
        { status: 400 }
      );
    }

    const { name, categoryId, description, isFeatured, imageUrl, variants } = parsed.data;
    const baseSlug = parsed.data.slug?.trim() || slugify(name);

    const supabase = createClient();

    // 1. Try atomic RPC first
    const { data: rpcData, error: rpcErr } = await supabase.rpc('create_product_atomic', {
      p_product: {
        category_id: categoryId || null,
        name,
        slug: baseSlug,
        description: description || null,
        is_featured: isFeatured,
      },
      p_variants: variants.map((v, idx) => ({
        name: v.name,
        sku: v.sku || `SKU-${Date.now()}-${idx + 1}`,
        price: v.price,
        compare_price: v.comparePrice || null,
        stock_qty: v.stockQty,
        status: v.status,
        preorder_eta: v.preorderEta || null,
        weight_kg: v.weightKg,
        sort_order: idx + 1,
      })),
      p_media: imageUrl
        ? [
            {
              type: 'image',
              url: imageUrl,
              sort_order: 1,
              is_primary: true,
            },
          ]
        : [],
    });

    if (!rpcErr && rpcData?.success) {
      return NextResponse.json({
        success: true,
        productId: rpcData.product_id,
        slug: rpcData.slug,
        message: 'Thêm sản phẩm thành công!',
      });
    }

    // 2. Fallback direct insert if RPC not present
    console.warn('[CreateProduct] RPC returned error, attempting fallback insert:', rpcErr?.message);
    const adminSupabase = createAdminClient();

    // Generate unique slug
    let finalSlug = baseSlug;
    const { data: existing } = await adminSupabase
      .from('products')
      .select('id')
      .eq('slug', finalSlug)
      .maybeSingle();

    if (existing) {
      finalSlug = `${baseSlug}-${Math.random().toString(36).substring(2, 7)}`;
    }

    // Insert Product
    const { data: prodData, error: prodErr } = await adminSupabase
      .from('products')
      .insert({
        name,
        slug: finalSlug,
        category_id: categoryId || null,
        description: description || null,
        is_active: true,
        is_featured: isFeatured,
      })
      .select('id, slug')
      .single();

    if (prodErr || !prodData) {
      return NextResponse.json(
        {
          success: false,
          message: prodErr?.message || 'Không thể tạo sản phẩm. Hãy chạy file migration `20261021_product_management.sql` trong Supabase SQL Editor.',
        },
        { status: 500 }
      );
    }

    const productId = prodData.id;

    // Insert Variants
    const variantRows = variants.map((v, idx) => ({
      product_id: productId,
      name: v.name,
      sku: v.sku || `SKU-${Date.now()}-${idx + 1}`,
      price: v.price,
      compare_price: v.comparePrice || null,
      stock_qty: v.stockQty,
      status: v.status,
      preorder_eta: v.preorderEta || null,
      weight_kg: v.weightKg,
      sort_order: idx + 1,
      is_active: true,
    }));

    await adminSupabase.from('product_variants').insert(variantRows);

    // Insert Media if present
    if (imageUrl) {
      await adminSupabase.from('product_media').insert({
        product_id: productId,
        type: 'image',
        url: imageUrl,
        sort_order: 1,
        is_primary: true,
      });
    }

    // Record Audit Log (FR-A-62)
    const session = await getAdminSession();
    recordAuditLog({
      action: 'create_product',
      entity: 'product',
      entityId: String(productId),
      actorName: session?.name || 'Trung (Chủ shop)',
      actorEmail: session?.email || 'admin@chocomino.local',
      actorRole: session?.role || 'owner',
      afterData: {
        name,
        slug: prodData.slug,
        isFeatured,
        variantCount: variants.length,
        variants: variants.map((v) => ({ name: v.name, price: v.price, stockQty: v.stockQty })),
      },
    });

    return NextResponse.json({
      success: true,
      productId,
      slug: prodData.slug,
      message: 'Thêm sản phẩm thành công!',
    });
  } catch (err: any) {
    console.error('[CreateProduct] Error:', err);
    return NextResponse.json(
      { success: false, message: err?.message || 'Lỗi hệ thống khi tạo sản phẩm' },
      { status: 500 }
    );
  }
}
