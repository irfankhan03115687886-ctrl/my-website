import { NextResponse } from 'next/server';
import { requirePermission } from '@/lib/admin';
import { createTag } from '@/lib/catalog';
import { logActivity } from '@/lib/activityLog';

export async function POST(request) {
  const session = await requirePermission('tags');
  if (!session) return NextResponse.json({ message: 'You do not have permission to manage tags.' }, { status: 403 });

  try {
    const { slug, label } = await request.json();
    if (!slug || !label) {
      return NextResponse.json({ message: 'Slug and label are required' }, { status: 400 });
    }
    const tag = await createTag({ slug, label });
    await logActivity({
      adminId: session.id,
      adminEmail: session.email,
      action: 'tag.created',
      entity: 'tag',
      entityId: tag.id,
      metadata: { slug, label },
    });
    return NextResponse.json({ ok: true, tag });
  } catch (err) {
    console.error('[admin tags create]', err);
    return NextResponse.json({ message: 'Could not create tag. Check DATABASE_URL is set.' }, { status: 500 });
  }
}
