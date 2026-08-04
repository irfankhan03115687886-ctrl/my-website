import Link from 'next/link';
import Image from 'next/image';
import { getFeaturedProducts, CATEGORIES } from '@/lib/products';
import { getActiveCollections } from '@/lib/catalog';
import { getHeroContent } from '@/lib/hero';
import ProductCard from '@/components/ProductCard';
import Marquee from '@/components/Marquee';
import Reveal from '@/components/Reveal';
import NewsletterForm from '@/components/NewsletterForm';
import Embers from '@/components/Embers';
import Magnetic from '@/components/Magnetic';
import CollectionBanners from '@/components/CollectionBanners';
import AnimatedStat from '@/components/AnimatedStat';

const CATEGORY_IMAGES = {
  packs: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?q=80&w=600&auto=format&fit=crop',
  outerwear: 'https://images.unsplash.com/photo-1517438476312-10d79c077509?q=80&w=600&auto=format&fit=crop',
  footwear: 'https://images.unsplash.com/photo-1520639888713-7851133b1ed0?q=80&w=600&auto=format&fit=crop',
  accessories: 'https://images.unsplash.com/photo-1516478177764-9fe5bd7e9717?q=80&w=600&auto=format&fit=crop',
};

export default async function HomePage() {
  const featured = await getFeaturedProducts(4);
  const collections = await getActiveCollections();
  const hero = await getHeroContent();

  return (
    <>
      {/* HERO — editable at /dashboard/admin/hero */}
      <section className="relative overflow-hidden bg-ink">
        <div className="absolute inset-0">
          <Image src={hero.image_url} alt="" fill priority className="object-cover opacity-45" />
          <div className="absolute inset-0 bg-aurora animate-drift" />
          <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/60 to-ink/20" />
          <Embers />
        </div>

        <div className="relative mx-auto flex max-w-7xl flex-col px-5 py-28 sm:px-8 sm:py-36">
          {hero.eyebrow && (
            <span className="font-mono text-xs uppercase tracking-[0.2em] text-brass-light">{hero.eyebrow}</span>
          )}
          <h1 className="mt-5 max-w-xl font-display text-5xl italic leading-[1.05] text-cream sm:text-6xl">
            {hero.title} {hero.highlight && <span className="text-brass-light not-italic">{hero.highlight}</span>}
          </h1>
          {hero.subtitle && <p className="mt-6 max-w-md text-[15px] leading-relaxed text-cream/70">{hero.subtitle}</p>}
          <div className="mt-9 flex flex-wrap gap-4">
            {hero.cta_label && (
              <Magnetic>
                <Link href={hero.cta_href || '/products'} className="btn-primary animate-glow-pulse">
                  {hero.cta_label}
                </Link>
              </Magnetic>
            )}
            {hero.secondary_cta_label && (
              <Magnetic strength={12}>
                <Link href={hero.secondary_cta_href || '/#story'} className="btn-outline">
                  {hero.secondary_cta_label}
                </Link>
              </Magnetic>
            )}
          </div>
          <div className="mt-16 flex flex-wrap gap-10 border-t border-cream/15 pt-8">
            {[
              ['12yr', 'Warranty on hardware'],
              ['14', 'Field-tested styles'],
              ['3.2k', 'Trail reviews'],
            ].map(([n, l]) => (
              <div key={l}>
                <div className="font-display text-2xl text-cream">
                  <AnimatedStat value={n} />
                </div>
                <div className="font-mono text-[11px] uppercase tracking-[0.1em] text-cream/50">{l}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* TRAIL LOG */}
      <section className="bg-ink py-16">
        <Reveal className="mx-auto mb-8 max-w-7xl px-5 sm:px-8">
          <span className="font-mono text-xs uppercase tracking-[0.2em] text-brass-light">The Trail Log</span>
          <h2 className="mt-3 font-display text-3xl italic text-cream">Gear in motion, live from the field.</h2>
        </Reveal>
        <Marquee />
      </section>

      {/* CATEGORIES */}
      <section className="border-t border-brass/10 bg-ink py-24">
        <div className="mx-auto max-w-7xl px-5 sm:px-8">
          <Reveal className="mb-12">
            <span className="font-mono text-xs uppercase tracking-[0.2em] text-brass-light">Shop by category</span>
            <h2 className="mt-3 font-display text-3xl italic text-cream">Everything for the next departure.</h2>
          </Reveal>
          <div className="grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-4">
            {CATEGORIES.map((cat, i) => (
              <Reveal key={cat.slug} delay={i * 80}>
                <Link href={`/products?category=${cat.slug}`} className="group relative block aspect-[4/5] overflow-hidden rounded-md border border-brass/20 transition-colors hover:border-brass/60">
                  <Image src={CATEGORY_IMAGES[cat.slug]} alt={cat.label} fill sizes="(max-width: 768px) 50vw, 25vw" className="object-cover transition-transform duration-700 group-hover:scale-105" />
                  <div className="absolute inset-0 bg-gradient-to-t from-ink/85 via-ink/15 to-transparent" />
                  <span className="absolute bottom-4 left-4 font-display text-lg italic text-cream">{cat.label}</span>
                </Link>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* FEATURED */}
      <section className="bg-ink pb-24">
        <div className="mx-auto max-w-7xl px-5 sm:px-8">
          <Reveal className="mb-12">
            <span className="font-mono text-xs uppercase tracking-[0.2em] text-brass-light">Best sellers</span>
            <h2 className="mt-3 font-display text-3xl italic text-cream">Field-tested favorites.</h2>
          </Reveal>
          <div className="grid grid-cols-2 gap-5 lg:grid-cols-4">
            {featured.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
          <div className="mt-12 text-center">
            <Link href="/products" className="btn-outline">
              View all products
            </Link>
          </div>
        </div>
      </section>

      {/* COLLECTIONS */}
      <CollectionBanners collections={collections} />

      {/* STORY */}
      <section id="story" className="bg-forest py-24 text-cream">
        <div className="mx-auto grid max-w-7xl gap-12 px-5 sm:px-8 lg:grid-cols-2">
          <Reveal>
            <span className="font-mono text-xs uppercase tracking-[0.2em] text-brass-light">Since 2014</span>
            <h2 className="mt-3 font-display text-3xl italic">Made for the miles that matter.</h2>
            <p className="mt-5 max-w-md text-[15px] leading-relaxed text-cream/70">
              Field &amp; Co started in a two-room workshop stitching packs for a local trail crew.
              A decade later, every seam is still sewn to be resewn — because gear that lasts is
              the only gear worth carrying.
            </p>
            <Link href="/contact" className="btn-primary mt-7">
              Get in touch
            </Link>
          </Reveal>
          <Reveal delay={120} className="space-y-6 border-l border-cream/15 pl-8">
            {[
              'Waxed cotton canvas, sourced from a family mill in Scotland.',
              'Solid brass hardware that ages instead of failing.',
              'Every pack backed by a 12-year hardware warranty.',
            ].map((line, i) => (
              <div key={i} className="flex gap-4">
                <span className="font-mono text-xs text-brass-light">0{i + 1}</span>
                <p className="text-[15px] text-cream/80">{line}</p>
              </div>
            ))}
          </Reveal>
        </div>
      </section>

      {/* NEWSLETTER */}
      <section className="bg-ink py-20">
        <Reveal className="card-surface mx-auto flex max-w-7xl flex-col items-start justify-between gap-8 px-8 py-12 sm:flex-row sm:items-center sm:px-12">
          <div>
            <h2 className="font-display text-2xl italic text-ink">Join the dispatch.</h2>
            <p className="mt-2 max-w-sm text-sm text-ink/60">New drops, restocks, and field notes — once every couple weeks, never more.</p>
          </div>
          <NewsletterForm />
        </Reveal>
      </section>
    </>
  );
}
