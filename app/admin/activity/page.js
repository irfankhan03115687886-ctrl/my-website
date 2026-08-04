import { getActivityLog } from '@/lib/activityLog';
import { getAdminSession } from '@/lib/admin';
import { can } from '@/lib/roles';
import RestrictedNotice from '@/components/admin/RestrictedNotice';
import { formatDateTime } from '@/lib/formatDate';

function describe(entry) {
  const parts = entry.action.split('.');
  return parts.join(' ').replace(/_/g, ' ');
}

export default async function AdminActivityPage() {
  const session = await getAdminSession();
  if (!can(session?.role, 'activity')) return <RestrictedNotice role={session?.role} resourceLabel="the activity log" />;

  let entries = [];
  try {
    entries = await getActivityLog({ limit: 150 });
  } catch {
    entries = [];
  }

  return (
    <div>
      <span className="font-mono text-xs uppercase tracking-[0.2em] text-brass-light">Audit trail</span>
      <h1 className="mt-2 font-display text-3xl italic text-cream">Activity log.</h1>
      <p className="mt-2 max-w-xl text-sm text-cream/60">
        Every action taken from the admin dashboard — who did it, what changed, and when.
      </p>

      <div className="card-surface mt-7 p-7">
        {entries.length === 0 ? (
          <p className="text-sm text-ink/60">
            No activity recorded yet — this fills in as soon as an admin makes a change (or once{' '}
            <code className="font-mono text-xs">DATABASE_URL</code> is connected).
          </p>
        ) : (
          <ul className="divide-y divide-ink/10">
            {entries.map((entry) => (
              <li key={entry.id} className="flex items-start justify-between gap-4 py-3">
                <div>
                  <p className="text-sm capitalize text-ink/80">{describe(entry)}</p>
                  <p className="mt-0.5 font-mono text-[11px] uppercase tracking-wide text-ink/40">
                    {entry.admin_email || 'system'}
                    {entry.entity ? ` · ${entry.entity}${entry.entity_id ? ` #${String(entry.entity_id).slice(0, 8)}` : ''}` : ''}
                  </p>
                </div>
                <span className="shrink-0 font-mono text-xs text-ink/40">{formatDateTime(entry.created_at)}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
