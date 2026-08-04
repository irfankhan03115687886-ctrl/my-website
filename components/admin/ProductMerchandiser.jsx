'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import clsx from 'clsx';

export default function ProductMerchandiser({ slug, allTags, activeTagIds, allCollections, activeCollectionIds }) {
  const router = useRouter();
  const [pending, setPending] = useState(null);

  async function toggleTag(tag) {
    const attach = !activeTagIds.includes(tag.id);
    setPending(`tag-${tag.id}`);
    try {
      await fetch(`/api/admin/products/${slug}/tags`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tagId: tag.id, attach }),
      });
      router.refresh();
    } finally {
      setPending(null);
    }
  }

  async function toggleCollection(collection) {
    const attach = !activeCollectionIds.includes(collection.id);
    setPending(`col-${collection.id}`);
    try {
      await fetch(`/api/admin/products/${slug}/collections`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ collectionId: collection.id, attach }),
      });
      router.refresh();
    } finally {
      setPending(null);
    }
  }

  return (
    <div className="grid gap-6 sm:grid-cols-2">
      <div>
        <h3 className="font-mono text-xs uppercase tracking-[0.1em] text-ink/50">Tags</h3>
        <div className="mt-3 flex flex-wrap gap-2">
          {allTags.map((tag) => {
            const active = activeTagIds.includes(tag.id);
            return (
              <button
                key={tag.id}
                onClick={() => toggleTag(tag)}
                disabled={pending === `tag-${tag.id}`}
                className={clsx(
                  'rounded-full border px-4 py-1.5 font-mono text-xs uppercase tracking-[0.1em] transition-colors',
                  active ? 'border-forest bg-forest text-cream' : 'border-ink/15 text-ink/50 hover:border-forest/50'
                )}
              >
                {tag.label}
              </button>
            );
          })}
          {allTags.length === 0 && <p className="text-sm text-ink/50">No tags yet — add some on the Tags page.</p>}
        </div>
      </div>

      <div>
        <h3 className="font-mono text-xs uppercase tracking-[0.1em] text-ink/50">Collections</h3>
        <div className="mt-3 flex flex-wrap gap-2">
          {allCollections.map((c) => {
            const active = activeCollectionIds.includes(c.id);
            return (
              <button
                key={c.id}
                onClick={() => toggleCollection(c)}
                disabled={pending === `col-${c.id}`}
                className={clsx(
                  'rounded-full border px-4 py-1.5 font-mono text-xs uppercase tracking-[0.1em] transition-colors',
                  active ? 'border-brass bg-brass text-ink' : 'border-ink/15 text-ink/50 hover:border-brass/50'
                )}
              >
                {c.title}
              </button>
            );
          })}
          {allCollections.length === 0 && <p className="text-sm text-ink/50">No collections yet — add one on the Collections page.</p>}
        </div>
      </div>
    </div>
  );
}
