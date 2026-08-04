import { NextResponse } from 'next/server';
import { getSuperAdminSession } from '@/lib/admin';
import { updatePage, deletePage } from '@/lib/pages';
import { logActivity } from '@/lib/activityLog';

export async function PATCH(request, { params }) {
  const { session, deniedReason } = await getSuperAdminSession();
  if (deniedReason) return NextResponse.json({ message: 'Super Admin access required.' }, { status: 403 });

  try {
    const { title, content, status } = await request.json();
    if (!title?.trim()) {
      return NextResponse.json({ message: 'Page title is required.' }, { status: 400 });
    }
    const page = await updatePage(params.id, { title, content, status });
    await logActivity({
      adminId: session.id,
      adminEmail: session.email,
      action: 'page.updated',
      entity: 'custom_page',
      entityId: params.id,
      metadata: { title },
    });
    return NextResponse.json({ ok: true, page });
  } catch (err) {
    console.error('[dashboard pages update]', err);
    return NextResponse.json({ message: 'Could not update page.' }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  const { session, deniedReason } = await getSuperAdminSession();
  if (deniedReason) return NextResponse.json({ message: 'Super Admin access required.' }, { status: 403 });

  try {
    await deletePage(params.id);
    await logActivity({
      adminId: session.id,
      adminEmail: session.email,
      action: 'page.deleted',
      entity: 'custom_page',
      entityId: params.id,
    });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[dashboard pages delete]', err);
    return NextResponse.json({ message: 'Could not delete page.' }, { status: 500 });
  }
}
