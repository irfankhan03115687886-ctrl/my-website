'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Trash2 } from 'lucide-react';

function slugify(v) {
  return v.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

export default function SubcategoryManager({ tree }) {
  const router = useRouter();
  const [label, setLabel] = useState('');
  const [parentId, setParentId] = useState(tree[0]?.id || '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function handleCreate(e) {
    e.preventDefault();
    if (!label.trim() || !parentId) return;
    setSaving(true);
    setError('');
    try {
      const res = await fetch('/api/admin/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug: slugify(label), label: label.trim(), parentId }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message || 'Failed to create subcategory');
      setLabel('');
      router.refresh();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id) {
    try {
      await fetch(`/api/admin/categories/${id}`, { method: 'DELETE' });
      router.refresh();
    } catch {
      // no-op
    }
  }

  const hasParents = tree.length > 0;

  return (
    <div>
      <form onSubmit={handleCreate} className="flex flex-wrap gap-3">
        <select value={parentId} onChange={(e) => setParentId(e.target.value)} className="input flex-1" disabled={!hasParents}>
          {tree.map((c) => (
            <option key={c.id} value={c.id}>
              {c.label}
            </option>
          ))}
        </select>
        <input
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          placeholder="Subcategory name"
          className="input flex-1"
          disabled={!hasParents}
        />
        <button type="submit" disabled={saving || !hasParents} className="btn-dark shrink-0">
          <Plus size={15} className="mr-1.5" /> Add subcategory
        </button>
      </form>
      {!hasParents && <p className="mt-2 text-xs text-ink/50">Create a category first, then come back to add subcategories.</p>}
      {error && <p className="mt-2 text-xs text-ember">{error}</p>}

      <div className="mt-7 space-y-6">
        {tree.map((cat) => (
          <div key={cat.id}>
            <h3 className="font-display text-base text-ink">{cat.label}</h3>
            {cat.children.length === 0 ? (
              <p className="mt-1 text-sm text-ink/45">No subcategories yet.</p>
            ) : (
              <ul className="mt-2 flex flex-wrap gap-2">
                {cat.children.map((sub) => (
                  <li key={sub.id} className="flex items-center gap-2 rounded-full border border-ink/10 px-3 py-1 text-xs text-ink/70">
                    {sub.label}
                    {typeof sub.id === 'string' && sub.id.length > 20 && (
                      <button onClick={() => handleDelete(sub.id)} aria-label="Delete subcategory" className="text-ink/30 hover:text-ember">
                        <Trash2 size={12} />
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
