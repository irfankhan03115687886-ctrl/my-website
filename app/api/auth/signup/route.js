import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { hashPassword, createSession } from '@/lib/auth';
import { rateLimit, getClientIp } from '@/lib/rateLimit';

// POST /api/auth/signup — creates a real user row with a bcrypt-hashed
// password, then starts a signed session cookie. Requires DATABASE_URL
// and JWT_SECRET to be set (see README.md).
export async function POST(request) {
  try {
    // 5 new accounts per hour per IP — generous for a real household or
    // office, restrictive for a bot spinning up throwaway accounts.
    const limit = rateLimit({ key: `signup:${getClientIp(request)}`, limit: 5, windowMs: 60 * 60 * 1000 });
    if (!limit.allowed) {
      return NextResponse.json(
        { message: `Too many accounts created from this network. Try again in ${Math.ceil(limit.retryAfterSeconds / 60)} minute(s).` },
        { status: 429 }
      );
    }

    const { firstName, lastName, email, password } = await request.json();

    if (!firstName || !lastName || !email || !password) {
      return NextResponse.json({ message: 'All fields are required' }, { status: 400 });
    }
    if (password.length < 8) {
      return NextResponse.json({ message: 'Password must be at least 8 characters' }, { status: 400 });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const existing = await query('select id from users where email = $1', [normalizedEmail]);
    if (existing.rows.length > 0) {
      return NextResponse.json({ message: 'An account with that email already exists' }, { status: 409 });
    }

    const passwordHash = await hashPassword(password);
    const result = await query(
      `insert into users (first_name, last_name, email, password_hash)
       values ($1, $2, $3, $4)
       returning id, first_name, last_name, email`,
      [firstName, lastName, normalizedEmail, passwordHash]
    );

    const user = result.rows[0];
    await createSession(user);

    return NextResponse.json({ ok: true, user: { id: user.id, firstName: user.first_name, lastName: user.last_name, email: user.email } });
  } catch (err) {
    console.error('[signup]', err);
    const hint = err.message?.includes('DATABASE_URL') || err.message?.includes('JWT_SECRET')
      ? err.message
      : 'Something went wrong creating your account. Check your database connection (DATABASE_URL) in .env.local — see README.md.';
    return NextResponse.json({ message: hint }, { status: 500 });
  }
}
