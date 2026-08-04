import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { setDefaultShipping } from '@/lib/addresses';

export async function POST(request, { params }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ message: 'Sign in required' }, { status: 401 });

  try {
    await setDefaultShipping(params.id, session.id);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[address default shipping]', err);
    return NextResponse.json({ message: 'Could not update default address.' }, { status: 500 });
  }
}
