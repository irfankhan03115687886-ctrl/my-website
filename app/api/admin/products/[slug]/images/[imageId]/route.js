import { NextResponse } from 'next/server';
import { requirePermission } from '@/lib/admin';
import { deleteProductImage, setPrimaryImage, reorderProductImage, getProductIdBySlug } from '@/lib/adminProducts';
import { logActivity } from '@/lib/activityLog';
import { deleteStoredFile } from '@/lib/storage';

export async function PATCH(request, { params }) {
  const session = await requirePermission('products');
  if (!session) return NextResponse.json({ message: 'You do not have permission to manage products.' }, { status: 403 });

  const productId = await getProductIdBySlug(params.slug);
  if (!productId) return NextResponse.json({ message: 'Product not found.' }, { status: 404 });

  try {
    const { action, direction } = await request.json();
    if (action === 'setPrimary') {
      await setPrimaryImage(productId, params.imageId);
    } else if (action === 'reorder') {
      await reorderProductImage(productId, params.imageId, direction);
    } else {
      return NextResponse.json({ message: 'Unknown action' }, { status: 400 });
    }
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[admin product image update]', err);
    return NextResponse.json({ message: 'Could not update image.' }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  const session = await requirePermission('products');
  if (!session) return NextResponse.json({ message: 'You do not have permission to manage products.' }, { status: 403 });

  try {
    const deleted = await deleteProductImage(params.imageId);

    if (deleted?.url) {
      await deleteStoredFile(deleted.url);
    }

    await logActivity({
      adminId: session.id,
      adminEmail: session.email,
      action: 'product.image_deleted',
      entity: 'product',
      entityId: params.slug,
      metadata: { imageId: params.imageId },
    });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[admin product image delete]', err);
    return NextResponse.json({ message: 'Could not delete image.' }, { status: 500 });
  }
}
