import { NextResponse } from 'next/server';
import { searchProducts } from '@/lib/products';

// GET /api/products/search?q=jacket — used by the header's live search
// dropdown. Deliberately separate from GET /api/products so the
// category browse endpoint doesn't pay for an ILIKE scan on every call.
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get('q') || '';

  if (!q.trim()) {
    return NextResponse.json({ products: [] });
  }

  try {
    const products = await searchProducts(q, { limit: 8 });
    return NextResponse.json({ products });
  } catch (err) {
    console.error('[product search]', err);
    return NextResponse.json({ products: [] });
  }
}
