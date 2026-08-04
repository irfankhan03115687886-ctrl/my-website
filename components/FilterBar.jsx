'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import clsx from 'clsx';
import { CATEGORIES, SUBCATEGORIES, TAGS } from '@/lib/catalogConstants';

export default function FilterBar({ active, activeSub, activeTag }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  function handleSort(e) {
    const params = new URLSearchParams(searchParams.toString());
    if (e.target.value === 'featured') params.delete('sort');
    else params.set('sort', e.target.value);
    router.push(`/products?${params.toString()}`);
  }

  function buildHref({ category, subcategory, tag }) {
    const params = new URLSearchParams();
    if (category) params.set('category', category);
    if (subcategory) params.set('subcategory', subcategory);
    if (tag) params.set('tag', tag);
    const sort = searchParams.get('sort');
    if (sort) params.set('sort', sort);
    const qs = params.toString();
    return qs ? `/products?${qs}` : '/products';
  }

  const subcategories = active ? SUBCATEGORIES.filter((s) => s.category === active) : [];

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-2">
          <Link
            href="/products"
            className={clsx(
              'rounded-full border px-4 py-1.5 font-mono text-xs uppercase tracking-[0.1em] transition-colors',
              !active ? 'border-brass bg-brass text-ink' : 'border-cream/20 text-cream/60 hover:border-brass/50 hover:text-cream'
            )}
          >
            All
          </Link>
          {CATEGORIES.map((cat) => (
            <Link
              key={cat.slug}
              href={buildHref({ category: cat.slug, tag: activeTag })}
              className={clsx(
                'rounded-full border px-4 py-1.5 font-mono text-xs uppercase tracking-[0.1em] transition-colors',
                active === cat.slug ? 'border-brass bg-brass text-ink' : 'border-cream/20 text-cream/60 hover:border-brass/50 hover:text-cream'
              )}
            >
              {cat.label}
            </Link>
          ))}
        </div>
        <select
          onChange={handleSort}
          defaultValue={searchParams.get('sort') || 'featured'}
          className="rounded-full border border-brass/25 bg-canvas-2 px-4 py-1.5 font-mono text-xs uppercase tracking-[0.1em] text-ink/70"
        >
          <option value="featured">Featured</option>
          <option value="price-asc">Price: low to high</option>
          <option value="price-desc">Price: high to low</option>
          <option value="rating">Top rated</option>
        </select>
      </div>

      {subcategories.length > 0 && (
        <div className="flex flex-wrap gap-2 border-t border-cream/10 pt-4">
          <span className="mr-1 self-center font-mono text-[11px] uppercase tracking-[0.1em] text-cream/40">Refine:</span>
          <Link
            href={buildHref({ category: active, tag: activeTag })}
            className={clsx(
              'rounded-full border px-3 py-1 font-mono text-[11px] uppercase tracking-[0.08em] transition-colors',
              !activeSub ? 'border-brass-light text-brass-light' : 'border-cream/15 text-cream/45 hover:border-cream/40 hover:text-cream/80'
            )}
          >
            All {CATEGORIES.find((c) => c.slug === active)?.label}
          </Link>
          {subcategories.map((sub) => (
            <Link
              key={sub.slug}
              href={buildHref({ category: active, subcategory: sub.slug, tag: activeTag })}
              className={clsx(
                'rounded-full border px-3 py-1 font-mono text-[11px] uppercase tracking-[0.08em] transition-colors',
                activeSub === sub.slug ? 'border-brass-light text-brass-light' : 'border-cream/15 text-cream/45 hover:border-cream/40 hover:text-cream/80'
              )}
            >
              {sub.label}
            </Link>
          ))}
        </div>
      )}

      <div className="flex flex-wrap gap-2 border-t border-cream/10 pt-4">
        <span className="mr-1 self-center font-mono text-[11px] uppercase tracking-[0.1em] text-cream/40">Tags:</span>
        {TAGS.map((tag) => (
          <Link
            key={tag.slug}
            href={activeTag === tag.slug ? buildHref({ category: active, subcategory: activeSub }) : buildHref({ category: active, subcategory: activeSub, tag: tag.slug })}
            className={clsx(
              'rounded-full border px-3 py-1 font-mono text-[11px] uppercase tracking-[0.08em] transition-colors',
              activeTag === tag.slug ? 'border-forest bg-forest text-cream' : 'border-cream/15 text-cream/45 hover:border-cream/40 hover:text-cream/80'
            )}
          >
            {tag.label}
          </Link>
        ))}
      </div>
    </div>
  );
}
