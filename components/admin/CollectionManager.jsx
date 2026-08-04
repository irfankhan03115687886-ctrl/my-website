'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Trash2, Plus, Eye, EyeOff } from 'lucide-react';

function slugify(v) {
  return v.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

export default function CollectionManager({ collections }) {
  const router = useRouter();
  const [form, setForm] = useState({ title: '', subtitle: '', imageUrl: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function handleCreate(e) {
    e.preventDefault();
    if (!form.title.trim()) return;
    setSaving(true);
    setError('');
    try {
      const res = await fetch('/api/admin/collections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug: slugify(form.title), title: form.title, subtitle: form.subtitle, imageUrl: form.imageUrl }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || 'Failed to create collection');
      }
      setForm({ title: '', subtitle: '', imageUrl: '' });
      router.refresh();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function toggleActive(collection) {
    try {
      await fetch(`/api/admin/collections/${collection.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: collection.title,
          subtitle: collection.subtitle,
          imageUrl: collection.image_url,
          active: !collection.active,
          sortOrder: collection.sort_order,
        }),
      });
      router.refresh();
    } catch {
      // no-op
    }
  }

  async function handleDelete(id) {
    try {
      await fetch(`/api/admin/collections/${id}`, { method: 'DELETE' });
      router.refresh();
    } catch {
      // no-op
    }
  }

  return (
    <div>
      <form onSubmit={handleCreate} className="grid gap-3 sm:grid-cols-2">
        <input
          value={form.title}
          onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
          placeholder="Collection title (e.g. Night Trail Edit)"
          className="input"
        />
        <input
          value={form.imageUrl}
          onChange={(e) => setForm((f) => ({ ...f, imageUrl: e.target.value }))}
          placeholder="Banner image URL"
          className="input"
        />
        <input
          value={form.subtitle}
          onChange={(e) => setForm((f) => ({ ...f, subtitle: e.target.value }))}
          placeholder="Subtitle / tagline"
          className="input sm:col-span-2"
        />
        <button type="submit" disabled={saving} className="btn-dark sm:col-span-2">
          <Plus size={15} className="mr-1.5" /> Create collection
        </button>
      </form>
      {error && <p className="mt-2 text-xs text-ember">{error}</p>}

      <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {collections.length === 0 && <p className="text-sm text-ink/60">No collections in the database yet — add one above.</p>}
        {collections.map((c) => (
          <div key={c.id} className="overflow-hidden rounded-md border border-brass/20">
            <div className="relative h-28 w-full bg-ink/10">
              {c.image_url && <Image src={c.image_url} alt={c.title} fill className="object-cover" />}
              <div className="absolute inset-0 bg-gradient-to-t from-ink/70 to-transparent" />
              <span className="absolute bottom-2 left-3 font-display text-sm italic text-cream">{c.title}</span>
            </div>
            <div className="flex items-center justify-between px-3 py-2">
              <span className="font-mono text-[11px] uppercase tracking-wide text-ink/50">
                {c.products?.length || 0} products · {c.active === false ? 'hidden' : 'live'}
              </span>
              <div className="flex items-center gap-2">
                <button onClick={() => toggleActive(c)} aria-label="Toggle visibility" className="text-ink/40 hover:text-forest">
                  {c.active === false ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
                <button onClick={() => handleDelete(c.id)} aria-label="Delete collection" className="text-ink/40 hover:text-ember">
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
