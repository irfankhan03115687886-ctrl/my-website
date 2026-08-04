'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Trash2 } from 'lucide-react';

export default function ProductRowActions({ slug, status }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function setStatus(newStatus) {
    setBusy(true);
    try {
      await fetch(`/api/admin/products/${slug}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ statusOnly: true, status: newStatus }),
      });
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete() {
    if (!confirm('Delete this product permanently? This cannot be undone.')) return;
    setBusy(true);
    try {
      await fetch(`/api/admin/products/${slug}`, { method: 'DELETE' });
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex items-center justify-end gap-3">
      <select
        value={status}
        disabled={busy}
        onChange={(e) => setStatus(e.target.value)}
        className="rounded border border-ink/15 bg-canvas-2 px-2 py-1 font-mono text-[11px] uppercase tracking-wide text-ink/70"
      >
        <option value="draft">Draft</option>
        <option value="published">Published</option>
        <option value="archived">Archived</option>
      </select>
      <button onClick={handleDelete} disabled={busy} aria-label="Delete product" className="text-ink/30 hover:text-ember">
        <Trash2 size={14} />
      </button>
    </div>
  );
}
