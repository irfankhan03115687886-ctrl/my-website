import { NextResponse } from 'next/server';
import { requirePermission } from '@/lib/admin';
import { findUserByEmail, setUserRole } from '@/lib/adminUsers';
import { ROLES } from '@/lib/roles';
import { logActivity } from '@/lib/activityLog';

// Grants admin access to an *existing* customer account by email. This
// intentionally never creates a new account — an admin invite shouldn't
// be a backdoor account-creation flow.
export async function POST(request) {
  const session = await requirePermission('users');
  if (!session) return NextResponse.json({ message: 'Only Super Admins can manage admin users.' }, { status: 403 });

  try {
    const { email, role } = await request.json();
    if (!email || !ROLES.includes(role) || role === 'super_admin') {
      return NextResponse.json({ message: 'A valid email and role are required.' }, { status: 400 });
    }

    const user = await findUserByEmail(email);
    if (!user) {
      return NextResponse.json({ message: 'No account found with that email. Ask them to sign up first.' }, { status: 404 });
    }

    const updated = await setUserRole(user.id, role);
    await logActivity({
      adminId: session.id,
      adminEmail: session.email,
      action: 'admin_user.role_granted',
      entity: 'user',
      entityId: user.id,
      metadata: { email: user.email, role },
    });
    return NextResponse.json({ ok: true, user: updated });
  } catch (err) {
    console.error('[admin users create]', err);
    return NextResponse.json({ message: 'Could not update this user. Check DATABASE_URL is set.' }, { status: 500 });
  }
}
