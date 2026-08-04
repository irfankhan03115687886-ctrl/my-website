
import './globals.css';
import { Fraunces, Inter, IBM_Plex_Mono } from 'next/font/google';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { CartProvider } from '@/context/CartContext';
import { AuthProvider } from '@/context/AuthContext';
import Toast from '@/components/Toast';
import CursorGlow from '@/components/CursorGlow';
import ThemeSwitcher from '@/components/ThemeSwitcher';

const fraunces = Fraunces({
  subsets: ['latin'],
  variable: '--font-fraunces',
  weight: ['400', '500', '600'],
  style: ['normal', 'italic'],
  display: 'swap',
});

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

const plexMono = IBM_Plex_Mono({
  subsets: ['latin'],
  weight: ['400', '500'],
  variable: '--font-plex-mono',
  display: 'swap',
});

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://fieldandco.example.com';

export const metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: 'Field & Co — Gear Built for the Trail',
    template: '%s | Field & Co',
  },
  description:
    'Waxed canvas packs, ripstop shells and brass-buckled boots, built in small batches for people who leave the trailhead before sunrise.',
  keywords: ['outdoor gear', 'hiking backpacks', 'waxed canvas jacket', 'hiking boots', 'trail gear', 'Field & Co'],
  openGraph: {
    type: 'website',
    siteName: 'Field & Co',
    title: 'Field & Co — Gear Built for the Trail',
    description: 'Small-batch outdoor gear built for long trails and longer memories.',
    url: SITE_URL,
    images: [{ url: 'https://images.unsplash.com/photo-1516939884455-1445c8652f83?q=80&w=1200&auto=format&fit=crop', width: 1200, height: 630, alt: 'Hiker crossing a ridge at dusk' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Field & Co — Gear Built for the Trail',
    description: 'Small-batch outdoor gear built for long trails and longer memories.',
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({ children }) {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Field & Co',
    url: SITE_URL,
    description: 'Small-batch outdoor gear: packs, outerwear, footwear and accessories built for the trail.',
    foundingDate: '2014',
  };

  return (
    <html lang="en" data-theme="dusk" className={`${fraunces.variable} ${inter.variable} ${plexMono.variable}`}>
      <body className="font-body">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-full focus:bg-cream focus:px-5 focus:py-2.5 focus:font-mono focus:text-xs focus:uppercase focus:tracking-[0.1em] focus:text-ink"
        >
          Skip to content
        </a>
        <AuthProvider>
        <CartProvider>
          <CursorGlow />
          <Header />
          <main id="main-content">{children}</main>
          <Footer />
          <Toast />
          <ThemeSwitcher />
        </CartProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
