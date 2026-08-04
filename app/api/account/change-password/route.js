import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { query } from '@/lib/db';
import { verifyPassword, hashPassword } from '@/lib/auth';
import { rateLimit, getClientIp } from '@/lib/rateLimit';

export async function POST(request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ message: 'Sign in required' }, { status: 401 });

  try {
    const { currentPassword, newPassword } = await request.json();
    if (!currentPassword || !newPassword) {
      return NextResponse.json({ message: 'Both current and new password are required' }, { status: 400 });
    }
    if (newPassword.length < 8) {
      return NextResponse.json({ message: 'New password must be at least 8 characters' }, { status: 400 });
    }

    const limit = rateLimit({ key: `change-password:${getClientIp(request)}:${session.id}`, limit: 8, windowMs: 15 * 60 * 1000 });
    if (!limit.allowed) {
      return NextResponse.json({ message: 'Too many attempts. Please try again later.' }, { status: 429 });
    }

    const result = await query('select password_hash from users where id = $1', [session.id]);
    const user = result.rows[0];
    const valid = user && (await verifyPassword(currentPassword, user.password_hash));
    if (!valid) {
      return NextResponse.json({ message: 'Current password is incorrect.' }, { status: 400 });
    }

    const newHash = await hashPassword(newPassword);
    await query('update users set password_hash = $2 where id = $1', [session.id, newHash]);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[change password]', err);
    return NextResponse.json({ message: 'Could not change your password.' }, { status: 500 });
  }
}
