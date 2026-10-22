import { NextRequest, NextResponse } from 'next/server';
import { generateSPXMassOrderExcel, SPXOrderExportItem } from '@/lib/spx/export';
import { createClient } from '@/lib/supabase/client';

async function handleExport(req: NextRequest) {
  try {
    const supabase = createClient();
    let orderIds: string[] = [];

    // 1. Check if specific order IDs are provided via POST body
    if (req.method === 'POST') {
      try {
        const body = await req.json();
        if (Array.isArray(body?.orderIds) && body.orderIds.length > 0) {
          orderIds = body.orderIds;
        }
      } catch (e) {
        // empty or non-json body is acceptable
      }
    }

    // 2. Check if order IDs are provided via query parameter ?ids=id1,id2
    const url = new URL(req.url);
    const idsParam = url.searchParams.get('ids');
    if (idsParam) {
      const parsed = idsParam.split(',').map((id) => id.trim()).filter(Boolean);
      if (parsed.length > 0) {
        orderIds = [...new Set([...orderIds, ...parsed])];
      }
    }

    // 3. Query orders from Supabase
    let query = supabase
      .from('orders')
      .select('*, items:order_items(*)');

    if (orderIds.length > 0) {
      // Export specifically selected orders
      query = query.in('id', orderIds);
    } else {
      // Default: export active orders ready for fulfillment (new, confirmed, packing)
      query = query
        .in('status', ['new', 'confirmed', 'packing'])
        .order('created_at', { ascending: false });
    }

    const { data: liveOrders, error: liveErr } = await query;

    if (liveErr) {
      console.error('[SPX Export Query Error]:', liveErr);
      return NextResponse.json(
        { success: false, message: 'Lỗi truy vấn cơ sở dữ liệu: ' + liveErr.message },
        { status: 500 }
      );
    }

    if (!liveOrders || liveOrders.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message: orderIds.length > 0
            ? 'Các đơn hàng bạn chọn không tồn tại hoặc đã bị xóa.'
            : 'Hiện không có đơn hàng nào (mới, xác nhận hoặc đóng gói) để xuất file SPX.',
        },
        { status: 400 }
      );
    }

    // 4. Generate SPX mass order Excel file (single sheet 'Tạo đơn (địa chỉ mới)')
    const result = await generateSPXMassOrderExcel(liveOrders as SPXOrderExportItem[]);

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
