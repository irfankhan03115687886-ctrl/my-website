'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Plus, Trash2 } from 'lucide-react';

export default function BrandManager({ brands }) {
  const router = useRouter();
  const [name, setName] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function handleCreate(e) {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    setError('');
    try {
      const res = await fetch('/api/dashboard-admin/brands', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, logoUrl }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message || 'Failed to create brand');
      setName('');
      setLogoUrl('');
      router.refresh();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id) {
    await fetch(`/api/dashboard-admin/brands/${id}`, { method: 'DELETE' });
    router.refresh();
  }

  return (
    <div>
      <form onSubmit={handleCreate} className="flex flex-wrap gap-3">
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Brand name" className="input flex-1" />
        <input
          value={logoUrl}
          onChange={(e) => setLogoUrl(e.target.value)}
          placeholder="Logo image URL (optional)"
          className="input flex-1"
        />
        <button type="submit" disabled={saving} className="btn-dark shrink-0">
          <Plus size={15} className="mr-1.5" /> Add brand
        </button>
      </form>
      {error && <p className="mt-2 text-xs text-ember">{error}</p>}

      {brands.length === 0 ? (
        <p className="mt-6 text-sm text-ink/50">No brands yet — add your first one above.</p>
      ) : (
        <ul className="mt-6 flex flex-wrap gap-3">
          {brands.map((brand) => (
            <li key={brand.id} className="flex items-center gap-2 rounded-full border border-brass/25 bg-canvas px-4 py-1.5 text-sm text-ink/70">
              {brand.logo_url && (
                <span className="relative h-5 w-5 overflow-hidden rounded-full bg-ink/5">
                  <Image src={brand.logo_url} alt={brand.name} fill className="object-cover" />
                </span>
              )}
              {brand.name}
              <button onClick={() => handleDelete(brand.id)} aria-label="Delete brand" className="text-ink/30 hover:text-ember">
                <Trash2 size={13} />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
