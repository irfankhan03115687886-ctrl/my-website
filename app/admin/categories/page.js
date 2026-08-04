import { getCategoryTree } from '@/lib/catalog';
import { getAdminSession } from '@/lib/admin';
import { can } from '@/lib/roles';
import RestrictedNotice from '@/components/admin/RestrictedNotice';
import CategoryManager from '@/components/admin/CategoryManager';

export default async function AdminCategoriesPage() {
  const session = await getAdminSession();
  if (!can(session?.role, 'categories')) return <RestrictedNotice role={session?.role} resourceLabel="categories" />;

  const tree = await getCategoryTree();

  return (
    <div>
      <span className="font-mono text-xs uppercase tracking-[0.2em] text-brass-light">Catalog</span>
      <h1 className="mt-2 font-display text-3xl italic text-cream">Categories & subcategories.</h1>
      <p className="mt-2 max-w-xl text-sm text-cream/60">
        Organize the shop into departments and finer subcategories. Showing demo categories until{' '}
        <code className="font-mono text-brass-light">DATABASE_URL</code> is connected — new ones you add here save for real.
      </p>

      <div className="card-surface mt-7 p-7">
        <CategoryManager tree={tree} />
      </div>
    </div>
  );
}
