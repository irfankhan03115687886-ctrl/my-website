import { getSiteSettings } from '@/lib/settings';
import { getAdminSession } from '@/lib/admin';
import { can } from '@/lib/roles';
import RestrictedNotice from '@/components/admin/RestrictedNotice';
import SettingsForm from '@/components/admin/SettingsForm';

export default async function AdminSettingsPage() {
  const session = await getAdminSession();
  if (!can(session?.role, 'settings')) return <RestrictedNotice role={session?.role} resourceLabel="settings" />;

  const settings = await getSiteSettings();

  return (
    <div>
      <span className="font-mono text-xs uppercase tracking-[0.2em] text-brass-light">Configuration</span>
      <h1 className="mt-2 font-display text-3xl italic text-cream">Store settings.</h1>
      <p className="mt-2 max-w-xl text-sm text-cream/60">
        General store details, used across order emails, invoices, and the site footer once wired up.
      </p>

      <div className="card-surface mt-7 max-w-2xl p-7">
        <SettingsForm settings={settings} />
      </div>
    </div>
  );
}
