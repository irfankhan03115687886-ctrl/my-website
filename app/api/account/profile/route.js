import { NextResponse } from 'next/server';
import { getSession, createSession } from '@/lib/auth';
import { query } from '@/lib/db';

export async function PATCH(request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ message: 'Sign in required' }, { status: 401 });

  try {
    const { firstName, lastName, phone } = await request.json();
    if (!firstName?.trim() || !lastName?.trim()) {
      return NextResponse.json({ message: 'First and last name are required' }, { status: 400 });
    }
    const result = await query(
      'update users set first_name = $2, last_name = $3, phone = $4 where id = $1 returning *',
      [session.id, firstName.trim(), lastName.trim(), phone || null]
    );
    // The session JWT carries firstName/lastName at sign-in time — without
    // re-issuing it here, the header/sidebar would keep showing the old
    // name until the person logs in again.
    await createSession(result.rows[0]);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[profile update]', err);
    return NextResponse.json({ message: 'Could not update your profile.' }, { status: 500 });
  }
}
