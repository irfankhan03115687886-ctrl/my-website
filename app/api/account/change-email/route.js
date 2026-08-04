import { NextResponse } from 'next/server';
import { getSession, verifyPassword } from '@/lib/auth';
import { query } from '@/lib/db';
import { requestEmailChange } from '@/lib/emailChange';
import { sendEmailChangeVerification } from '@/lib/mailer';
import { rateLimit, getClientIp } from '@/lib/rateLimit';

export async function POST(request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ message: 'Sign in required' }, { status: 401 });

  try {
    const { newEmail, password } = await request.json();
    if (!newEmail || !newEmail.includes('@')) {
      return NextResponse.json({ message: 'A valid email is required' }, { status: 400 });
    }
    if (!password) {
      return NextResponse.json({ message: 'Enter your current password to confirm this change.' }, { status: 400 });
    }

    const limit = rateLimit({ key: `change-email:${getClientIp(request)}:${session.id}`, limit: 5, windowMs: 60 * 60 * 1000 });
    if (!limit.allowed) {
      return NextResponse.json({ message: 'Too many attempts. Please try again later.' }, { status: 429 });
    }

    const userResult = await query('select password_hash from users where id = $1', [session.id]);
    const user = userResult.rows[0];
    const validPassword = user && (await verifyPassword(password, user.password_hash));
    if (!validPassword) {
      return NextResponse.json({ message: 'Incorrect password.' }, { status: 400 });
    }

    const normalizedEmail = newEmail.trim().toLowerCase();
    const result = await requestEmailChange(session.id, normalizedEmail);
    if (!result.ok) {
      return NextResponse.json({ message: result.message }, { status: 409 });
    }

    await sendEmailChangeVerification(normalizedEmail, result.token);
    return NextResponse.json({ ok: true, message: `Check ${normalizedEmail} for a verification link.` });
  } catch (err) {
    console.error('[change email]', err);
    return NextResponse.json({ message: 'Could not start the email change.' }, { status: 500 });
  }
}
