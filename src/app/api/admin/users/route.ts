import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getAdminSession } from '@/lib/auth/admin';
import { createAdminClient } from '@/lib/supabase/server';
import { recordAuditLog } from '@/lib/audit';

const userSchema = z.object({
  email: z.string().email('Email không hợp lệ'),
  name: z.string().min(2, 'Tên người dùng phải có ít nhất 2 ký tự'),
  role: z.enum(['owner', 'staff']).default('staff'),
});

export async function GET(req: NextRequest) {
  try {
    const session = await getAdminSession();
    if (!session) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const supabase = createAdminClient();
    const { data: dbUsers, error } = await supabase
      .from('admin_users')
      .select('id, email, name, role, is_active, last_login, created_at')
      .order('created_at', { ascending: true });

    // Primary owner profile from env or default
    const ownerEmail = process.env.ADMIN_EMAIL || 'admin@chocomino.local';
    const primaryOwner = {
      id: 'owner-root',
      email: ownerEmail,
      name: 'Trung (Chủ shop)',
      role: 'owner',
      is_active: true,
      last_login: new Date().toISOString(),
      created_at: '2026-10-21T00:00:00.000Z',
      is_root: true,
    };

    const combined = [
      primaryOwner,
      ...(dbUsers || []).filter((u: any) => u.email.toLowerCase() !== ownerEmail.toLowerCase()),
    ];

    return NextResponse.json({ success: true, users: combined });
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

    if (session.role !== 'owner') {
      return NextResponse.json(
        { success: false, message: 'Chỉ tài khoản Chủ shop mới có quyền quản lý tài khoản nhân viên (FR-A-61)' },
        { status: 403 }
      );
    }

    const body = await req.json();

    // Check if toggle active request
    if (body.action === 'toggle_active') {
      const { email, isActive } = body;
      const ownerEmail = process.env.ADMIN_EMAIL || 'admin@chocomino.local';

      if (email.toLowerCase() === ownerEmail.toLowerCase()) {
        return NextResponse.json(
          { success: false, message: 'Không thể vô hiệu hóa tài khoản Chủ shop mặc định (FR-A-61)' },
          { status: 400 }
        );
      }

      const supabase = createAdminClient();
      const { error: updateErr } = await supabase
        .from('admin_users')
        .update({ is_active: isActive, updated_at: new Date().toISOString() })
        .eq('email', email.toLowerCase());

      if (updateErr) {
        return NextResponse.json({ success: false, message: updateErr.message }, { status: 500 });
      }

      recordAuditLog({
        action: isActive ? 'activate_staff' : 'deactivate_staff',
        entity: 'auth',
        entityId: email,
        actorName: session.name,
        actorEmail: session.email,
        actorRole: session.role,
        afterData: { email, isActive },
      });

      return NextResponse.json({ success: true, message: 'Cập nhật trạng thái tài khoản thành công' });
    }

    // Create staff account
    const parsed = userSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ success: false, errors: parsed.error.format() }, { status: 400 });
    }

    const { email, name, role } = parsed.data;
    const supabase = createAdminClient();

    const { data: newUser, error: insertErr } = await supabase
      .from('admin_users')
      .insert({
        email: email.toLowerCase(),
        name,
        role,
        is_active: true,
      })
      .select()
      .single();

    if (insertErr) {
      return NextResponse.json(
        { success: false, message: 'Không thể tạo tài khoản: ' + insertErr.message },
        { status: 400 }
      );
    }

    recordAuditLog({
      action: 'create_staff',
      entity: 'auth',
      entityId: email,
      actorName: session.name,
      actorEmail: session.email,
      actorRole: session.role,
      afterData: { email, name, role },
    });

    return NextResponse.json({
      success: true,
      message: 'Tạo tài khoản nhân viên thành công',
      user: newUser,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}
