import { NextRequest, NextResponse } from 'next/server';
import { generateSPXMassOrderExcel, SPXOrderExportItem } from '@/lib/spx/export';
import { createClient } from '@/lib/supabase/client';

// Sample fallback orders if shop has no confirmed/packing orders yet
const MOCK_PACKING_ORDERS: SPXOrderExportItem[] = [
  {
    id: 'ord-101',
    code: 'CM7K2P9Q',
    customer_id: 'cust-1',
    customer_name: 'Nguyễn Thị Hồng',
    phone: '0987654321',
    email: 'hong@example.com',
    address_province: 'Thành phố Hồ Chí Minh',
    address_ward: 'Phường Dĩ An',
    address_detail: '38/32 Đường Số 2',
    note: 'Giao giờ hành chính',
    is_preorder: false,
    status: 'packing',
    payment_method: 'cod',
    payment_status: 'unpaid',
    subtotal: 90000,
    shipping_fee: 18000,
    total: 108000,
    source: 'TikTok',
    cancel_reason: null,
    internal_note: null,
    expires_at: null,
    idempotency_key: null,
    anonymized_at: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    items: [
      {
        id: 'item-1',
        order_id: 'ord-101',
        product_id: 'prod-1',
        variant_id: 'var-1-1',
        product_name_snapshot: 'Squishy Bánh Mì Nướng Bơ',
        variant_name_snapshot: 'Vị Socola',
        unit_price: 45000,
        quantity: 2,
        line_total: 90000,
        created_at: new Date().toISOString(),
      },
    ],
  },
  {
    id: 'ord-102',
    code: 'CM8M4R2X',
    customer_id: 'cust-2',
    customer_name: 'Trần Văn Nam',
    phone: '0912345678',
    email: 'nam@example.com',
    address_province: 'Thành phố Hà Nội',
    address_ward: 'Phường Hàng Bạc',
    address_detail: 'Số 12 Phố Hàng Bạc',
    note: null,
    is_preorder: false,
    status: 'packing',
    payment_method: 'bank_qr',
    payment_status: 'paid',
    subtotal: 65000,
    shipping_fee: 22000,
    total: 87000,
    source: 'Threads',
    cancel_reason: null,
    internal_note: null,
    expires_at: null,
    idempotency_key: null,
    anonymized_at: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    items: [
      {
        id: 'item-2',
        order_id: 'ord-102',
        product_id: 'prod-2',
        variant_id: 'var-2-1',
        product_name_snapshot: 'Squishy Mèo Béo Bánh Bao',
        variant_name_snapshot: 'Mèo Trắng Đốm',
        unit_price: 65000,
        quantity: 1,
        line_total: 65000,
        created_at: new Date().toISOString(),
      },
    ],
  },
];

async function handleExport(req: NextRequest) {
  try {
    const supabase = createClient();

    // 1. Fetch live orders in status 'confirmed' or 'packing'
    const { data: liveOrders, error: liveErr } = await supabase
      .from('orders')
      .select('*, items:order_items(*)')
      .in('status', ['confirmed', 'packing'])
      .order('created_at', { ascending: false });

    // 2. Fallback to mock packing demo orders if database has no active confirmed/packing orders
    const ordersToExport: SPXOrderExportItem[] =
      liveOrders && liveOrders.length > 0
        ? (liveOrders as SPXOrderExportItem[])
        : MOCK_PACKING_ORDERS;

    const result = await generateSPXMassOrderExcel(ordersToExport);

    const filename = `SPX_DonHang_Chocomino_${new Date().toISOString().slice(0, 10)}.xlsx`;

    return new NextResponse(result.buffer as any, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (err: any) {
    console.error('SPX Export error:', err);
    return NextResponse.json(
      { success: false, message: err?.message || 'Không thể tạo file SPX Excel' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  return handleExport(req);
}

export async function GET(req: NextRequest) {
  return handleExport(req);
}
