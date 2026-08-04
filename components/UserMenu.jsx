'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronDown, LayoutDashboard, LogOut, ShieldCheck, User } from 'lucide-react';
import clsx from 'clsx';

// Shared "is this nav item active" logic — exact match for a few root
// routes (Home) and startsWith for everything else so a sub-route like
// /account/orders still lights up the parent Account item.
export function isNavActive(pathname, href, exact) {
  return exact ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);
}

export default function UserMenu({ user, onLogout }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const ref = useRef(null);

  useEffect(() => {
    function handleClick(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  useEffect(() => setOpen(false), [pathname]);

  const accountActive = isNavActive(pathname, '/account', false);
  const adminActive = isNavActive(pathname, '/dashboard/admin', false) || isNavActive(pathname, '/admin', false);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="menu"
        className={clsx(
          'flex items-center gap-2 rounded-full border px-3 py-1.5 font-mono text-[13px] uppercase tracking-[0.1em] transition-colors',
          accountActive || adminActive || open
            ? 'border-brass/50 bg-brass/10 text-brass-light'
            : 'border-transparent text-cream/70 hover:border-cream/15 hover:text-cream'
        )}
      >
        <User size={15} />
        {user.firstName}
        {user.isAdmin && (
          <span className="flex items-center gap-1 rounded-full border border-amber-400/30 bg-amber-400/15 px-1.5 py-0.5 font-mono text-[10px] tracking-normal text-amber-300">
            <ShieldCheck size={11} /> Admin
          </span>
        )}
        <ChevronDown size={13} className={clsx('transition-transform', open && 'rotate-180')} />
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 top-full z-50 mt-2 w-56 overflow-hidden rounded-xl border border-brass/20 bg-ink-2 py-2 shadow-[0_16px_40px_rgba(0,0,0,0.5)]"
        >
          <div className="border-b border-cream/10 px-4 py-3">
            <p className="font-display text-base text-cream">
              {user.firstName} {user.lastName}
            </p>
            {user.isAdmin ? (
              <span className="mt-1.5 inline-flex items-center gap-1.5 rounded-full border border-amber-400/30 bg-amber-400/15 px-2.5 py-1 font-mono text-[11px] uppercase tracking-[0.08em] text-amber-300">
                <ShieldCheck size={13} /> Administrator
              </span>
            ) : (
              <p className="mt-0.5 font-mono text-[11px] uppercase tracking-[0.1em] text-cream/40">Customer</p>
            )}
          </div>

          <nav className="py-1">
            {user.isAdmin && (
              <Link
                href="/dashboard/admin"
                role="menuitem"
                className={clsx(
                  'flex items-center gap-2.5 px-4 py-2.5 font-mono text-[13px] uppercase tracking-[0.08em] transition-colors',
                  adminActive ? 'bg-amber-400/10 text-amber-300' : 'text-cream/70 hover:bg-cream/5 hover:text-cream'
                )}
              >
                <LayoutDashboard size={15} /> Admin dashboard
              </Link>
            )}
            <Link
              href="/account"
              role="menuitem"
              className={clsx(
                'flex items-center gap-2.5 px-4 py-2.5 font-mono text-[13px] uppercase tracking-[0.08em] transition-colors',
                accountActive ? 'bg-brass/10 text-brass-light' : 'text-cream/70 hover:bg-cream/5 hover:text-cream'
              )}
            >
              <User size={15} /> My account
            </Link>
            <button
              onClick={onLogout}
              role="menuitem"
              className="flex w-full items-center gap-2.5 px-4 py-2.5 text-left font-mono text-[13px] uppercase tracking-[0.08em] text-cream/50 transition-colors hover:bg-ember/10 hover:text-ember"
            >
              <LogOut size={15} /> Logout
            </button>
          </nav>
        </div>
      )}
    </div>
  );
}
