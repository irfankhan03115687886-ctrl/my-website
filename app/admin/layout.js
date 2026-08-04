import Link from 'next/link';
import { getAdminSession } from '@/lib/admin';
import AdminSidebar from '@/components/AdminSidebar';
import DashboardTopbar from '@/components/dashboard/DashboardTopbar';

export const metadata = {
  title: 'Admin Dashboard — Field & Co',
  robots: { index: false, follow: false },
};

export default async function AdminLayout({ children }) {
  const session = await getAdminSession();

  if (!session) {
    return (
      <section className="mx-auto flex min-h-[70vh] max-w-md flex-col items-center justify-center bg-ink px-5 text-center sm:px-8">
        <span className="font-mono text-xs uppercase tracking-[0.2em] text-brass-light">Restricted</span>
        <h1 className="mt-3 font-display text-2xl italic text-cream">Admin access required.</h1>
        <p className="mt-3 text-sm text-cream/60">
          Sign in with an admin account to reach the dashboard. In a fresh setup, run{' '}
          <code className="rounded bg-cream/10 px-1.5 py-0.5 font-mono text-xs">
            update users set is_admin = true where email = '...'
          </code>{' '}
          or add your email to <code className="rounded bg-cream/10 px-1.5 py-0.5 font-mono text-xs">ADMIN_EMAILS</code>.
        </p>
        <Link href="/login" className="btn-primary mt-8">
          Sign in
        </Link>
      </section>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-ink lg:flex-row">
      <AdminSidebar role={session.role} />
      <div className="min-w-0 flex-1">
        <DashboardTopbar userName={`${session.firstName} ${session.lastName}`} userEmail={session.email} basePath="/admin" />
        <main className="px-5 py-10 sm:px-8 lg:py-12">{children}</main>
      </div>
    </div>
  );
}
