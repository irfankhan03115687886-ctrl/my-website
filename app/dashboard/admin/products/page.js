import Link from 'next/link';
import { Plus } from 'lucide-react';
import { getAllProductsFlat } from '@/lib/products';
import { listBrands } from '@/lib/brands';
import ProductsTable from '@/components/admin/ProductsTable';

export default async function DashboardProductsPage() {
  const [products, brands] = await Promise.all([getAllProductsFlat(), listBrands()]);

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <span className="font-mono text-xs uppercase tracking-[0.2em] text-brass-light">Catalog</span>
          <h1 className="mt-2 font-display text-3xl italic text-cream">Products.</h1>
          <p className="mt-2 max-w-xl text-sm text-cream/60">
            Add, edit, price, stock, and photograph every product from here.
          </p>
        </div>
        <Link href="/dashboard/admin/products/new" className="btn-dark shrink-0">
          <Plus size={15} className="mr-1.5" /> New product
        </Link>
      </div>

      <div className="mt-7">
        <ProductsTable products={products} brands={brands} editBasePath="/dashboard/admin/products" />
      </div>
    </div>
  );
}
