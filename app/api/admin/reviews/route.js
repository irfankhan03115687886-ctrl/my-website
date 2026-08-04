import { NextResponse } from 'next/server';
import { requirePermission } from '@/lib/admin';
import { getAllReviewsForAdmin } from '@/lib/reviews';

export async function GET() {
  const session = await requirePermission('reviews');
  if (!session) return NextResponse.json({ message: 'Forbidden' }, { status: 403 });

  try {
    const reviews = await getAllReviewsForAdmin();
    return NextResponse.json({ reviews });
  } catch (err) {
    console.error('[admin reviews]', err);
    return NextResponse.json({ message: 'Could not load reviews.' }, { status: 500 });
  }
}
