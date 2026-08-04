import { getSession } from '@/lib/auth';
import { query } from '@/lib/db';
import ProfileForm from '@/components/account/ProfileForm';

export default async function ProfilePage() {
  const session = await getSession();
  let user = { first_name: session.firstName, last_name: session.lastName, email: session.email, phone: '', avatar_url: '', pending_email: '' };
  try {
    const result = await query('select * from users where id = $1', [session.id]);
    if (result.rows[0]) user = result.rows[0];
  } catch {
    // fall back to session-derived defaults above
  }

  return (
    <div>
      <span className="font-mono text-xs uppercase tracking-[0.2em] text-brass-light">My account</span>
      <h1 className="mt-2 font-display text-3xl italic text-cream">Profile.</h1>

      <div className="card-surface mt-7 max-w-2xl p-7">
        <ProfileForm user={user} />
      </div>
    </div>
  );
}
