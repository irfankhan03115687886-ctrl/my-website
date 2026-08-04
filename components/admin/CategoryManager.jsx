'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Trash2, Plus } from 'lucide-react';

function slugify(v) {
  return v.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

export default function CategoryManager({ tree }) {
  const router = useRouter();
  const [label, setLabel] = useState('');
  const [parentId, setParentId] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function handleCreate(e) {
    e.preventDefault();
    if (!label.trim()) return;
    setSaving(true);
    setError('');
    try {
      const res = await fetch('/api/admin/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug: slugify(label), label: label.trim(), parentId: parentId || null }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || 'Failed to create category');
      }
      setLabel('');
      setParentId('');
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
      // no-op — the row stays visible if the delete failed
    }
  }

  return (
    <div>
      <form onSubmit={handleCreate} className="flex flex-wrap gap-3">
        <input
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          placeholder="Category or subcategory name"
          className="input flex-1"
        />
        <select value={parentId} onChange={(e) => setParentId(e.target.value)} className="input flex-1">
          <option value="">Top-level category</option>
          {tree.map((c) => (
            <option key={c.id} value={c.id}>
              Subcategory of {c.label}
            </option>
          ))}
        </select>
        <button type="submit" disabled={saving} className="btn-dark shrink-0">
          <Plus size={15} className="mr-1.5" /> Add
        </button>
      </form>
      {error && <p className="mt-2 text-xs text-ember">{error}</p>}

      <div className="mt-7 space-y-6">
        {tree.map((cat) => (
          <div key={cat.id}>
            <div className="flex items-center justify-between">
              <h3 className="font-display text-base text-ink">{cat.label}</h3>
              {typeof cat.id === 'string' && cat.id.length > 20 && (
                <button onClick={() => handleDelete(cat.id)} aria-label="Delete category" className="text-ink/30 hover:text-ember">
                  <Trash2 size={15} />
                </button>
              )}
            </div>
            {cat.children.length > 0 && (
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
