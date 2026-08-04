import { getSiteSettings } from '@/lib/settings';
import SettingsForm from '@/components/admin/SettingsForm';

export default async function DashboardSettingsPage() {
  const settings = await getSiteSettings();

  return (
    <div>
      <span className="font-mono text-xs uppercase tracking-[0.2em] text-brass-light">Configuration</span>
      <h1 className="mt-2 font-display text-3xl italic text-cream">Website settings.</h1>
      <p className="mt-2 max-w-xl text-sm text-cream/60">
        Store info, currency, and shipping rules — read by checkout and (once wired up) order emails and the site footer.
      </p>

      <div className="card-surface mt-7 max-w-2xl p-7">
        <SettingsForm settings={settings} />
      </div>
    </div>
  );
}
