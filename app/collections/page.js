import Link from 'next/link';
import Image from 'next/image';
import Reveal from '@/components/Reveal';
import { getActiveCollections } from '@/lib/catalog';

export const metadata = {
  title: 'Collections',
  description: 'Curated edits of Field & Co gear, built around a season, a trip, or a trail.',
};

export default async function CollectionsPage() {
  const collections = await getActiveCollections();

  return (
    <section className="mx-auto max-w-7xl bg-ink px-5 py-16 sm:px-8">
      <span className="font-mono text-xs uppercase tracking-[0.2em] text-brass-light">Collections</span>
      <h1 className="mt-3 font-display text-4xl italic text-cream">Curated edits.</h1>
      <p className="mt-3 max-w-lg text-sm text-cream/60">Gear grouped around a season, a trip, or a trail — not just a category.</p>

      <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {collections.map((c, i) => (
          <Reveal key={c.id} delay={i * 90}>
            <Link
              href={`/collections/${c.slug}`}
              className="group relative block aspect-[4/3] overflow-hidden rounded-md border border-brass/20 transition-colors hover:border-brass/60"
            >
              {c.image_url && (
                <Image src={c.image_url} alt={c.title} fill sizes="(max-width: 768px) 100vw, 33vw" className="object-cover transition-transform duration-700 group-hover:scale-105" />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-ink/90 via-ink/25 to-transparent" />
              <div className="absolute bottom-5 left-5 right-5">
                <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-brass-light">{(c.products || []).length} styles</span>
                <h2 className="mt-1 font-display text-xl italic text-cream">{c.title}</h2>
                {c.subtitle && <p className="mt-1 text-sm text-cream/70">{c.subtitle}</p>}
              </div>
            </Link>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
