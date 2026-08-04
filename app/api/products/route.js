import { NextResponse } from 'next/server';
import { getProducts } from '@/lib/products';

// GET /api/products?category=packs&search=jacket
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const category = searchParams.get('category');
  const search = searchParams.get('search');
  const products = await getProducts({ category, search });
  return NextResponse.json({ products });
}
