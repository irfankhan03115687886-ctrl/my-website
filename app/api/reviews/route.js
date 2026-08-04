import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { getProductBySlug } from '@/lib/products';
import { upsertReview } from '@/lib/reviews';
import { rateLimit, getClientIp } from '@/lib/rateLimit';

// POST /api/reviews — create or edit the signed-in customer's own review
// for a product. Body: { productSlug, rating, title?, body? }
export async function POST(request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ message: 'Sign in to write a review.' }, { status: 401 });

  try {
    const { productSlug, rating, title, body } = await request.json();
    if (!productSlug || !rating) {
      return NextResponse.json({ message: 'A rating is required.' }, { status: 400 });
    }
    const numericRating = Number(rating);
    if (!Number.isInteger(numericRating) || numericRating < 1 || numericRating > 5) {
      return NextResponse.json({ message: 'Rating must be between 1 and 5.' }, { status: 400 });
    }

    const product = await getProductBySlug(productSlug);
    if (!product) {
      return NextResponse.json({ message: 'Product not found.' }, { status: 404 });
    }

    const limit = rateLimit({ key: `review:${getClientIp(request)}:${session.id}`, limit: 20, windowMs: 60 * 60 * 1000 });
    if (!limit.allowed) {
      return NextResponse.json({ message: 'Too many reviews submitted. Please try again later.' }, { status: 429 });
    }

    const review = await upsertReview({
      productSlug,
      userId: session.id,
      rating: numericRating,
      title: title?.trim().slice(0, 120) || null,
      body: body?.trim().slice(0, 4000) || null,
    });

    return NextResponse.json({ ok: true, review });
  } catch (err) {
    console.error('[create review]', err);
    return NextResponse.json({ message: 'Could not save your review right now.' }, { status: 500 });
  }
}
