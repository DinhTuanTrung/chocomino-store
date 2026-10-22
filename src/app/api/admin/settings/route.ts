import { NextRequest, NextResponse } from 'next/server';
import { getAdminSession } from '@/lib/auth/admin';
import { createAdminClient } from '@/lib/supabase/server';
import { recordAuditLog } from '@/lib/audit';

export async function GET(req: NextRequest) {
  try {
    const supabase = createAdminClient();
    const { data: settings, error } = await supabase
      .from('settings')
      .select('*');

    if (error) {
      return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }

    const settingsMap: Record<string, any> = {};
    (settings || []).forEach((s: any) => {
      settingsMap[s.key] = s.value;
    });

    return NextResponse.json({
      success: true,
      settings: settingsMap,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getAdminSession();
    if (!session) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const supabase = createAdminClient();

    const allowedKeys = ['bank_account', 'shop_info', 'shipping', 'spx_config'];
    const updates = Object.keys(body).filter((k) => allowedKeys.includes(k));

    for (const key of updates) {
      // Try update first
      const { data: updateRes, error: updateErr } = await supabase
        .from('settings')
        .update({
          value: body[key],
          updated_at: new Date().toISOString(),
        })
        .eq('key', key)
        .select();

      if (updateErr) {
        console.error(`[Settings Update Error] Key ${key}:`, updateErr);
      }

      // If key didn't update (e.g. didn't exist or blocked), try upsert
      if (!updateRes || updateRes.length === 0) {
        const { error: upsertErr } = await supabase
          .from('settings')
          .upsert(
            {
              key,
              value: body[key],
              updated_at: new Date().toISOString(),
            },
            { onConflict: 'key' }
          );

        if (upsertErr) {
          console.error(`[Settings API Error] Key ${key}:`, upsertErr);
          return NextResponse.json(
            {
              success: false,
              message: `CSDL từ chối lưu mục "${key}": ${upsertErr.message}. Vui lòng kiểm tra quyền RLS của bảng settings trên Supabase!`,
            },
            { status: 500 }
          );
        }
      }
    }

    // Record Audit Log (FR-A-62)
    recordAuditLog({
      action: 'update_settings',
      entity: 'settings',
      entityId: 'global',
      actorName: session.name,
      actorEmail: session.email,
      actorRole: session.role,
      afterData: body,
    }).catch((e) => console.warn('[Settings API] Audit warning:', e));

    return NextResponse.json({
      success: true,
      message: 'Cập nhật cấu hình thành công',
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}
