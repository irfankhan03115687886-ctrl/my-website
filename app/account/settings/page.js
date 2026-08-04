import { getSession } from '@/lib/auth';
import { query } from '@/lib/db';
import AccountSettingsForm from '@/components/account/AccountSettingsForm';

export default async function AccountSettingsPage() {
  const session = await getSession();
  let marketingOptIn = true;
  try {
    const result = await query('select marketing_opt_in from users where id = $1', [session.id]);
    if (result.rows[0]) {
      marketingOptIn = result.rows[0].marketing_opt_in;
    }
  } catch {
    // fall back to defaults
  }

  return (
    <div>
      <span className="font-mono text-xs uppercase tracking-[0.2em] text-brass-light">My account</span>
      <h1 className="mt-2 font-display text-3xl italic text-cream">Settings.</h1>

      <div className="card-surface mt-7 max-w-2xl p-7">
        <AccountSettingsForm marketingOptIn={marketingOptIn} />
      </div>
    </div>
  );
}
