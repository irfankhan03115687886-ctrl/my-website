import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft } from 'lucide-react';
import { getProductBySlug } from '@/lib/products';
import { getAllTags, getTagsForProduct, getAllCollectionsAdmin } from '@/lib/catalog';
import { getProductByIdAdmin } from '@/lib/adminProducts';
import ProductMerchandiser from '@/components/admin/ProductMerchandiser';
import ProductForm from '@/components/admin/ProductForm';
import ProductImageManager from '@/components/admin/ProductImageManager';

export default async function DashboardProductEditPage({ params }) {
  const product = await getProductBySlug(params.slug);
  if (!product) {
    return (
      <div>
        <Link href="/dashboard/admin/products" className="inline-flex items-center gap-1.5 font-mono text-xs uppercase tracking-[0.12em] text-cream/60 hover:text-cream">
          <ArrowLeft size={14} /> Back to products
        </Link>
        <p className="mt-8 text-cream/60">Product not found.</p>
      </div>
    );
  }

  const [allTags, productTags, allCollections, fullProduct] = await Promise.all([
    getAllTags(),
    getTagsForProduct(params.slug),
    getAllCollectionsAdmin(),
    getProductByIdAdmin(product.id),
  ]);

  const activeTagIds = productTags.map((t) => t.id);
  const activeCollectionIds = allCollections.filter((c) => c.products?.includes(params.slug)).map((c) => c.id);

  return (
    <div>
      <Link href="/dashboard/admin/products" className="inline-flex items-center gap-1.5 font-mono text-xs uppercase tracking-[0.12em] text-cream/60 hover:text-cream">
        <ArrowLeft size={14} /> Back to products
      </Link>

      <div className="mt-6 flex items-center gap-4">
        <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-md bg-ink/10">
          <Image src={product.img} alt={product.name} fill className="object-cover" />
        </div>
        <div>
          <span className="font-mono text-xs uppercase tracking-[0.2em] text-brass-light">
            {product.category} · {product.subcategory}
          </span>
          <h1 className="font-display text-2xl italic text-cream">{product.name}</h1>
        </div>
      </div>

      <div className="card-surface mt-7 max-w-3xl p-7">
        <h2 className="font-display text-lg text-ink">Product details</h2>
        <div className="mt-5">
          <ProductForm product={fullProduct} redirectBasePath="/dashboard/admin/products" />
        </div>
      </div>

      <div className="card-surface mt-6 max-w-3xl p-7">
        <h2 className="font-display text-lg text-ink">Images</h2>
        <div className="mt-5">
          <ProductImageManager slug={product.slug} images={fullProduct.images} />
        </div>
      </div>

      <div className="card-surface mt-6 p-7">
        <h2 className="font-display text-lg text-ink">Tags & collections</h2>
        <div className="mt-5">
          <ProductMerchandiser
            slug={params.slug}
            allTags={allTags}
            activeTagIds={activeTagIds}
            allCollections={allCollections}
            activeCollectionIds={activeCollectionIds}
          />
        </div>
      </div>
    </div>
  );
}
