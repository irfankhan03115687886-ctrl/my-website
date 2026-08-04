'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Plus, Trash2, ExternalLink } from 'lucide-react';

function slugify(v) {
  return v.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

export default function PageManager({ pages }) {
  const router = useRouter();
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ title: '', content: '', status: 'draft' });
  const [error, setError] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({ title: '', content: '', status: 'draft' });

  async function handleCreate(e) {
    e.preventDefault();
    if (!form.title.trim()) return;
    setCreating(true);
    setError('');
    try {
      const res = await fetch('/api/dashboard-admin/pages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: form.title, slug: slugify(form.title), content: form.content, status: form.status }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message || 'Failed to create page');
      setForm({ title: '', content: '', status: 'draft' });
      router.refresh();
    } catch (err) {
      setError(err.message);
    } finally {
      setCreating(false);
    }
  }

  function startEdit(page) {
    setEditingId(page.id);
    setEditForm({ title: page.title, content: page.content || '', status: page.status });
  }

  async function saveEdit(id) {
    await fetch(`/api/dashboard-admin/pages/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(editForm),
    });
    setEditingId(null);
    router.refresh();
  }

  async function handleDelete(id) {
    if (!confirm('Delete this page?')) return;
    await fetch(`/api/dashboard-admin/pages/${id}`, { method: 'DELETE' });
    router.refresh();
  }

  return (
    <div>
      <form onSubmit={handleCreate} className="space-y-3">
        <div className="flex flex-wrap gap-3">
          <input
            value={form.title}
            onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
            placeholder="Page title (e.g. Shipping & Returns)"
            className="input flex-1"
          />
          <select
            value={form.status}
            onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}
            className="input w-40"
          >
            <option value="draft">Draft</option>
            <option value="published">Published</option>
          </select>
          <button type="submit" disabled={creating} className="btn-dark shrink-0">
            <Plus size={15} className="mr-1.5" /> Add page
          </button>
        </div>
        <textarea
          value={form.content}
          onChange={(e) => setForm((f) => ({ ...f, content: e.target.value }))}
          rows={3}
          placeholder="Page content (plain text — line breaks are preserved, but HTML tags will show as literal text)"
          className="input w-full"
        />
      </form>
      {error && <p className="mt-2 text-xs text-ember">{error}</p>}

      <div className="mt-7 divide-y divide-ink/10">
        {pages.length === 0 ? (
          <p className="py-3 text-sm text-ink/50">No pages yet — add one above (e.g. About, FAQ, Shipping & Returns).</p>
        ) : (
          pages.map((page) => (
            <div key={page.id} className="py-4">
              {editingId === page.id ? (
                <div className="space-y-3">
                  <div className="flex flex-wrap gap-3">
                    <input
                      value={editForm.title}
                      onChange={(e) => setEditForm((f) => ({ ...f, title: e.target.value }))}
                      className="input flex-1"
                    />
                    <select
                      value={editForm.status}
                      onChange={(e) => setEditForm((f) => ({ ...f, status: e.target.value }))}
                      className="input w-40"
                    >
                      <option value="draft">Draft</option>
                      <option value="published">Published</option>
                    </select>
                  </div>
                  <textarea
                    value={editForm.content}
                    onChange={(e) => setEditForm((f) => ({ ...f, content: e.target.value }))}
                    rows={4}
                    className="input w-full"
                  />
                  <div className="flex gap-3">
                    <button onClick={() => saveEdit(page.id)} className="btn-dark">
                      Save
                    </button>
                    <button onClick={() => setEditingId(null)} className="btn-outline">
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-display text-base text-ink">{page.title}</h3>
                      <span
                        className={
                          page.status === 'published'
                            ? 'status-pill border-forest text-forest'
                            : 'status-pill border-ink/20 text-ink/50'
                        }
                      >
                        {page.status}
                      </span>
                    </div>
                    <p className="mt-1 font-mono text-xs text-ink/40">/pages/{page.slug}</p>
                  </div>
                  <div className="flex shrink-0 items-center gap-4">
                    {page.status === 'published' && (
                      <Link href={`/pages/${page.slug}`} target="_blank" className="text-ink/40 hover:text-forest">
                        <ExternalLink size={15} />
                      </Link>
                    )}
                    <button onClick={() => startEdit(page)} className="font-mono text-xs uppercase tracking-[0.1em] text-forest hover:underline">
                      Edit
                    </button>
                    <button onClick={() => handleDelete(page.id)} aria-label="Delete page" className="text-ink/30 hover:text-ember">
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
