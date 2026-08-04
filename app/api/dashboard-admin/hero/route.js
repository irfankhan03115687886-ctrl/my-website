import { NextResponse } from 'next/server';
import { getSuperAdminSession } from '@/lib/admin';
import { updateHeroContent } from '@/lib/hero';
import { logActivity } from '@/lib/activityLog';
import { isSafeImageUrl } from '@/lib/validateImageUrl';

export async function PATCH(request) {
  const { session, deniedReason } = await getSuperAdminSession();
  if (deniedReason) return NextResponse.json({ message: 'Super Admin access required.' }, { status: 403 });

  try {
    const body = await request.json();
    if (!body.title?.trim()) {
      return NextResponse.json({ message: 'Hero title is required.' }, { status: 400 });
    }
    if (!isSafeImageUrl(body.imageUrl)) {
      return NextResponse.json({ message: 'That image URL is not allowed.' }, { status: 400 });
    }
    const hero = await updateHeroContent(body);
    await logActivity({
      adminId: session.id,
      adminEmail: session.email,
      action: 'hero.updated',
      entity: 'hero_content',
      metadata: { title: body.title },
    });
    return NextResponse.json({ ok: true, hero });
  } catch (err) {
    console.error('[dashboard hero update]', err);
    return NextResponse.json({ message: 'Could not save the hero section. Check DATABASE_URL is set.' }, { status: 500 });
  }
}
