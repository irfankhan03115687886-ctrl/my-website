'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { ExternalLink, LogOut } from 'lucide-react';

const LABELS = {
  admin: 'Dashboard',
  hero: 'Hero Section',
  'collection-banner': 'Collection Banner',
  products: 'Products',
  new: 'New',
  brands: 'Brands',
  orders: 'Orders',
  categories: 'Categories',
  subcategories: 'Sub-Categories',
  customers: 'Customers',
  pages: 'Other Pages',
  settings: 'Website Settings',
  analytics: 'Analytics',
  users: 'Admin Users',
  activity: 'Activity Log',
};

function useBreadcrumb(basePath) {
  const pathname = usePathname();
  const baseSegments = basePath.split('/').filter(Boolean).length;
  const parts = pathname.split('/').filter(Boolean).slice(baseSegments);
  if (parts.length === 0) return [{ label: 'Dashboard', href: basePath }];
  return parts.map((part, i) => {
    const href = `${basePath}/${parts.slice(0, i + 1).join('/')}`;
    const isId = /^[0-9a-f-]{8,}$/i.test(part);
    return { label: isId ? 'Detail' : LABELS[part] || part, href };
  });
}

export default function DashboardTopbar({ userName, userEmail, basePath = '/dashboard/admin' }) {
  const router = useRouter();
  const crumbs = useBreadcrumb(basePath);

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/');
    router.refresh();
  }

  return (
    <div className="flex items-center justify-between gap-4 border-b border-ink/8 bg-canvas-2/80 px-5 py-4 backdrop-blur sm:px-8">
      <nav aria-label="Breadcrumb" className="min-w-0">
        <ol className="flex items-center gap-1.5 truncate font-mono text-[11px] uppercase tracking-[0.08em] text-ink/45">
          <li>
            <Link href={basePath} className="hover:text-ink">
              Admin
            </Link>
          </li>
          {crumbs.map((crumb, i) => (
            <li key={crumb.href} className="flex items-center gap-1.5">
              <span className="text-ink/25">/</span>
              {i === crumbs.length - 1 ? (
                <span className="text-ink/70">{crumb.label}</span>
              ) : (
                <Link href={crumb.href} className="hover:text-ink">
                  {crumb.label}
                </Link>
              )}
            </li>
          ))}
        </ol>
      </nav>

      <div className="flex shrink-0 items-center gap-4">
        <Link
          href="/"
          target="_blank"
          className="hidden items-center gap-1.5 font-mono text-xs uppercase tracking-[0.1em] text-ink/50 hover:text-ink sm:flex"
        >
          View store <ExternalLink size={12} />
        </Link>
        <div className="hidden text-right sm:block">
          <p className="text-xs text-ink/70">{userName}</p>
          <p className="font-mono text-[10px] text-ink/40">{userEmail}</p>
        </div>
        <button onClick={handleLogout} aria-label="Log out" className="text-ink/40 hover:text-ember">
          <LogOut size={16} />
        </button>
      </div>
    </div>
  );
}
