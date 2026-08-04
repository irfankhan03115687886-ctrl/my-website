import { NextResponse } from 'next/server';
import { resetPasswordWithToken } from '@/lib/passwordReset';
import { rateLimit, getClientIp } from '@/lib/rateLimit';

export async function POST(request) {
  try {
    const { token, password } = await request.json();
    if (!token || !password) {
      return NextResponse.json({ message: 'Missing token or password' }, { status: 400 });
    }
    if (password.length < 8) {
      return NextResponse.json({ message: 'Password must be at least 8 characters' }, { status: 400 });
    }

    const limit = rateLimit({ key: `reset-password:${getClientIp(request)}`, limit: 10, windowMs: 15 * 60 * 1000 });
    if (!limit.allowed) {
      return NextResponse.json({ message: 'Too many attempts. Please try again later.' }, { status: 429 });
    }

    const result = await resetPasswordWithToken(token, password);
    if (!result.ok) {
      return NextResponse.json({ message: result.message }, { status: 400 });
    }
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[reset password]', err);
    return NextResponse.json({ message: 'Could not reset your password right now.' }, { status: 500 });
  }
}
