'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Trash2, Star, Pencil } from 'lucide-react';

const COUNTRIES = [{ code: 'GB', label: 'United Kingdom' }];

const emptyForm = { label: '', fullName: '', phone: '', line1: '', line2: '', city: '', region: '', postcode: '', country: 'GB' };

function AddressForm({ initial, onCancel, onSaved }) {
  const [form, setForm] = useState(initial || emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const isEdit = Boolean(initial?.id);
      const res = await fetch(isEdit ? `/api/account/addresses/${initial.id}` : '/api/account/addresses', {
        method: isEdit ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message || 'Failed to save address');
      onSaved();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 rounded-xl border border-brass/20 bg-canvas p-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="font-mono text-[11px] uppercase tracking-[0.1em] text-ink/50">Label (optional)</span>
          <input value={form.label} onChange={(e) => update('label', e.target.value)} placeholder="Home, Office…" className="input mt-1.5 w-full" />
        </label>
        <label className="block">
          <span className="font-mono text-[11px] uppercase tracking-[0.1em] text-ink/50">Full name</span>
          <input required value={form.fullName} onChange={(e) => update('fullName', e.target.value)} className="input mt-1.5 w-full" />
        </label>
        <label className="block sm:col-span-2">
          <span className="font-mono text-[11px] uppercase tracking-[0.1em] text-ink/50">Phone</span>
          <input value={form.phone} onChange={(e) => update('phone', e.target.value)} className="input mt-1.5 w-full" />
        </label>
        <label className="block sm:col-span-2">
          <span className="font-mono text-[11px] uppercase tracking-[0.1em] text-ink/50">Address line 1</span>
          <input required value={form.line1} onChange={(e) => update('line1', e.target.value)} className="input mt-1.5 w-full" />
        </label>
        <label className="block sm:col-span-2">
          <span className="font-mono text-[11px] uppercase tracking-[0.1em] text-ink/50">Address line 2 (optional)</span>
          <input value={form.line2} onChange={(e) => update('line2', e.target.value)} className="input mt-1.5 w-full" />
        </label>
        <label className="block">
          <span className="font-mono text-[11px] uppercase tracking-[0.1em] text-ink/50">City</span>
          <input required value={form.city} onChange={(e) => update('city', e.target.value)} className="input mt-1.5 w-full" />
        </label>
        <label className="block">
          <span className="font-mono text-[11px] uppercase tracking-[0.1em] text-ink/50">County / region</span>
          <input value={form.region} onChange={(e) => update('region', e.target.value)} className="input mt-1.5 w-full" />
        </label>
        <label className="block">
          <span className="font-mono text-[11px] uppercase tracking-[0.1em] text-ink/50">Postcode</span>
          <input required value={form.postcode} onChange={(e) => update('postcode', e.target.value)} className="input mt-1.5 w-full" />
        </label>
        <label className="block">
          <span className="font-mono text-[11px] uppercase tracking-[0.1em] text-ink/50">Country</span>
          <select value={form.country} onChange={(e) => update('country', e.target.value)} className="input mt-1.5 w-full">
            {COUNTRIES.map((c) => (
              <option key={c.code} value={c.code}>
                {c.label}
              </option>
            ))}
          </select>
        </label>
      </div>
      {error && <p className="text-xs text-ember">{error}</p>}
      <div className="flex gap-3">
        <button type="submit" disabled={saving} className="btn-dark">
          {saving ? 'Saving…' : 'Save address'}
        </button>
        <button type="button" onClick={onCancel} className="btn-outline-ink">
          Cancel
        </button>
      </div>
    </form>
  );
}

export default function AddressManager({ addresses }) {
  const router = useRouter();
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState(null);

  function refresh() {
    setAdding(false);
    setEditingId(null);
    router.refresh();
  }

  async function handleDelete(id) {
    if (!confirm('Delete this address?')) return;
    await fetch(`/api/account/addresses/${id}`, { method: 'DELETE' });
    router.refresh();
  }

  async function handleSetDefault(id, type) {
    await fetch(`/api/account/addresses/${id}/default-${type}`, { method: 'POST' });
    router.refresh();
  }

  return (
    <div>
      {!adding && !editingId && (
        <button onClick={() => setAdding(true)} className="btn-dark">
          <Plus size={15} className="mr-1.5" /> Add address
        </button>
      )}

      {adding && <AddressForm onCancel={() => setAdding(false)} onSaved={refresh} />}

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        {addresses.map((addr) =>
          editingId === addr.id ? (
            <div key={addr.id} className="sm:col-span-2">
              <AddressForm
                initial={{
                  id: addr.id,
                  label: addr.label || '',
                  fullName: addr.full_name,
                  phone: addr.phone || '',
                  line1: addr.line1,
                  line2: addr.line2 || '',
                  city: addr.city,
                  region: addr.region || '',
                  postcode: addr.postcode,
                  country: addr.country,
                }}
                onCancel={() => setEditingId(null)}
                onSaved={refresh}
              />
            </div>
          ) : (
            <div key={addr.id} className="rounded-xl border border-ink/10 bg-canvas p-5">
              <div className="flex items-start justify-between">
                <div>
                  {addr.label && <p className="font-mono text-[11px] uppercase tracking-[0.1em] text-brass">{addr.label}</p>}
                  <p className="mt-1 font-display text-base text-ink">{addr.full_name}</p>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => setEditingId(addr.id)} aria-label="Edit address" className="text-ink/40 hover:text-ink">
                    <Pencil size={14} />
                  </button>
                  <button onClick={() => handleDelete(addr.id)} aria-label="Delete address" className="text-ink/40 hover:text-ember">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
              <p className="mt-2 text-sm text-ink/60">
                {addr.line1}
                {addr.line2 ? `, ${addr.line2}` : ''}
                <br />
                {addr.city}
                {addr.region ? `, ${addr.region}` : ''} {addr.postcode}
                <br />
                {addr.country}
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                <button
                  onClick={() => handleSetDefault(addr.id, 'shipping')}
                  className={`flex items-center gap-1 rounded-full border px-3 py-1 font-mono text-[10px] uppercase tracking-[0.08em] ${
                    addr.is_default_shipping ? 'border-forest bg-forest text-cream' : 'border-ink/15 text-ink/50 hover:border-forest/50'
                  }`}
                >
                  <Star size={10} fill={addr.is_default_shipping ? 'currentColor' : 'none'} /> Default shipping
                </button>
                <button
                  onClick={() => handleSetDefault(addr.id, 'billing')}
                  className={`flex items-center gap-1 rounded-full border px-3 py-1 font-mono text-[10px] uppercase tracking-[0.08em] ${
                    addr.is_default_billing ? 'border-brass bg-brass text-ink' : 'border-ink/15 text-ink/50 hover:border-brass/50'
                  }`}
                >
                  <Star size={10} fill={addr.is_default_billing ? 'currentColor' : 'none'} /> Default billing
                </button>
              </div>
            </div>
          )
        )}
      </div>

      {addresses.length === 0 && !adding && <p className="mt-6 text-sm text-ink/50">No saved addresses yet.</p>}
    </div>
  );
}
