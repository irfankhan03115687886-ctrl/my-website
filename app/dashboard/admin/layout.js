import { redirect } from 'next/navigation';
import Link from 'next/link';
import { ShieldAlert } from 'lucide-react';
import { getSuperAdminSession } from '@/lib/admin';
import DashboardSidebar from '@/components/dashboard/DashboardSidebar';
import DashboardTopbar from '@/components/dashboard/DashboardTopbar';

export const metadata = {
  title: 'Admin Dashboard — Field & Co',
  robots: { index: false, follow: false },
};

export default async function DashboardAdminLayout({ children }) {
  const { session, deniedReason } = await getSuperAdminSession();

  // Not logged in at all — send straight to the login page.
  if (deniedReason === 'unauthenticated') {
    redirect('/login?next=/dashboard/admin');
  }

  // Logged in, but the account's database role isn't exactly
  // 'super_admin' — deny access with a clear message rather than
  // silently redirecting (this is a real permission boundary, not a
  // routing detail, so the person should see why).
  if (deniedReason === 'forbidden') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-ink px-5">
        <div className="max-w-sm text-center">
          <ShieldAlert size={28} className="mx-auto text-brass-light" />
          <h1 className="mt-4 font-display text-2xl italic text-cream">Access denied.</h1>
          <p className="mt-2 text-sm text-cream/60">
            This dashboard is restricted to Super Admin accounts. Your account's role is{' '}
            <code className="font-mono text-brass-light">{session?.role || 'none'}</code>.
          </p>
          <Link href="/" className="btn-outline mt-8 inline-flex">
            Back to store
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-ink lg:flex-row">
      <DashboardSidebar />
      <div className="min-w-0 flex-1">
        <DashboardTopbar userName={`${session.firstName} ${session.lastName}`} userEmail={session.email} />
        <main className="px-5 py-10 sm:px-8 lg:py-12">{children}</main>
      </div>
    </div>
  );
}
