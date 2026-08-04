import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { verifyPassword, createSession } from '@/lib/auth';
import { rateLimit, getClientIp } from '@/lib/rateLimit';

// POST /api/auth/login — verifies a real user row + bcrypt hash, then
// starts a signed session cookie.
export async function POST(request) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json({ message: 'Email and password are required' }, { status: 400 });
    }

    const normalizedEmail = email.trim().toLowerCase();

    // 8 attempts per 10 minutes per IP+email — enough for a real person
    // who mistypes their password a few times, not enough for a
    // brute-force script. Keyed by IP+email (not IP alone) so one
    // slow typist on a shared office IP can't lock out their coworkers.
    const limit = rateLimit({
      key: `login:${getClientIp(request)}:${normalizedEmail}`,
      limit: 8,
      windowMs: 10 * 60 * 1000,
    });
    if (!limit.allowed) {
      return NextResponse.json(
        { message: `Too many attempts. Try again in ${Math.ceil(limit.retryAfterSeconds / 60)} minute(s).` },
        { status: 429 }
      );
    }

    const result = await query('select * from users where email = $1', [normalizedEmail]);
    const user = result.rows[0];

    if (!user) {
      return NextResponse.json({ message: 'Incorrect email or password' }, { status: 401 });
    }

    if (user.disabled) {
      return NextResponse.json({ message: 'This account has been disabled. Contact the store owner.' }, { status: 403 });
    }

    const valid = await verifyPassword(password, user.password_hash);
    if (!valid) {
      return NextResponse.json({ message: 'Incorrect email or password' }, { status: 401 });
    }

    await createSession(user);

    return NextResponse.json({ ok: true, user: { id: user.id, firstName: user.first_name, lastName: user.last_name, email: user.email } });
  } catch (err) {
    console.error('[login]', err);
    const hint = err.message?.includes('DATABASE_URL') || err.message?.includes('JWT_SECRET')
      ? err.message
      : 'Something went wrong signing you in. Check your database connection (DATABASE_URL) in .env.local — see README.md.';
    return NextResponse.json({ message: hint }, { status: 500 });
  }
}
