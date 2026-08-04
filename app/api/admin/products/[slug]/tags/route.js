import { NextResponse } from 'next/server';
import { requirePermission } from '@/lib/admin';
import { toggleProductTag } from '@/lib/catalog';
import { logActivity } from '@/lib/activityLog';

export async function POST(request, { params }) {
  const session = await requirePermission('products');
  if (!session) return NextResponse.json({ message: 'You do not have permission to manage products.' }, { status: 403 });

  try {
    const { tagId, attach } = await request.json();
    await toggleProductTag(params.slug, tagId, attach);
    await logActivity({
      adminId: session.id,
      adminEmail: session.email,
      action: attach ? 'product.tag_added' : 'product.tag_removed',
      entity: 'product',
      entityId: params.slug,
      metadata: { tagId },
    });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[admin product tags]', err);
    return NextResponse.json({ message: 'Could not update tag. Check DATABASE_URL is set.' }, { status: 500 });
  }
}
