import { NextResponse } from 'next/server';
import { requirePermission } from '@/lib/admin';
import { toggleCollectionProduct } from '@/lib/catalog';
import { logActivity } from '@/lib/activityLog';

export async function POST(request, { params }) {
  const session = await requirePermission('products');
  if (!session) return NextResponse.json({ message: 'You do not have permission to manage products.' }, { status: 403 });

  try {
    const { collectionId, attach } = await request.json();
    await toggleCollectionProduct(collectionId, params.slug, attach);
    await logActivity({
      adminId: session.id,
      adminEmail: session.email,
      action: attach ? 'product.collection_added' : 'product.collection_removed',
      entity: 'product',
      entityId: params.slug,
      metadata: { collectionId },
    });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[admin product collections]', err);
    return NextResponse.json({ message: 'Could not update collection. Check DATABASE_URL is set.' }, { status: 500 });
  }
}
