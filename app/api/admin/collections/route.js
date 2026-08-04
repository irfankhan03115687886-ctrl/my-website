import { NextResponse } from 'next/server';
import { requirePermission } from '@/lib/admin';
import { createCollection } from '@/lib/catalog';
import { logActivity } from '@/lib/activityLog';
import { isSafeImageUrl } from '@/lib/validateImageUrl';

export async function POST(request) {
  const session = await requirePermission('collections');
  if (!session) return NextResponse.json({ message: 'You do not have permission to manage collections.' }, { status: 403 });

  try {
    const { slug, title, subtitle, imageUrl, sortOrder } = await request.json();
    if (!slug || !title) {
      return NextResponse.json({ message: 'Slug and title are required' }, { status: 400 });
    }
    if (!isSafeImageUrl(imageUrl)) {
      return NextResponse.json({ message: 'That image URL is not allowed.' }, { status: 400 });
    }
    const collection = await createCollection({ slug, title, subtitle, imageUrl, sortOrder });
    await logActivity({
      adminId: session.id,
      adminEmail: session.email,
      action: 'collection.created',
      entity: 'collection',
      entityId: collection.id,
      metadata: { slug, title },
    });
    return NextResponse.json({ ok: true, collection });
  } catch (err) {
    console.error('[admin collections create]', err);
    return NextResponse.json({ message: 'Could not create collection. Check DATABASE_URL is set.' }, { status: 500 });
  }
}
