'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import clsx from 'clsx';
import {
  LayoutDashboard,
  Image as ImageIcon,
  Sparkles,
  ShoppingBag,
  Tag,
  PackageSearch,
  FolderTree,
  FolderOpenDot,
  Users,
  FileText,
  Settings,
  ArrowLeft,
  BarChart3,
  Mail,
  Star,
} from 'lucide-react';

const LINKS = [
  { href: '/dashboard/admin', label: 'Dashboard', icon: LayoutDashboard, exact: true },
  { href: '/dashboard/admin/analytics', label: 'Analytics', icon: BarChart3 },
  { href: '/dashboard/admin/hero', label: 'Hero Section', icon: ImageIcon },
  { href: '/dashboard/admin/collection-banner', label: 'Collection Banner', icon: Sparkles },
  { href: '/dashboard/admin/products', label: 'Products', icon: ShoppingBag },
  { href: '/dashboard/admin/brands', label: 'Brands', icon: Tag },
  { href: '/dashboard/admin/orders', label: 'Orders', icon: PackageSearch },
  { href: '/dashboard/admin/categories', label: 'Categories', icon: FolderTree },
  { href: '/dashboard/admin/subcategories', label: 'Sub-Categories', icon: FolderOpenDot },
  { href: '/dashboard/admin/reviews', label: 'Reviews', icon: Star },
  { href: '/dashboard/admin/contact-messages', label: 'Contact Messages', icon: Mail },
  { href: '/dashboard/admin/customers', label: 'Customers', icon: Users },
  { href: '/dashboard/admin/pages', label: 'Other Pages', icon: FileText },
  { href: '/dashboard/admin/settings', label: 'Website Settings', icon: Settings },
];

export default function DashboardSidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-full shrink-0 border-b border-brass/15 bg-ink-2 lg:min-h-screen lg:w-64 lg:border-b-0 lg:border-r">
      <div className="px-5 py-6 lg:px-6">
        <Link href="/" className="font-display text-lg tracking-wide text-cream">
          FIELD <span className="text-brass">&amp;</span> CO
        </Link>
        <p className="mt-1 font-mono text-[11px] uppercase tracking-[0.14em] text-cream/40">Admin dashboard</p>
        <span className="mt-2 inline-block rounded-full border border-brass/30 px-2.5 py-0.5 font-mono text-[10px] uppercase tracking-[0.1em] text-brass-light">
          Super Admin
        </span>
      </div>
      <nav className="flex flex-row flex-wrap gap-1 overflow-x-auto px-3 pb-4 lg:flex-col lg:flex-nowrap lg:overflow-visible lg:px-3">
        {LINKS.map(({ href, label, icon: Icon, exact }) => {
          const active = exact ? pathname === href : pathname.startsWith(href);
          return (
            <Link key={href} href={href} className={clsx('admin-nav-link shrink-0', active && 'active')}>
              <Icon size={16} />
              {label}
            </Link>
          );
        })}
      </nav>
      <div className="hidden px-6 py-4 lg:block">
        <Link href="/" className="inline-flex items-center gap-1.5 font-mono text-[12px] uppercase tracking-[0.1em] text-cream/40 hover:text-cream">
          <ArrowLeft size={13} /> Back to store
        </Link>
      </div>
    </aside>
  );
}
