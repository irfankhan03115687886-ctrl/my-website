'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import clsx from 'clsx';
import { LayoutDashboard, User, MapPin, PackageSearch, Heart, KeyRound, Settings, LogOut, ShieldCheck } from 'lucide-react';

const LINKS = [
  { href: '/account', label: 'Dashboard', icon: LayoutDashboard, exact: true },
  { href: '/account/profile', label: 'Profile', icon: User },
  { href: '/account/addresses', label: 'Addresses', icon: MapPin },
  { href: '/account/orders', label: 'Orders', icon: PackageSearch },
  { href: '/account/wishlist', label: 'Wishlist', icon: Heart },
  { href: '/account/password', label: 'Change Password', icon: KeyRound },
  { href: '/account/settings', label: 'Settings', icon: Settings },
];

export default function AccountSidebar({ firstName, lastName, isAdmin }) {
  const pathname = usePathname();
  const router = useRouter();

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/');
    router.refresh();
  }

  return (
    <aside className="w-full shrink-0 border-b border-brass/15 lg:w-64 lg:border-b-0 lg:border-r lg:pr-6">
      <div className="pb-6">
        <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-cream/40">Signed in as</p>
        <p className="mt-1 break-words font-display text-lg text-cream">
          {firstName} {lastName}
        </p>
        {isAdmin && (
          <span className="mt-2 inline-flex items-center gap-1.5 rounded-full border border-amber-400/30 bg-amber-400/15 px-2.5 py-1 font-mono text-[11px] uppercase tracking-[0.08em] text-amber-300">
            <ShieldCheck size={13} /> Administrator
          </span>
        )}
        {isAdmin && (
          <Link
            href="/dashboard/admin"
            className="mt-3 flex items-center gap-2 rounded-xl border border-amber-400/25 px-3 py-2 font-mono text-[12px] uppercase tracking-[0.08em] text-amber-300 transition-colors hover:bg-amber-400/10"
          >
            <LayoutDashboard size={14} /> Go to admin dashboard
          </Link>
        )}
      </div>
      <nav className="flex flex-row flex-wrap gap-1 overflow-x-auto pb-4 lg:flex-col lg:flex-nowrap lg:overflow-visible">
        {LINKS.map(({ href, label, icon: Icon, exact }) => {
          const active = exact ? pathname === href : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={clsx(
                'flex items-center gap-3 rounded-xl px-4 py-2.5 font-mono text-[13px] uppercase tracking-[0.1em] text-cream/55 transition-all duration-200 hover:bg-cream/[0.06] hover:text-cream',
                active && 'bg-brass/12 text-brass-light'
              )}
            >
              <Icon size={16} />
              {label}
            </Link>
          );
        })}
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 rounded-xl px-4 py-2.5 font-mono text-[13px] uppercase tracking-[0.1em] text-cream/55 transition-all duration-200 hover:bg-ember/10 hover:text-ember"
        >
          <LogOut size={16} />
          Logout
        </button>
      </nav>
    </aside>
  );
}
