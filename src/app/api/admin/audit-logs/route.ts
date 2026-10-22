import { NextRequest, NextResponse } from 'next/server';
import { getAdminSession } from '@/lib/auth/admin';
import { createAdminClient } from '@/lib/supabase/server';

export async function GET(req: NextRequest) {
  try {
    const session = await getAdminSession();
    if (!session) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized. Vui lòng đăng nhập quản trị.' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const entity = searchParams.get('entity');
    const search = searchParams.get('search');
    const limit = Math.min(100, Math.max(10, parseInt(searchParams.get('limit') || '50', 10)));

    const supabase = createAdminClient();
    let query = supabase
      .from('audit_log')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (entity && entity !== 'all') {
      query = query.eq('entity', entity);
    }

    if (search && search.trim()) {
      const cleanSearch = search.trim();
      query = query.or(`action.ilike.%${cleanSearch}%,entity_id.ilike.%${cleanSearch}%`);
    }

    const { data: logs, error } = await query;

    if (error) {
      return NextResponse.json(
        { success: false, message: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      logs: logs || [],
      count: logs?.length || 0,
    });
  } catch (err: any) {
    console.error('[AuditLog API] Error:', err);
    return NextResponse.json(
      { success: false, message: 'Lỗi máy chủ khi lấy nhật ký kiểm toán' },
      { status: 500 }
    );
  }
}
