import { NextResponse } from 'next/server';
import { rateLimit, getClientIp } from '@/lib/rateLimit';
import { createContactMessage } from '@/lib/contactMessages';
import { sendContactMessageNotification } from '@/lib/mailer';

// POST /api/contact — validates, saves the message to the database
// (visible to admins at /admin/contact-messages), and optionally emails
// an internal notification if CONTACT_NOTIFY_EMAIL is set.
export async function POST(request) {
  const limit = rateLimit({ key: `contact:${getClientIp(request)}`, limit: 5, windowMs: 60 * 60 * 1000 });
  if (!limit.allowed) {
    return NextResponse.json({ message: 'Too many messages sent. Please try again later.' }, { status: 429 });
  }

  const body = await request.json();
  const { name, email, subject, message } = body || {};

  if (!name || !email || !message) {
    return NextResponse.json({ message: 'Missing required fields' }, { status: 400 });
  }
  if (!email.includes('@')) {
    return NextResponse.json({ message: 'Enter a valid email address' }, { status: 400 });
  }

  try {
    const saved = await createContactMessage({ name, email, subject, message });
    // Fire-and-forget: a notification failure shouldn't fail the
    // customer's request — the message is already safely saved.
    sendContactMessageNotification(saved).catch((err) => console.error('[contact] notify failed', err));
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[contact]', err);
    return NextResponse.json({ message: 'Could not send your message right now. Please try again.' }, { status: 500 });
  }
}
