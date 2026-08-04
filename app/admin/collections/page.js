import { getAllCollectionsAdmin } from '@/lib/catalog';
import { getAdminSession } from '@/lib/admin';
import { can } from '@/lib/roles';
import RestrictedNotice from '@/components/admin/RestrictedNotice';
import CollectionManager from '@/components/admin/CollectionManager';

export default async function AdminCollectionsPage() {
  const session = await getAdminSession();
  if (!can(session?.role, 'collections')) return <RestrictedNotice role={session?.role} resourceLabel="collections" />;

  const collections = await getAllCollectionsAdmin();

  return (
    <div>
      <span className="font-mono text-xs uppercase tracking-[0.2em] text-brass-light">Merchandising</span>
      <h1 className="mt-2 font-display text-3xl italic text-cream">Collections.</h1>
      <p className="mt-2 max-w-xl text-sm text-cream/60">
        Banners shown on the homepage and at <code className="font-mono text-brass-light">/collections</code>. Attach products
        to a collection from the Products tab.
      </p>

      <div className="card-surface mt-7 p-7">
        <CollectionManager collections={collections} />
      </div>
    </div>
  );
}
