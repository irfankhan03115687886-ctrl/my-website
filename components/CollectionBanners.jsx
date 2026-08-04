import Link from 'next/link';
import Image from 'next/image';
import Reveal from './Reveal';

export default function CollectionBanners({ collections }) {
  if (!collections || collections.length === 0) return null;

  return (
    <section className="border-t border-brass/10 bg-ink py-24">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <Reveal className="mb-12 flex items-end justify-between">
          <div>
            <span className="font-mono text-xs uppercase tracking-[0.2em] text-brass-light">Collections</span>
            <h2 className="mt-3 font-display text-3xl italic text-cream">Curated for the season ahead.</h2>
          </div>
          <Link href="/collections" className="hidden font-mono text-xs uppercase tracking-[0.1em] text-cream/60 hover:text-cream sm:block">
            View all →
          </Link>
        </Reveal>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {collections.map((c, i) => (
            <Reveal key={c.id} delay={i * 100}>
              <Link
                href={`/collections/${c.slug}`}
                className="group relative block aspect-[4/3] overflow-hidden rounded-md border border-brass/20 transition-colors hover:border-brass/60"
              >
                {c.image_url && (
                  <Image
                    src={c.image_url}
                    alt={c.title}
                    fill
                    sizes="(max-width: 768px) 100vw, 33vw"
                    className="object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-ink/90 via-ink/25 to-transparent" />
                <div className="absolute bottom-5 left-5 right-5">
                  <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-brass-light">
                    {(c.products || []).length} styles
                  </span>
                  <h3 className="mt-1 font-display text-xl italic text-cream">{c.title}</h3>
                  {c.subtitle && <p className="mt-1 text-sm text-cream/70">{c.subtitle}</p>}
                </div>
              </Link>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
