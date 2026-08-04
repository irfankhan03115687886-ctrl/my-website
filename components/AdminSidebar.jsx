'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import clsx from 'clsx';
import {
  LayoutDashboard,
  PackageSearch,
  FolderTree,
  Tags,
  Sparkles,
  ShoppingBag,
  ArrowLeft,
  Users,
  Settings,
  ScrollText,
  Mail,
  Star,
} from 'lucide-react';
import { can, ROLE_LABELS } from '@/lib/roles';

const LINKS = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard, exact: true, resource: 'dashboard' },
  { href: '/admin/orders', label: 'Orders', icon: PackageSearch, resource: 'orders' },
  { href: '/admin/products', label: 'Products', icon: ShoppingBag, resource: 'products' },
  { href: '/admin/categories', label: 'Categories', icon: FolderTree, resource: 'categories' },
  { href: '/admin/tags', label: 'Tags', icon: Tags, resource: 'tags' },
  { href: '/admin/collections', label: 'Collections', icon: Sparkles, resource: 'collections' },
  { href: '/admin/reviews', label: 'Reviews', icon: Star, resource: 'reviews' },
  { href: '/admin/contact-messages', label: 'Contact Messages', icon: Mail, resource: 'contact_messages' },
  { href: '/admin/users', label: 'Admin Users', icon: Users, resource: 'users' },
  { href: '/admin/activity', label: 'Activity Log', icon: ScrollText, resource: 'activity' },
  { href: '/admin/settings', label: 'Settings', icon: Settings, resource: 'settings' },
];

export default function AdminSidebar({ role }) {
  const pathname = usePathname();
  const links = LINKS.filter((link) => can(role, link.resource));

  return (
    <aside className="w-full shrink-0 border-b border-brass/15 bg-ink-2 lg:min-h-screen lg:w-64 lg:border-b-0 lg:border-r">
      <div className="px-5 py-6 lg:px-6">
        <Link href="/" className="font-display text-lg tracking-wide text-cream">
          FIELD <span className="text-brass">&amp;</span> CO
        </Link>
        <p className="mt-1 font-mono text-[11px] uppercase tracking-[0.14em] text-cream/40">Admin dashboard</p>
        {role && (
          <span className="mt-2 inline-block rounded-full border border-brass/30 px-2.5 py-0.5 font-mono text-[10px] uppercase tracking-[0.1em] text-brass-light">
            {ROLE_LABELS[role] || role}
          </span>
        )}
      </div>
      <nav className="flex flex-row gap-1 overflow-x-auto px-3 pb-4 lg:flex-col lg:overflow-visible lg:px-3">
        {links.map(({ href, label, icon: Icon, exact }) => {
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
