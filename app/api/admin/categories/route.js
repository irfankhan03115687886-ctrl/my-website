import { NextResponse } from 'next/server';
import { requirePermission } from '@/lib/admin';
import { createCategory } from '@/lib/catalog';
import { logActivity } from '@/lib/activityLog';

export async function POST(request) {
  const session = await requirePermission('categories');
  if (!session) return NextResponse.json({ message: 'You do not have permission to manage categories.' }, { status: 403 });

  try {
    const { slug, label, parentId, sortOrder } = await request.json();
    if (!slug || !label) {
      return NextResponse.json({ message: 'Slug and label are required' }, { status: 400 });
    }
    const category = await createCategory({ slug, label, parentId, sortOrder });
    await logActivity({
      adminId: session.id,
      adminEmail: session.email,
      action: 'category.created',
      entity: 'category',
      entityId: category.id,
      metadata: { slug, label, parentId: parentId || null },
    });
    return NextResponse.json({ ok: true, category });
  } catch (err) {
    console.error('[admin categories create]', err);
    return NextResponse.json({ message: 'Could not create category. Check DATABASE_URL is set.' }, { status: 500 });
  }
}
