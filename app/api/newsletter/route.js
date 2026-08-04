import { NextResponse } from 'next/server';
import { rateLimit, getClientIp } from '@/lib/rateLimit';

// POST /api/newsletter
// Demo handler. Replace with a call to your ESP (Mailchimp, Klaviyo, Resend Audiences, etc).
export async function POST(request) {
  const limit = rateLimit({ key: `newsletter:${getClientIp(request)}`, limit: 5, windowMs: 60 * 60 * 1000 });
  if (!limit.allowed) {
    return NextResponse.json({ message: 'Too many attempts. Please try again later.' }, { status: 429 });
  }

  const { email } = await request.json();
  if (!email || !email.includes('@')) {
    return NextResponse.json({ message: 'A valid email is required' }, { status: 400 });
  }
  console.log('[newsletter] subscribed', email);
  return NextResponse.json({ ok: true });
}
