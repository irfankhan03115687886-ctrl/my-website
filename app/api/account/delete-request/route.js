import { NextResponse } from 'next/server';
import { getSession, verifyPassword, clearSession } from '@/lib/auth';
import { query } from '@/lib/db';
import { logActivity } from '@/lib/activityLog';
import { rateLimit, getClientIp } from '@/lib/rateLimit';

// POST /api/account/delete-request — permanently deletes the signed-in
// customer's account after confirming their password.
//
// Orders are kept (their `user_id` is set to null by the FK's `on delete
// set null`, per db/schema.sql) so order history/financial records
// aren't destroyed, but every other row that identifies this person —
// the user row itself, their addresses, their reviews, their sessions —
// is gone. This matches "delete or deactivate... remove personal data
// where appropriate" from the spec: we delete rather than merely
// deactivate, since deactivating alone would leave the person's name,
// email, and password hash sitting in the database indefinitely.
export async function POST(request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ message: 'Sign in required' }, { status: 401 });

  try {
    const { password } = await request.json().catch(() => ({}));
    if (!password) {
      return NextResponse.json({ message: 'Enter your password to confirm account deletion.' }, { status: 400 });
    }

    const limit = rateLimit({ key: `delete-account:${getClientIp(request)}:${session.id}`, limit: 5, windowMs: 15 * 60 * 1000 });
    if (!limit.allowed) {
      return NextResponse.json({ message: 'Too many attempts. Please try again later.' }, { status: 429 });
    }

    const result = await query('select password_hash, email from users where id = $1', [session.id]);
    const user = result.rows[0];
    const valid = user && (await verifyPassword(password, user.password_hash));
    if (!valid) {
      return NextResponse.json({ message: 'Incorrect password.' }, { status: 400 });
    }

    // Deleting the user row cascades to addresses, reviews, password
    // reset/email change tokens (all `on delete cascade` in the schema)
    // and detaches their orders (`on delete set null`) — a single
    // statement, so it's already atomic without a separate transaction.
    await query('delete from users where id = $1', [session.id]);

    await logActivity({
      adminEmail: user.email,
      action: 'customer.account_deleted',
      entity: 'user',
      entityId: session.id,
    });

    clearSession();
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[account deletion]', err);
    return NextResponse.json({ message: 'Could not delete your account right now. Please try again.' }, { status: 500 });
  }
}
