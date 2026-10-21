import crypto from 'crypto';
import { cookies } from 'next/headers';

const AUTH_SECRET = process.env.CRON_SECRET || process.env.SEPAY_WEBHOOK_SECRET || 'chocomino_secret_key_2026_super_secure';

export interface AdminSession {
  email: string;
  name: string;
  role: 'owner' | 'staff';
  exp: number; // timestamp in seconds
}

export function signAdminToken(payload: Omit<AdminSession, 'exp'>): string {
  const session: AdminSession = {
    ...payload,
    exp: Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60, // 7 days
  };

  const data = Buffer.from(JSON.stringify(session)).toString('base64url');
  const signature = crypto
    .createHmac('sha256', AUTH_SECRET)
    .update(data)
    .digest('base64url');

  return `${data}.${signature}`;
}

export function verifyAdminToken(token: string | undefined): AdminSession | null {
  if (!token) return null;

  const parts = token.split('.');
  if (parts.length !== 2) return null;

  const [data, signature] = parts;
  const expectedSig = crypto
    .createHmac('sha256', AUTH_SECRET)
    .update(data)
    .digest('base64url');

  if (signature !== expectedSig) return null;

  try {
    const session: AdminSession = JSON.parse(
      Buffer.from(data, 'base64url').toString('utf8')
    );

    // Check expiration
    if (session.exp < Math.floor(Date.now() / 1000)) {
      return null;
    }

    return session;
  } catch {
    return null;
  }
}

export async function getAdminSession(): Promise<AdminSession | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get('chocomino_admin_session')?.value;
  return verifyAdminToken(token);
}
