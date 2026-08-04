import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { query } from '@/lib/db';

export async function PATCH(request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ message: 'Sign in required' }, { status: 401 });

  try {
    const { marketingOptIn } = await request.json();
    await query('update users set marketing_opt_in = $2 where id = $1', [session.id, Boolean(marketingOptIn)]);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[account settings]', err);
    return NextResponse.json({ message: 'Could not update settings.' }, { status: 500 });
  }
}
