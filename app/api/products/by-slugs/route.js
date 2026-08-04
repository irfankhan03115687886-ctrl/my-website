import { NextResponse } from 'next/server';
import { getProductsBySlugs } from '@/lib/products';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const slugsParam = searchParams.get('slugs');
  if (!slugsParam) {
    return NextResponse.json({ products: [] });
  }
  const slugs = slugsParam.split(',').map((s) => s.trim()).filter(Boolean).slice(0, 50);
  const products = await getProductsBySlugs(slugs);
  return NextResponse.json({ products });
}
