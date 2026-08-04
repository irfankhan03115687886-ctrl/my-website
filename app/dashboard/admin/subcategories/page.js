import { getCategoryTree } from '@/lib/catalog';
import SubcategoryManager from '@/components/dashboard/SubcategoryManager';

export default async function DashboardSubcategoriesPage() {
  const tree = await getCategoryTree();

  return (
    <div>
      <span className="font-mono text-xs uppercase tracking-[0.2em] text-brass-light">Catalog</span>
      <h1 className="mt-2 font-display text-3xl italic text-cream">Sub-categories.</h1>
      <p className="mt-2 max-w-xl text-sm text-cream/60">
        Finer groupings that nest under a category — e.g. "Daypacks" under "Packs & Bags".
      </p>

      <div className="card-surface mt-7 p-7">
        <SubcategoryManager tree={tree} />
      </div>
    </div>
  );
}
