import { NextResponse } from 'next/server';
import { requirePermission } from '@/lib/admin';
import { updateOrderStatus, ALL_STATUSES } from '@/lib/orders';
import { logActivity } from '@/lib/activityLog';

export async function PATCH(request, { params }) {
  const session = await requirePermission('orders');
  if (!session) return NextResponse.json({ message: 'You do not have permission to manage orders.' }, { status: 403 });

  try {
    const { status, note } = await request.json();
    if (!ALL_STATUSES.includes(status)) {
      return NextResponse.json({ message: 'Invalid status' }, { status: 400 });
    }
    await updateOrderStatus(params.id, status, note);
    await logActivity({
      adminId: session.id,
      adminEmail: session.email,
      action: 'order.status_changed',
      entity: 'order',
      entityId: params.id,
      metadata: { status, note: note || null },
    });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[admin order status]', err);
    return NextResponse.json({ message: 'Could not update order status. Check DATABASE_URL is set.' }, { status: 500 });
  }
}
