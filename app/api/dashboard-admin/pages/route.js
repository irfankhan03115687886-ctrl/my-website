import { NextResponse } from 'next/server';
import { getSuperAdminSession } from '@/lib/admin';
import { createPage } from '@/lib/pages';
import { logActivity } from '@/lib/activityLog';

export async function POST(request) {
  const { session, deniedReason } = await getSuperAdminSession();
  if (deniedReason) return NextResponse.json({ message: 'Super Admin access required.' }, { status: 403 });

  try {
    const { title, slug, content, status } = await request.json();
    if (!title?.trim()) {
      return NextResponse.json({ message: 'Page title is required.' }, { status: 400 });
    }
    const page = await createPage({ title, slug, content, status });
    await logActivity({
      adminId: session.id,
      adminEmail: session.email,
      action: 'page.created',
      entity: 'custom_page',
      entityId: page.id,
      metadata: { title: page.title, slug: page.slug },
    });
    return NextResponse.json({ ok: true, page });
  } catch (err) {
    console.error('[dashboard pages create]', err);
    if (String(err.message || '').includes('duplicate key')) {
      return NextResponse.json({ message: 'A page with that slug already exists.' }, { status: 409 });
    }
    return NextResponse.json({ message: 'Could not create page. Check DATABASE_URL is set.' }, { status: 500 });
  }
}
