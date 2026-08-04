// lib/admin.js
import { getSession } from '@/lib/auth';
import { query } from '@/lib/db';
import { can } from '@/lib/roles';

// Resolves the *current, real* admin role for the signed-in user. This
// deliberately re-checks the database on every call instead of trusting
// the `role`/`isAdmin` fields baked into the session JWT — a role change
// or a disabled account needs to take effect immediately, not just after
// the user's cookie expires in 30 days.
export async function getAdminSession() {
  const session = await getSession();
  if (!session) return null;

  const envAdmins = (process.env.ADMIN_EMAILS || '')
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  const isEnvAdmin = envAdmins.includes((session.email || '').toLowerCase());

  try {
    const result = await query('select role, disabled, is_admin from users where id = $1', [session.id]);
    const user = result.rows[0];

    if (!user) {
      // Row not found (e.g. DB was reset) — fall back to the env allowlist
      // so a fresh setup can still reach /admin.
      return isEnvAdmin ? { ...session, role: 'super_admin' } : null;
    }
    if (user.disabled) return null;

    let role = user.role;
    if (!role && user.is_admin) role = 'admin'; // legacy accounts flagged before roles existed
    if (!role && isEnvAdmin) role = 'super_admin';
    if (!role) return null;

    return { ...session, role };
  } catch (err) {
    console.error('[admin session]', err);
    // DB not reachable — still let an env-configured admin in so /admin
    // isn't a dead end before DATABASE_URL is connected.
    return isEnvAdmin ? { ...session, role: 'super_admin' } : null;
  }
}

// Use for the /dashboard/admin tree, which is intentionally restricted
// to exactly the 'super_admin' role (not 'admin', not any other role,
// and never case-insensitively — the role column only ever contains the
// lowercase value 'super_admin', see db/schema.sql's check constraint).
// Returns { session, deniedReason } — deniedReason is 'unauthenticated'
// or 'forbidden' so the caller can redirect vs. show an access-denied page.
export async function getSuperAdminSession() {
  const session = await getAdminSession();
  if (!session) return { session: null, deniedReason: 'unauthenticated' };
  if (session.role !== 'super_admin') return { session, deniedReason: 'forbidden' };
  return { session, deniedReason: null };
}

// Use in every admin page/API route that touches a specific resource.
// Returns the session (with `.role` resolved) if allowed, otherwise null.
export async function requirePermission(resource) {
  const session = await getAdminSession();
  if (!session) return null;
  return can(session.role, resource) ? session : null;
}
