import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';

// GET /api/auth/me — returns the logged-in user (from the session cookie)
// or null. Used by the header and account page to show login state.
export async function GET() {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ user: null });
    return NextResponse.json({ user: { id: session.id, email: session.email, firstName: session.firstName, lastName: session.lastName, isAdmin: Boolean(session.isAdmin) } });
  } catch (err) {
    console.error('[me]', err);
    return NextResponse.json({ user: null });
  }
}
