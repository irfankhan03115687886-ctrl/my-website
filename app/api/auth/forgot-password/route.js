import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { createPasswordResetToken } from '@/lib/passwordReset';
import { sendPasswordResetEmail } from '@/lib/mailer';
import { rateLimit, getClientIp } from '@/lib/rateLimit';

export async function POST(request) {
  try {
    const { email } = await request.json();
    if (!email) {
      return NextResponse.json({ message: 'Email is required' }, { status: 400 });
    }
    const normalizedEmail = email.trim().toLowerCase();

    const limit = rateLimit({ key: `forgot-password:${getClientIp(request)}:${normalizedEmail}`, limit: 5, windowMs: 60 * 60 * 1000 });
    if (!limit.allowed) {
      return NextResponse.json({ message: 'Too many requests. Please try again later.' }, { status: 429 });
    }

    const result = await query('select id, email, disabled from users where email = $1', [normalizedEmail]);
    const user = result.rows[0];

    // Always respond the same way whether or not the account exists —
    // otherwise this endpoint becomes a way to enumerate registered emails.
    if (user && !user.disabled) {
      const token = await createPasswordResetToken(user.id);
      await sendPasswordResetEmail(user.email, token);
    }

    return NextResponse.json({ ok: true, message: 'If an account exists for that email, a reset link is on its way.' });
  } catch (err) {
    console.error('[forgot password]', err);
    return NextResponse.json({ message: 'Could not process this request right now.' }, { status: 500 });
  }
}
