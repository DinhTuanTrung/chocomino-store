import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/client';

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    const secret = req.nextUrl.searchParams.get('secret');

    // Verify secret for Vercel Cron or manual webhook ping
    if (
      process.env.CRON_SECRET &&
      authHeader !== `Bearer ${process.env.CRON_SECRET}` &&
      secret !== process.env.CRON_SECRET
    ) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const supabase = createClient();

    // 1. Cancel expired QR orders (>15 mins) and return stock to inventory
    const { data: cancelledCount, error: cancelErr } = await supabase.rpc('cancel_expired_qr_orders');

    // 2. Anonymize expired customer PII (>90 days retention rule)
    const { data: anonymizedCount, error: anonErr } = await supabase.rpc('anonymize_expired_customer_data');

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      cancelledExpiredOrders: cancelledCount || 0,
      anonymizedCustomers: anonymizedCount || 0,
      cancelError: cancelErr ? cancelErr.message : null,
      anonymizeError: anonErr ? anonErr.message : null,
    });
  } catch (err: any) {
    console.error('[Cron Cleanup Error]:', err);
    return NextResponse.json(
      { success: false, error: err?.message || 'Lỗi khi thực thi cron cleanup' },
      { status: 500 }
    );
  }
}
