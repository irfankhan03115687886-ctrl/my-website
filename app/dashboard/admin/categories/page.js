import { getCategoryTree } from '@/lib/catalog';
import CategoryManager from '@/components/admin/CategoryManager';

export default async function DashboardCategoriesPage() {
  const tree = await getCategoryTree();

  return (
    <div>
      <span className="font-mono text-xs uppercase tracking-[0.2em] text-brass-light">Catalog</span>
      <h1 className="mt-2 font-display text-3xl italic text-cream">Categories.</h1>
      <p className="mt-2 max-w-xl text-sm text-cream/60">
        Top-level departments for the shop. Manage finer subcategories separately under{' '}
        <span className="text-brass-light">Sub-Categories</span> in the sidebar.
      </p>

      <div className="card-surface mt-7 p-7">
        <CategoryManager tree={tree} />
      </div>
    </div>
  );
}
