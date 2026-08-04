import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { createAddress } from '@/lib/addresses';

export async function POST(request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ message: 'Sign in required' }, { status: 401 });

  try {
    const body = await request.json();
    if (!body.fullName?.trim() || !body.line1?.trim() || !body.city?.trim() || !body.postcode?.trim()) {
      return NextResponse.json({ message: 'Full name, address line 1, city, and postcode are required.' }, { status: 400 });
    }
    const address = await createAddress(session.id, body);
    return NextResponse.json({ ok: true, address });
  } catch (err) {
    console.error('[addresses create]', err);
    return NextResponse.json({ message: 'Could not save this address.' }, { status: 500 });
  }
}
