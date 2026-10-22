import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function GET() {
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
