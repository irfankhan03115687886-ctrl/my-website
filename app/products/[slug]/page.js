import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Star } from 'lucide-react';
import { getAllSlugs, getProductBySlug, getRelatedProducts } from '@/lib/products';
import { getReviewSummary, getApprovedReviews, getOwnReview } from '@/lib/reviews';
import { getSession } from '@/lib/auth';
import ProductDetailActions from '@/components/ProductDetailActions';
import ProductCard from '@/components/ProductCard';
import ProductReviews from '@/components/ProductReviews';
import StampBadge from '@/components/StampBadge';

export async function generateStaticParams() {
  const slugs = await getAllSlugs();
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }) {
  const product = await getProductBySlug(params.slug);
  if (!product) return {};
  return {
    title: product.name,
    description: product.desc,
    openGraph: {
      title: product.name,
      description: product.desc,
      images: [{ url: product.img, width: 900, height: 1125, alt: product.name }],
    },
  };
}

export default async function ProductPage({ params }) {
  const product = await getProductBySlug(params.slug);
  if (!product) notFound();
  const related = await getRelatedProducts(product);
  const [summary, approvedReviews, session] = await Promise.all([
    getReviewSummary(product.slug),
    getApprovedReviews(product.slug),
    getSession(),
  ]);
  const ownReview = session ? await getOwnReview(product.slug, session.id) : null;
  // Fall back to the product's seeded rating/count (e.g. from CSV import)
  // until real reviews exist, so the page doesn't show "0 reviews" the
  // moment review moderation ships on an already-populated catalog.
  const displayRating = summary.count > 0 ? summary.average : product.rating;
  const displayReviewCount = summary.count > 0 ? summary.count : product.reviews;

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description: product.desc,
    image: product.img,
    sku: product.id,
    offers: {
      '@type': 'Offer',
      price: product.price,
      priceCurrency: 'USD',
      availability: product.stock > 0 ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
    },
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: displayRating,
      reviewCount: displayReviewCount,
    },
  };

  return (
    <section className="mx-auto max-w-7xl bg-ink px-5 py-12 sm:px-8">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <nav className="mb-8 font-mono text-xs uppercase tracking-[0.1em] text-cream/50">
        <Link href="/products" className="hover:text-brass-light">Shop</Link>
        <span className="mx-2">/</span>
        <span className="text-cream">{product.name}</span>
      </nav>

      <div className="grid gap-12 lg:grid-cols-2">
        <div className="relative aspect-[4/5] overflow-hidden rounded-md border border-brass/30 bg-canvas-2 shadow-[0_10px_36px_rgba(0,0,0,0.35)]">
          <StampBadge label={product.badge} />
          <Image src={product.img} alt={product.name} fill sizes="(max-width: 1024px) 100vw, 50vw" priority className="object-cover" />
        </div>

        <div>
          <h1 className="font-display text-4xl italic text-cream">{product.name}</h1>
          <div className="mt-3 flex items-center gap-2 text-sm text-cream/60">
            <Star size={14} fill="#15654E" stroke="none" />
            <span className="font-mono">{displayRating}</span>
            <span>· {displayReviewCount} reviews</span>
          </div>
          <div className="mt-5 flex items-baseline gap-3">
            <span className="font-mono text-2xl text-cream">${product.price}</span>
            {product.oldPrice && <span className="font-mono text-base text-cream/40 line-through">${product.oldPrice}</span>}
          </div>
          <p className="mt-5 max-w-md text-[15px] leading-relaxed text-cream/70">{product.desc}</p>

          <ul className="mt-6 space-y-2 border-t border-brass/15 pt-6">
            {product.specs.map((spec) => (
              <li key={spec} className="flex gap-3 text-sm text-cream/70">
                <span className="text-brass-light">—</span>
                {spec}
              </li>
            ))}
          </ul>

          <ProductDetailActions product={product} />

          <p className="mt-4 font-mono text-xs uppercase tracking-[0.08em] text-cream/40">
            {product.stock > 0 ? `${product.stock} in stock` : 'Currently unavailable'} · Ships in 2–4 business days
          </p>
        </div>
      </div>

      {related.length > 0 && (
        <div className="mt-24">
          <h2 className="font-display text-2xl italic text-cream">You might also carry</h2>
          <div className="mt-8 grid grid-cols-2 gap-5 lg:grid-cols-4">
            {related.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </div>
      )}

      <ProductReviews productSlug={product.slug} summary={summary} reviews={approvedReviews} ownReview={ownReview} />
    </section>
  );
}
