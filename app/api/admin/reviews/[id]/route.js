import { NextResponse } from 'next/server';
import { requirePermission } from '@/lib/admin';
import { setReviewStatus, deleteReviewAsAdmin } from '@/lib/reviews';
import { logActivity } from '@/lib/activityLog';

export async function PATCH(request, { params }) {
  const session = await requirePermission('reviews');
  if (!session) return NextResponse.json({ message: 'Forbidden' }, { status: 403 });

  try {
    const { status } = await request.json();
    if (!['approved', 'rejected', 'pending'].includes(status)) {
      return NextResponse.json({ message: 'Invalid status.' }, { status: 400 });
    }
    const updated = await setReviewStatus(params.id, status);
    if (!updated) return NextResponse.json({ message: 'Review not found.' }, { status: 404 });

    await logActivity({
      adminEmail: session.email,
      action: `review.${status}`,
      entity: 'review',
      entityId: params.id,
    });

    return NextResponse.json({ review: updated });
  } catch (err) {
    console.error('[admin review update]', err);
    return NextResponse.json({ message: 'Could not update this review.' }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  const session = await requirePermission('reviews');
  if (!session) return NextResponse.json({ message: 'Forbidden' }, { status: 403 });

  try {
    await deleteReviewAsAdmin(params.id);
    await logActivity({
      adminEmail: session.email,
      action: 'review.deleted',
      entity: 'review',
      entityId: params.id,
    });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[admin review delete]', err);
    return NextResponse.json({ message: 'Could not delete this review.' }, { status: 500 });
  }
}
