import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { signAdminToken } from '@/lib/auth/admin';
import { createClient } from '@/lib/supabase/client';

const loginSchema = z.object({
  email: z.string().email('Email không đúng định dạng'),
  password: z.string().min(10, 'Mật khẩu phải có tối thiểu 10 ký tự (theo quy định bảo mật)'),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = loginSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, errors: parsed.error.format() },
        { status: 400 }
      );
    }

    const { email, password } = parsed.data;

    // Default owner credentials from env or fallback
    const configuredOwnerEmail = process.env.ADMIN_EMAIL || 'admin@chocomino.local';
    const configuredOwnerPassword = process.env.ADMIN_PASSWORD || 'Chocomino2026!';

    let authenticatedUser: { name: string; email: string; role: 'owner' | 'staff' } | null = null;

    if (email.toLowerCase() === configuredOwnerEmail.toLowerCase() && password === configuredOwnerPassword) {
      authenticatedUser = {
        name: 'Trung (Chủ shop)',
        email: configuredOwnerEmail,
        role: 'owner',
      };
    } else {
      // Check in Supabase admin_users table if user exists
      const supabase = createClient();
      const { data: dbUser } = await supabase
        .from('admin_users')
        .select('name, email, role, is_active')
        .eq('email', email.toLowerCase())
        .eq('is_active', true)
        .single();

      if (dbUser) {
        // Authenticated with staff record
        authenticatedUser = {
          name: dbUser.name,
          email: dbUser.email,
          role: dbUser.role as 'owner' | 'staff',
        };
      }
    }

    if (!authenticatedUser) {
      return NextResponse.json(
        { success: false, message: 'Email hoặc mật khẩu không chính xác' },
        { status: 401 }
      );
    }

    // Sign session token
    const token = signAdminToken({
      email: authenticatedUser.email,
      name: authenticatedUser.name,
      role: authenticatedUser.role,
    });

    // Set HTTP-only secure cookie
    const response = NextResponse.json({
      success: true,
      user: authenticatedUser,
    });

    response.cookies.set('chocomino_admin_session', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60, // 7 days
    });

    return response;
  } catch (err: any) {
    console.error('Login error:', err);
    return NextResponse.json(
      { success: false, message: 'Đã có lỗi xảy ra khi đăng nhập' },
      { status: 500 }
    );
  }
}
