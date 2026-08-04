import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { setDefaultBilling } from '@/lib/addresses';

export async function POST(request, { params }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ message: 'Sign in required' }, { status: 401 });

  try {
    await setDefaultBilling(params.id, session.id);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[address default billing]', err);
    return NextResponse.json({ message: 'Could not update default address.' }, { status: 500 });
  }
}
