import { NextResponse } from 'next/server';
import { requirePermission } from '@/lib/admin';
import { updateSiteSettings } from '@/lib/settings';
import { logActivity } from '@/lib/activityLog';

export async function PATCH(request) {
  const session = await requirePermission('settings');
  if (!session) return NextResponse.json({ message: 'You do not have permission to manage settings.' }, { status: 403 });

  try {
    const body = await request.json();
    if (!body.storeName?.trim()) {
      return NextResponse.json({ message: 'Store name is required' }, { status: 400 });
    }
    const settings = await updateSiteSettings(body);
    await logActivity({
      adminId: session.id,
      adminEmail: session.email,
      action: 'settings.updated',
      entity: 'site_settings',
      metadata: body,
    });
    return NextResponse.json({ ok: true, settings });
  } catch (err) {
    console.error('[admin settings update]', err);
    return NextResponse.json({ message: 'Could not save settings. Check DATABASE_URL is set.' }, { status: 500 });
  }
}
