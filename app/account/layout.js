import Link from 'next/link';
import { getSession } from '@/lib/auth';
import AccountSidebar from '@/components/account/AccountSidebar';

export const metadata = {
  title: 'My Account — Field & Co',
  robots: { index: false, follow: false },
};

export default async function AccountLayout({ children }) {
  const session = await getSession();

  if (!session) {
    return (
      <section className="mx-auto flex min-h-[70vh] max-w-md flex-col items-center justify-center bg-ink px-5 text-center sm:px-8">
        <span className="font-mono text-xs uppercase tracking-[0.2em] text-brass-light">My account</span>
        <h1 className="mt-3 font-display text-2xl italic text-cream">You're not signed in.</h1>
        <p className="mt-3 text-sm text-cream/60">Sign in to see your account, orders, and wishlist.</p>
        <Link href="/login?next=/account" className="btn-primary mt-8">
          Sign in
        </Link>
      </section>
    );
  }

  return (
    <section className="mx-auto max-w-6xl bg-ink px-5 py-12 sm:px-8">
      <div className="flex flex-col gap-8 lg:flex-row">
        <AccountSidebar firstName={session.firstName} lastName={session.lastName} isAdmin={session.isAdmin} />
        <div className="min-w-0 flex-1">{children}</div>
      </div>
    </section>
  );
}
