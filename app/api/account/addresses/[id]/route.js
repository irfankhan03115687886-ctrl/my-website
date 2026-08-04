import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { updateAddress, deleteAddress, getAddress } from '@/lib/addresses';

export async function PATCH(request, { params }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ message: 'Sign in required' }, { status: 401 });

  const existing = await getAddress(params.id, session.id);
  if (!existing) return NextResponse.json({ message: 'Address not found' }, { status: 404 });

  try {
    const body = await request.json();
    if (!body.fullName?.trim() || !body.line1?.trim() || !body.city?.trim() || !body.postcode?.trim()) {
      return NextResponse.json({ message: 'Full name, address line 1, city, and postcode are required.' }, { status: 400 });
    }
    const address = await updateAddress(params.id, session.id, body);
    return NextResponse.json({ ok: true, address });
  } catch (err) {
    console.error('[addresses update]', err);
    return NextResponse.json({ message: 'Could not update this address.' }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ message: 'Sign in required' }, { status: 401 });

  try {
    await deleteAddress(params.id, session.id);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[addresses delete]', err);
    return NextResponse.json({ message: 'Could not delete this address.' }, { status: 500 });
  }
}
