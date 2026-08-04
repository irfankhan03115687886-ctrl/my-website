import { listAdminUsers } from '@/lib/adminUsers';
import { getAdminSession } from '@/lib/admin';
import { can, ROLE_LABELS, ROLE_DESCRIPTIONS, ROLES } from '@/lib/roles';
import RestrictedNotice from '@/components/admin/RestrictedNotice';
import UserManager from '@/components/admin/UserManager';

export default async function AdminUsersPage() {
  const session = await getAdminSession();
  if (!can(session?.role, 'users')) return <RestrictedNotice role={session?.role} resourceLabel="admin user management" />;

  let users = [];
  try {
    users = await listAdminUsers();
  } catch {
    users = [];
  }

  return (
    <div>
      <span className="font-mono text-xs uppercase tracking-[0.2em] text-brass-light">Team</span>
      <h1 className="mt-2 font-display text-3xl italic text-cream">Admin users.</h1>
      <p className="mt-2 max-w-xl text-sm text-cream/60">
        Grant an existing customer account admin access, and control exactly what each role can touch.
      </p>

      <div className="card-surface mt-7 p-7">
        <UserManager users={users} currentUserId={session.id} />
      </div>

      <div className="card-surface mt-6 p-7">
        <h2 className="font-display text-lg text-ink">What each role can do</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          {ROLES.map((r) => (
            <div key={r} className="rounded-md border border-ink/10 px-4 py-3">
              <h3 className="font-display text-sm text-ink">{ROLE_LABELS[r]}</h3>
              <p className="mt-1 text-xs text-ink/55">{ROLE_DESCRIPTIONS[r]}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
