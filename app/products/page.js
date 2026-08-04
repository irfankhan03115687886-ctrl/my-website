import { Suspense } from 'react';
import { getProducts, CATEGORIES, SUBCATEGORIES, TAGS } from '@/lib/products';
import ProductCard from '@/components/ProductCard';
import FilterBar from '@/components/FilterBar';

export const metadata = {
  title: 'Shop All Gear',
  description: 'Browse waxed canvas packs, storm-ready outerwear, resoleable boots and field accessories from Field & Co.',
};

function sortProducts(products, sort) {
  const list = [...products];
  if (sort === 'price-asc') return list.sort((a, b) => a.price - b.price);
  if (sort === 'price-desc') return list.sort((a, b) => b.price - a.price);
  if (sort === 'rating') return list.sort((a, b) => b.rating - a.rating);
  return list;
}

export default async function ProductsPage({ searchParams }) {
  const category = searchParams?.category;
  const subcategory = searchParams?.subcategory;
  const tag = searchParams?.tag;
  const sort = searchParams?.sort;
  const search = searchParams?.search;
  const products = sortProducts(await getProducts({ category, subcategory, tag, search }), sort);
  const categoryLabel = CATEGORIES.find((c) => c.slug === category)?.label;
  const subLabel = SUBCATEGORIES.find((s) => s.slug === subcategory)?.label;
  const tagLabel = TAGS.find((t) => t.slug === tag)?.label;

  const heading = search ? `Results for "${search}"` : subLabel || categoryLabel || 'Shop the full collection';
  const eyebrow = search ? 'Search' : [categoryLabel, subLabel, tagLabel].filter(Boolean).join(' · ') || 'All products';

  return (
    <section className="mx-auto max-w-7xl bg-ink px-5 py-16 sm:px-8">
      <span className="font-mono text-xs uppercase tracking-[0.2em] text-brass-light">{eyebrow}</span>
      <h1 className="mt-3 font-display text-4xl italic text-cream">{heading}</h1>
      <p className="mt-3 max-w-lg text-sm text-cream/60">
        {products.length} {products.length === 1 ? 'style' : 'styles'} in stock and ready to ship.
      </p>

      <div className="mt-8">
        <Suspense fallback={null}>
          <FilterBar active={category} activeSub={subcategory} activeTag={tag} />
        </Suspense>
      </div>

      {products.length === 0 ? (
        <div className="mt-16 rounded-md border border-dashed border-brass/25 py-16 text-center">
          <p className="font-display text-xl italic text-cream">No products found.</p>
          <p className="mt-2 text-sm text-cream/60">
            {search ? 'Try a different search term, or browse by category below.' : 'Try another category — new styles ship every season.'}
          </p>
        </div>
      ) : (
        <div className="mt-10 grid grid-cols-2 gap-5 lg:grid-cols-4">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </section>
  );
}
