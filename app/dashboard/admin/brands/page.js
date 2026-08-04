import { listBrands } from '@/lib/brands';
import BrandManager from '@/components/dashboard/BrandManager';

export default async function DashboardBrandsPage() {
  const brands = await listBrands();

  return (
    <div>
      <span className="font-mono text-xs uppercase tracking-[0.2em] text-brass-light">Catalog</span>
      <h1 className="mt-2 font-display text-3xl italic text-cream">Brands.</h1>
      <p className="mt-2 max-w-xl text-sm text-cream/60">
        Manage the brand directory — assign a brand to any product from its edit page under Products.
      </p>

      <div className="card-surface mt-7 p-7">
        <BrandManager brands={brands} />
      </div>
    </div>
  );
}
