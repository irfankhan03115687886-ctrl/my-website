import { NextResponse } from 'next/server';
import { requirePermission } from '@/lib/admin';
import { createProduct } from '@/lib/adminProducts';
import { logActivity } from '@/lib/activityLog';
import { friendlyUniqueViolationMessage } from '@/lib/dbErrors';

export async function POST(request) {
  const session = await requirePermission('products');
  if (!session) return NextResponse.json({ message: 'You do not have permission to manage products.' }, { status: 403 });

  try {
    const body = await request.json();
    if (!body.name?.trim()) {
      return NextResponse.json({ message: 'Product name is required.' }, { status: 400 });
    }
    if (!body.price || Number(body.price) <= 0) {
      return NextResponse.json({ message: 'A valid price is required.' }, { status: 400 });
    }

    const product = await createProduct(body);
    await logActivity({
      adminId: session.id,
      adminEmail: session.email,
      action: 'product.created',
      entity: 'product',
      entityId: product.id,
      metadata: { name: product.name, slug: product.slug },
    });
    return NextResponse.json({ ok: true, product });
  } catch (err) {
    console.error('[admin products create]', err);
    const duplicateMessage = friendlyUniqueViolationMessage(err);
    if (duplicateMessage) {
      return NextResponse.json({ message: duplicateMessage }, { status: 409 });
    }
    return NextResponse.json({ message: 'Could not create product. Check DATABASE_URL is set.' }, { status: 500 });
  }
}
