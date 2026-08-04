import { getAllTags } from '@/lib/catalog';
import { getAdminSession } from '@/lib/admin';
import { can } from '@/lib/roles';
import RestrictedNotice from '@/components/admin/RestrictedNotice';
import TagManager from '@/components/admin/TagManager';

export default async function AdminTagsPage() {
  const session = await getAdminSession();
  if (!can(session?.role, 'tags')) return <RestrictedNotice role={session?.role} resourceLabel="tags" />;

  const tags = await getAllTags();

  return (
    <div>
      <span className="font-mono text-xs uppercase tracking-[0.2em] text-brass-light">Catalog</span>
      <h1 className="mt-2 font-display text-3xl italic text-cream">Tags.</h1>
      <p className="mt-2 max-w-xl text-sm text-cream/60">
        Merchandising labels like "Best Seller" or "Waterproof" — attach them to products from the Products tab.
      </p>

      <div className="card-surface mt-7 p-7">
        <TagManager tags={tags} />
      </div>
    </div>
  );
}
