import { NextResponse } from 'next/server';
import { getSuperAdminSession } from '@/lib/admin';
import { setCustomerDisabled } from '@/lib/customers';
import { logActivity } from '@/lib/activityLog';

export async function PATCH(request, { params }) {
  const { session, deniedReason } = await getSuperAdminSession();
  if (deniedReason) return NextResponse.json({ message: 'Super Admin access required.' }, { status: 403 });

  try {
    const { disabled } = await request.json();
    await setCustomerDisabled(params.id, Boolean(disabled));
    await logActivity({
      adminId: session.id,
      adminEmail: session.email,
      action: disabled ? 'customer.disabled' : 'customer.enabled',
      entity: 'user',
      entityId: params.id,
    });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[dashboard customers update]', err);
    return NextResponse.json({ message: 'Could not update this customer.' }, { status: 500 });
  }
}
