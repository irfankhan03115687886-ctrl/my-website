import Link from 'next/link';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import { getCollectionWithProducts } from '@/lib/catalog';
import ProductCard from '@/components/ProductCard';

export async function generateMetadata({ params }) {
  const collection = await getCollectionWithProducts(params.slug);
  if (!collection) return {};
  return { title: collection.title, description: collection.subtitle };
}

export default async function CollectionDetailPage({ params }) {
  const collection = await getCollectionWithProducts(params.slug);
  if (!collection) notFound();

  return (
    <section className="bg-ink">
      <div className="relative overflow-hidden">
        <div className="absolute inset-0">
          {collection.image_url && <Image src={collection.image_url} alt="" fill className="object-cover opacity-40" />}
          <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/70 to-ink/30" />
        </div>
        <div className="relative mx-auto max-w-7xl px-5 py-24 sm:px-8 sm:py-32">
          <Link href="/collections" className="font-mono text-xs uppercase tracking-[0.2em] text-brass-light hover:underline">
            ← All collections
          </Link>
          <h1 className="mt-5 max-w-xl font-display text-4xl italic text-cream sm:text-5xl">{collection.title}</h1>
          {collection.subtitle && <p className="mt-4 max-w-md text-[15px] leading-relaxed text-cream/70">{collection.subtitle}</p>}
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-5 py-16 sm:px-8">
        {collection.resolvedProducts.length === 0 ? (
          <p className="text-sm text-cream/60">No products assigned to this collection yet.</p>
        ) : (
          <div className="grid grid-cols-2 gap-5 lg:grid-cols-4">
            {collection.resolvedProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
