import { NextResponse } from 'next/server';
import { requirePermission } from '@/lib/admin';
import { updateCollection, deleteCollection, toggleCollectionProduct } from '@/lib/catalog';
import { logActivity } from '@/lib/activityLog';
import { isSafeImageUrl } from '@/lib/validateImageUrl';

export async function PATCH(request, { params }) {
  const session = await requirePermission('collections');
  if (!session) return NextResponse.json({ message: 'You do not have permission to manage collections.' }, { status: 403 });

  try {
    const body = await request.json();
    if (body.toggleProduct) {
      await toggleCollectionProduct(params.id, body.toggleProduct, body.attach);
      await logActivity({
        adminId: session.id,
        adminEmail: session.email,
        action: body.attach ? 'collection.product_added' : 'collection.product_removed',
        entity: 'collection',
        entityId: params.id,
        metadata: { productSlug: body.toggleProduct },
      });
      return NextResponse.json({ ok: true });
    }
    if (!isSafeImageUrl(body.imageUrl)) {
      return NextResponse.json({ message: 'That image URL is not allowed.' }, { status: 400 });
    }
    const collection = await updateCollection(params.id, body);
    await logActivity({
      adminId: session.id,
      adminEmail: session.email,
      action: 'collection.updated',
      entity: 'collection',
      entityId: params.id,
      metadata: body,
    });
    return NextResponse.json({ ok: true, collection });
  } catch (err) {
    console.error('[admin collections update]', err);
    return NextResponse.json({ message: 'Could not update collection.' }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  const session = await requirePermission('collections');
  if (!session) return NextResponse.json({ message: 'You do not have permission to manage collections.' }, { status: 403 });

  try {
    await deleteCollection(params.id);
    await logActivity({
      adminId: session.id,
      adminEmail: session.email,
      action: 'collection.deleted',
      entity: 'collection',
      entityId: params.id,
    });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[admin collections delete]', err);
    return NextResponse.json({ message: 'Could not delete collection.' }, { status: 500 });
  }
}
