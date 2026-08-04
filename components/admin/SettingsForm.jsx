'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

const CURRENCIES = ['USD', 'EUR', 'GBP', 'CAD', 'AUD'];
const TIMEZONES = ['UTC', 'America/New_York', 'America/Los_Angeles', 'America/Chicago', 'Europe/London', 'Asia/Karachi'];
const COUNTRIES = [{ code: 'GB', label: 'United Kingdom' }];

export default function SettingsForm({ settings }) {
  const router = useRouter();
  const [form, setForm] = useState({
    storeName: settings.store_name || '',
    storeEmail: settings.store_email || '',
    storePhone: settings.store_phone || '',
    storeAddress: settings.store_address || '',
    currency: settings.currency || 'USD',
    timezone: settings.timezone || 'UTC',
    shippingFee: settings.shipping_fee ?? 5,
    freeShippingThreshold: settings.free_shipping_threshold ?? 50,
    deliveryCountry: settings.delivery_country || 'GB',
    bankPaymentInstructions: settings.bank_payment_instructions || '',
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
    setSaved(false);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message || 'Failed to save settings');
      setSaved(true);
      router.refresh();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="font-mono text-[11px] uppercase tracking-[0.1em] text-ink/50">Store name</span>
          <input value={form.storeName} onChange={(e) => update('storeName', e.target.value)} className="input mt-1.5 w-full" />
        </label>
        <label className="block">
          <span className="font-mono text-[11px] uppercase tracking-[0.1em] text-ink/50">Store email</span>
          <input
            type="email"
            value={form.storeEmail}
            onChange={(e) => update('storeEmail', e.target.value)}
            className="input mt-1.5 w-full"
          />
        </label>
        <label className="block">
          <span className="font-mono text-[11px] uppercase tracking-[0.1em] text-ink/50">Store phone</span>
          <input value={form.storePhone} onChange={(e) => update('storePhone', e.target.value)} className="input mt-1.5 w-full" />
        </label>
        <label className="block">
          <span className="font-mono text-[11px] uppercase tracking-[0.1em] text-ink/50">Currency</span>
          <select value={form.currency} onChange={(e) => update('currency', e.target.value)} className="input mt-1.5 w-full">
            {CURRENCIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </label>
        <label className="block sm:col-span-2">
          <span className="font-mono text-[11px] uppercase tracking-[0.1em] text-ink/50">Store address</span>
          <input
            value={form.storeAddress}
            onChange={(e) => update('storeAddress', e.target.value)}
            className="input mt-1.5 w-full"
          />
        </label>
        <label className="block">
          <span className="font-mono text-[11px] uppercase tracking-[0.1em] text-ink/50">Timezone</span>
          <select value={form.timezone} onChange={(e) => update('timezone', e.target.value)} className="input mt-1.5 w-full">
            {TIMEZONES.map((tz) => (
              <option key={tz} value={tz}>
                {tz}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="border-t border-ink/10 pt-5">
        <h3 className="font-display text-base text-ink">Shipping</h3>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="font-mono text-[11px] uppercase tracking-[0.1em] text-ink/50">Shipping fee ({form.currency})</span>
            <input
              type="number"
              min="0"
              step="0.01"
              value={form.shippingFee}
              onChange={(e) => update('shippingFee', e.target.value)}
              className="input mt-1.5 w-full"
            />
          </label>
          <label className="block">
            <span className="font-mono text-[11px] uppercase tracking-[0.1em] text-ink/50">Free shipping threshold</span>
            <input
              type="number"
              min="0"
              step="0.01"
              value={form.freeShippingThreshold}
              onChange={(e) => update('freeShippingThreshold', e.target.value)}
              className="input mt-1.5 w-full"
            />
            <span className="mt-1 block text-xs text-ink/45">Orders at or above this subtotal ship free.</span>
          </label>
          <label className="block">
            <span className="font-mono text-[11px] uppercase tracking-[0.1em] text-ink/50">Delivery country</span>
            <select value={form.deliveryCountry} onChange={(e) => update('deliveryCountry', e.target.value)} className="input mt-1.5 w-full">
              {COUNTRIES.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.label}
                </option>
              ))}
            </select>
            <span className="mt-1 block text-xs text-ink/45">Checkout only accepts addresses in this country.</span>
          </label>
        </div>
      </div>

      <div className="border-t border-ink/10 pt-5">
        <h3 className="font-display text-base text-ink">Bank transfer instructions</h3>
        <p className="mt-1 text-xs text-ink/50">
          Shown to customers at checkout if they choose Bank Transfer. Include account name, sort code/IBAN, and account
          number — never a password or PIN.
        </p>
        <textarea
          value={form.bankPaymentInstructions}
          onChange={(e) => update('bankPaymentInstructions', e.target.value)}
          rows={4}
          placeholder={'Account name: Field & Co\nBank: ...\nAccount number: ...\nSort code: ...'}
          className="input mt-3 w-full font-mono text-xs"
        />
      </div>

      <div className="flex items-center gap-4">
        <button type="submit" disabled={saving} className="btn-dark">
          {saving ? 'Saving…' : 'Save settings'}
        </button>
        {saved && <span className="font-mono text-xs uppercase tracking-wide text-forest">Saved</span>}
        {error && <span className="text-xs text-ember">{error}</span>}
      </div>
    </form>
  );
}
