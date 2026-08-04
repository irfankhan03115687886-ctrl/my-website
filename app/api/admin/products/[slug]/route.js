import { NextResponse } from 'next/server';
import { requirePermission } from '@/lib/admin';
import { updateProduct, deleteProduct, setProductStatus, getProductIdBySlug } from '@/lib/adminProducts';
import { logActivity } from '@/lib/activityLog';
import { friendlyUniqueViolationMessage } from '@/lib/dbErrors';

export async function PATCH(request, { params }) {
  const session = await requirePermission('products');
  if (!session) return NextResponse.json({ message: 'You do not have permission to manage products.' }, { status: 403 });

  const id = await getProductIdBySlug(params.slug);
  if (!id) return NextResponse.json({ message: 'Product not found.' }, { status: 404 });

  try {
    const body = await request.json();

    if (body.statusOnly) {
      const product = await setProductStatus(id, body.status);
      await logActivity({
        adminId: session.id,
        adminEmail: session.email,
        action: 'product.status_changed',
        entity: 'product',
        entityId: id,
        metadata: { status: body.status },
      });
      return NextResponse.json({ ok: true, product });
    }

    if (!body.name?.trim()) {
      return NextResponse.json({ message: 'Product name is required.' }, { status: 400 });
    }
    if (!body.price || Number(body.price) <= 0) {
      return NextResponse.json({ message: 'A valid price is required.' }, { status: 400 });
    }

    const product = await updateProduct(id, body);
    await logActivity({
      adminId: session.id,
      adminEmail: session.email,
      action: 'product.updated',
      entity: 'product',
      entityId: id,
      metadata: { name: product.name },
    });
    return NextResponse.json({ ok: true, product });
  } catch (err) {
    console.error('[admin products update]', err);
    const duplicateMessage = friendlyUniqueViolationMessage(err);
    if (duplicateMessage) {
      return NextResponse.json({ message: duplicateMessage }, { status: 409 });
    }
    return NextResponse.json({ message: 'Could not update product.' }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  const session = await requirePermission('products');
  if (!session) return NextResponse.json({ message: 'You do not have permission to manage products.' }, { status: 403 });

  const id = await getProductIdBySlug(params.slug);
  if (!id) return NextResponse.json({ message: 'Product not found.' }, { status: 404 });

  try {
    await deleteProduct(id);
    await logActivity({
      adminId: session.id,
      adminEmail: session.email,
      action: 'product.deleted',
      entity: 'product',
      entityId: id,
    });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[admin products delete]', err);
    return NextResponse.json({ message: 'Could not delete product.' }, { status: 500 });
  }
}
