'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { Heart, ShoppingBag, Menu, X, User, Search, ShieldCheck, LayoutDashboard, LogOut } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import SearchBar from '@/components/SearchBar';
import UserMenu, { isNavActive } from '@/components/UserMenu';
import clsx from 'clsx';

const NAV = [
  { href: '/', label: 'Home', exact: true },
  { href: '/products', label: 'Shop' },
  { href: '/collections', label: 'Collections' },
  { href: '/contact', label: 'Contact' },
];

export default function Header() {
  const [open, setOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const pathname = usePathname();
  const { cartCount, wishlist } = useCart();
  const { user, logout } = useAuth();
  const [bump, setBump] = useState(false);
  const prevCount = useRef(cartCount);
  const prefersReducedMotion = useReducedMotion();

  useEffect(() => {
    if (cartCount > prevCount.current) {
      setBump(true);
      const t = setTimeout(() => setBump(false), 400);
      prevCount.current = cartCount;
      return () => clearTimeout(t);
    }
    prevCount.current = cartCount;
  }, [cartCount]);

  // Close the mobile menu on route change so it never lingers open
  // after tapping a link.
  useEffect(() => setOpen(false), [pathname]);

  const wishlistActive = isNavActive(pathname, '/wishlist', false);
  const cartActive = isNavActive(pathname, '/cart', false);

  async function handleLogout() {
    await logout();
    setOpen(false);
  }

  return (
    <header className="sticky top-0 z-50 border-b border-brass/15 bg-ink/95 backdrop-blur supports-[backdrop-filter]:bg-ink/80">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-4 sm:px-6 lg:px-8">
        <Link href="/" className="shrink-0 font-display text-lg tracking-wide text-cream sm:text-xl">
          FIELD <span className="text-brass">&amp;</span> CO
        </Link>

        <nav className="hidden items-center gap-6 lg:flex xl:gap-8">
          {NAV.map((item) => {
            const active = isNavActive(pathname, item.href, item.exact);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? 'page' : undefined}
                className={clsx(
                  'relative py-1 font-mono text-[13px] uppercase tracking-[0.12em] transition-colors',
                  active ? 'text-brass-light' : 'text-cream/70 hover:text-cream'
                )}
              >
                {item.label}
                {active && <span className="absolute -bottom-[17px] left-0 right-0 h-[2px] rounded-full bg-brass-light" />}
              </Link>
            );
          })}
        </nav>

        <div className="hidden md:block md:w-40 lg:w-56 xl:w-64">
          <SearchBar />
        </div>

        <div className="flex shrink-0 items-center gap-3 sm:gap-4">
          <button
            aria-label="Search"
            onClick={() => setSearchOpen((v) => !v)}
            className="text-cream/80 transition-colors hover:text-brass-light md:hidden"
          >
            <Search size={20} strokeWidth={1.6} />
          </button>
          <Link
            href="/wishlist"
            aria-label="Wishlist"
            aria-current={wishlistActive ? 'page' : undefined}
            className={clsx(
              'relative hidden transition-colors sm:block',
              wishlistActive ? 'text-brass-light' : 'text-cream/80 hover:text-brass-light'
            )}
          >
            <Heart size={20} strokeWidth={1.6} fill={wishlistActive ? 'currentColor' : 'none'} />
            {wishlist.length > 0 && (
              <span className="absolute -right-2 -top-2 flex h-4 w-4 items-center justify-center rounded-full bg-brass text-[10px] font-mono text-ink">
                {wishlist.length}
              </span>
            )}
          </Link>
          <Link
            href="/cart"
            aria-label="Cart"
            aria-current={cartActive ? 'page' : undefined}
            className={clsx(
              'relative transition-colors',
              cartActive ? 'text-brass-light' : 'text-cream/80 hover:text-brass-light',
              bump && 'animate-bump'
            )}
          >
            <ShoppingBag size={21} strokeWidth={1.6} />
            {cartCount > 0 && (
              <span className="absolute -right-2 -top-2 flex h-4 w-4 items-center justify-center rounded-full bg-brass text-[10px] font-mono text-ink">
                {cartCount}
              </span>
            )}
          </Link>

          <div className="hidden lg:block">
            {user ? (
              <UserMenu user={user} onLogout={handleLogout} />
            ) : (
              <div className="flex items-center gap-4">
                <Link href="/login" className="font-mono text-[13px] uppercase tracking-[0.12em] text-cream/70 transition-colors hover:text-cream">
                  Login
                </Link>
                <Link
                  href="/signup"
                  className="rounded-full border border-brass/50 px-4 py-1.5 font-mono text-[13px] uppercase tracking-[0.12em] text-brass-light transition-colors hover:border-brass hover:bg-brass/10"
                >
                  Sign up
                </Link>
              </div>
            )}
          </div>

          <button
            aria-label="Toggle menu"
            aria-expanded={open}
            className="text-cream lg:hidden"
            onClick={() => setOpen((v) => !v)}
          >
            {open ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {searchOpen && (
        <div className="border-t border-brass/15 bg-ink px-4 py-3 sm:px-6 md:hidden">
          <SearchBar mobile onNavigate={() => setSearchOpen(false)} />
        </div>
      )}

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            key="mobile-nav"
            initial={prefersReducedMotion ? false : { height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={prefersReducedMotion ? { opacity: 0 } : { height: 0, opacity: 0 }}
            transition={{ duration: 0.32, ease: [0.16, 0.84, 0.44, 1] }}
            className="overflow-hidden border-t border-brass/15 bg-ink lg:hidden"
          >
            <nav className="flex flex-col gap-1 px-4 py-4 sm:px-6">
              {NAV.map((item) => {
                const active = isNavActive(pathname, item.href, item.exact);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={clsx(
                      'rounded-lg px-3 py-2.5 font-mono text-sm uppercase tracking-wide transition-colors',
                      active ? 'bg-brass/10 text-brass-light' : 'text-cream/80 hover:bg-cream/5'
                    )}
                  >
                    {item.label}
                  </Link>
                );
              })}
              <Link
                href="/wishlist"
                className={clsx(
                  'flex items-center justify-between rounded-lg px-3 py-2.5 font-mono text-sm uppercase tracking-wide transition-colors',
                  wishlistActive ? 'bg-brass/10 text-brass-light' : 'text-cream/80 hover:bg-cream/5'
                )}
              >
                Wishlist {wishlist.length > 0 && <span className="font-mono text-xs text-cream/50">{wishlist.length}</span>}
              </Link>
              <Link
                href="/cart"
                className={clsx(
                  'flex items-center justify-between rounded-lg px-3 py-2.5 font-mono text-sm uppercase tracking-wide transition-colors',
                  cartActive ? 'bg-brass/10 text-brass-light' : 'text-cream/80 hover:bg-cream/5'
                )}
              >
                Cart {cartCount > 0 && <span className="font-mono text-xs text-cream/50">{cartCount}</span>}
              </Link>

              <div className="my-2 border-t border-cream/10" />

              {user ? (
                <>
                  <div className="flex items-center justify-between rounded-lg px-3 py-2">
                    <span className="font-display text-base text-cream">{user.firstName} {user.lastName}</span>
                    {user.isAdmin && (
                      <span className="flex items-center gap-1 rounded-full border border-amber-400/30 bg-amber-400/15 px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.06em] text-amber-300">
                        <ShieldCheck size={11} /> Admin
                      </span>
                    )}
                  </div>
                  {user.isAdmin && (
                    <Link
                      href="/dashboard/admin"
                      className={clsx(
                        'flex items-center gap-2 rounded-lg px-3 py-2.5 font-mono text-sm uppercase tracking-wide transition-colors',
                        isNavActive(pathname, '/dashboard/admin', false) || isNavActive(pathname, '/admin', false)
                          ? 'bg-amber-400/10 text-amber-300'
                          : 'text-cream/80 hover:bg-cream/5'
                      )}
                    >
                      <LayoutDashboard size={15} /> Admin dashboard
                    </Link>
                  )}
                  <Link
                    href="/account"
                    className={clsx(
                      'flex items-center gap-2 rounded-lg px-3 py-2.5 font-mono text-sm uppercase tracking-wide transition-colors',
                      isNavActive(pathname, '/account', false) ? 'bg-brass/10 text-brass-light' : 'text-cream/80 hover:bg-cream/5'
                    )}
                  >
                    <User size={15} /> My account
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-2 rounded-lg px-3 py-2.5 text-left font-mono text-sm uppercase tracking-wide text-cream/60 transition-colors hover:bg-ember/10 hover:text-ember"
                  >
                    <LogOut size={15} /> Logout
                  </button>
                </>
              ) : (
                <>
                  <Link href="/login" className="rounded-lg px-3 py-2.5 font-mono text-sm uppercase tracking-wide text-cream/80 hover:bg-cream/5">
                    Login
                  </Link>
                  <Link href="/signup" className="rounded-lg px-3 py-2.5 font-mono text-sm uppercase tracking-wide text-brass-light hover:bg-cream/5">
                    Sign up
                  </Link>
                </>
              )}
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
