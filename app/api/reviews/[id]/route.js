import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { deleteOwnReview } from '@/lib/reviews';

// DELETE /api/reviews/[id] — a customer deleting their own review.
export async function DELETE(request, { params }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ message: 'Sign in required' }, { status: 401 });

  try {
    const deleted = await deleteOwnReview(params.id, session.id);
    if (!deleted) return NextResponse.json({ message: 'Review not found.' }, { status: 404 });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[delete review]', err);
    return NextResponse.json({ message: 'Could not delete your review right now.' }, { status: 500 });
  }
}
