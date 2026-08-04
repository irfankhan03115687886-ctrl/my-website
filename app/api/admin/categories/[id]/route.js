import { NextResponse } from 'next/server';
import { requirePermission } from '@/lib/admin';
import { deleteCategory } from '@/lib/catalog';
import { logActivity } from '@/lib/activityLog';

export async function DELETE(request, { params }) {
  const session = await requirePermission('categories');
  if (!session) return NextResponse.json({ message: 'You do not have permission to manage categories.' }, { status: 403 });

  try {
    await deleteCategory(params.id);
    await logActivity({
      adminId: session.id,
      adminEmail: session.email,
      action: 'category.deleted',
      entity: 'category',
      entityId: params.id,
    });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[admin categories delete]', err);
    return NextResponse.json({ message: 'Could not delete category.' }, { status: 500 });
  }
}
