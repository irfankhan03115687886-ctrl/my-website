'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Trash2, Plus } from 'lucide-react';

function slugify(v) {
  return v.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

export default function TagManager({ tags }) {
  const router = useRouter();
  const [label, setLabel] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function handleCreate(e) {
    e.preventDefault();
    if (!label.trim()) return;
    setSaving(true);
    setError('');
    try {
      const res = await fetch('/api/admin/tags', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug: slugify(label), label: label.trim() }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || 'Failed to create tag');
      }
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
      await fetch(`/api/admin/tags/${id}`, { method: 'DELETE' });
      router.refresh();
    } catch {
      // no-op
    }
  }

  return (
    <div>
      <form onSubmit={handleCreate} className="flex flex-wrap gap-3">
        <input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="New tag name" className="input flex-1" />
        <button type="submit" disabled={saving} className="btn-dark shrink-0">
          <Plus size={15} className="mr-1.5" /> Add tag
        </button>
      </form>
      {error && <p className="mt-2 text-xs text-ember">{error}</p>}

      <ul className="mt-6 flex flex-wrap gap-2">
        {tags.map((tag) => (
          <li key={tag.id} className="flex items-center gap-2 rounded-full border border-brass/25 bg-canvas px-4 py-1.5 text-xs uppercase tracking-wide text-ink/70">
            {tag.label}
            {typeof tag.id === 'string' && tag.id.length > 20 && (
              <button onClick={() => handleDelete(tag.id)} aria-label="Delete tag" className="text-ink/30 hover:text-ember">
                <Trash2 size={12} />
              </button>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
