import { NextResponse } from 'next/server';
import { getSuperAdminSession } from '@/lib/admin';
import { deleteBrand } from '@/lib/brands';
import { logActivity } from '@/lib/activityLog';

export async function DELETE(request, { params }) {
  const { session, deniedReason } = await getSuperAdminSession();
  if (deniedReason) return NextResponse.json({ message: 'Super Admin access required.' }, { status: 403 });

  try {
    await deleteBrand(params.id);
    await logActivity({
      adminId: session.id,
      adminEmail: session.email,
      action: 'brand.deleted',
      entity: 'brand',
      entityId: params.id,
    });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[dashboard brands delete]', err);
    return NextResponse.json({ message: 'Could not delete brand.' }, { status: 500 });
  }
}
