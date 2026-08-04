import { NextResponse } from 'next/server';
import { requirePermission } from '@/lib/admin';
import { setUserRole, setUserDisabled, removeAdminRole } from '@/lib/adminUsers';
import { ROLES } from '@/lib/roles';
import { logActivity } from '@/lib/activityLog';

export async function PATCH(request, { params }) {
  const session = await requirePermission('users');
  if (!session) return NextResponse.json({ message: 'Only Super Admins can manage admin users.' }, { status: 403 });

  if (params.id === session.id) {
    return NextResponse.json({ message: "You can't change your own access from here." }, { status: 400 });
  }

  try {
    const body = await request.json();

    if (typeof body.disabled === 'boolean') {
      await setUserDisabled(params.id, body.disabled);
      await logActivity({
        adminId: session.id,
        adminEmail: session.email,
        action: body.disabled ? 'admin_user.disabled' : 'admin_user.enabled',
        entity: 'user',
        entityId: params.id,
      });
      return NextResponse.json({ ok: true });
    }

    if (body.role) {
      if (!ROLES.includes(body.role)) {
        return NextResponse.json({ message: 'Invalid role' }, { status: 400 });
      }
      const updated = await setUserRole(params.id, body.role);
      await logActivity({
        adminId: session.id,
        adminEmail: session.email,
        action: 'admin_user.role_changed',
        entity: 'user',
        entityId: params.id,
        metadata: { role: body.role },
      });
      return NextResponse.json({ ok: true, user: updated });
    }

    return NextResponse.json({ message: 'Nothing to update' }, { status: 400 });
  } catch (err) {
    console.error('[admin users update]', err);
    return NextResponse.json({ message: 'Could not update this user.' }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  const session = await requirePermission('users');
  if (!session) return NextResponse.json({ message: 'Only Super Admins can manage admin users.' }, { status: 403 });

  if (params.id === session.id) {
    return NextResponse.json({ message: "You can't remove your own admin access." }, { status: 400 });
  }

  try {
    await removeAdminRole(params.id);
    await logActivity({
      adminId: session.id,
      adminEmail: session.email,
      action: 'admin_user.access_removed',
      entity: 'user',
      entityId: params.id,
    });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[admin users delete]', err);
    return NextResponse.json({ message: 'Could not remove admin access.' }, { status: 500 });
  }
}
