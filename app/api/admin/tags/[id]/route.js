import { NextResponse } from 'next/server';
import { requirePermission } from '@/lib/admin';
import { deleteTag } from '@/lib/catalog';
import { logActivity } from '@/lib/activityLog';

export async function DELETE(request, { params }) {
  const session = await requirePermission('tags');
  if (!session) return NextResponse.json({ message: 'You do not have permission to manage tags.' }, { status: 403 });

  try {
    await deleteTag(params.id);
    await logActivity({
      adminId: session.id,
      adminEmail: session.email,
      action: 'tag.deleted',
      entity: 'tag',
      entityId: params.id,
    });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[admin tags delete]', err);
    return NextResponse.json({ message: 'Could not delete tag.' }, { status: 500 });
  }
}
