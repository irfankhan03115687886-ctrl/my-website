import Link from 'next/link';
import NewsletterForm from './NewsletterForm';

const SHOP_LINKS = [
  { href: '/products', label: 'All products' },
  { href: '/products?category=packs', label: 'Packs & bags' },
  { href: '/products?category=outerwear', label: 'Outerwear' },
  { href: '/products?category=footwear', label: 'Footwear' },
];

const COMPANY_LINKS = [
  { href: '/#story', label: 'Our story' },
  { href: '/collections', label: 'Collections' },
  { href: '/contact', label: 'Contact' },
  { href: '/login', label: 'Account' },
];

export default function Footer() {
  return (
    <footer className="border-t border-ink/10 bg-ink text-cream/80">
      <div className="mx-auto max-w-7xl px-5 py-20 sm:px-8">
        <div className="grid gap-12 sm:grid-cols-2 lg:grid-cols-[1.3fr_1fr_1fr_1.3fr]">
          <div>
            <Link href="/" className="font-display text-lg text-cream">
              FIELD <span className="text-brass">&amp;</span> CO
            </Link>
            <p className="mt-4 max-w-[30ch] text-sm leading-relaxed text-cream/55">
              Gear built in small batches, for long trails and longer memories.
            </p>
          </div>
          <div>
            <h4 className="font-mono text-xs uppercase tracking-[0.16em] text-brass-light">Shop</h4>
            <ul className="mt-5 space-y-2.5 text-sm">
              {SHOP_LINKS.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-cream/65 transition-colors hover:text-cream">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="font-mono text-xs uppercase tracking-[0.16em] text-brass-light">Company</h4>
            <ul className="mt-5 space-y-2.5 text-sm">
              {COMPANY_LINKS.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-cream/65 transition-colors hover:text-cream">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="font-mono text-xs uppercase tracking-[0.16em] text-brass-light">Field notes</h4>
            <p className="mt-5 text-sm leading-relaxed text-cream/55">New drops and restocks, twice a month. No spam, ever.</p>
            <div className="mt-4">
              <NewsletterForm variant="dark" />
            </div>
          </div>
        </div>
        <div className="mt-16 flex flex-col items-center gap-3 border-t border-ink/10 pt-8 text-xs text-cream/40 sm:flex-row sm:justify-between">
          <span>© {new Date().getFullYear()} Field &amp; Co. All rights reserved.</span>
          <span className="font-mono uppercase tracking-[0.14em]">Made for the trail.</span>
        </div>
      </div>
    </footer>
  );
}
