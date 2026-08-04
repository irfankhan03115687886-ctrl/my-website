'use client';

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Upload } from 'lucide-react';

export default function HeroEditor({ hero }) {
  const router = useRouter();
  const fileInputRef = useRef(null);
  const [form, setForm] = useState({
    eyebrow: hero.eyebrow || '',
    title: hero.title || '',
    highlight: hero.highlight || '',
    subtitle: hero.subtitle || '',
    ctaLabel: hero.cta_label || '',
    ctaHref: hero.cta_href || '',
    secondaryCtaLabel: hero.secondary_cta_label || '',
    secondaryCtaHref: hero.secondary_cta_href || '',
    imageUrl: hero.image_url || '',
  });
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
    setSaved(false);
  }

  async function handleUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError('');
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch('/api/dashboard-admin/hero/image', { method: 'POST', body: formData });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message || 'Upload failed');
      update('imageUrl', data.url);
    } catch (err) {
      setError(err.message);
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const res = await fetch('/api/dashboard-admin/hero', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message || 'Failed to save');
      setSaved(true);
      router.refresh();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <form onSubmit={handleSubmit} className="space-y-4">
        <label className="block">
          <span className="font-mono text-[11px] uppercase tracking-[0.1em] text-ink/50">Eyebrow label</span>
          <input value={form.eyebrow} onChange={(e) => update('eyebrow', e.target.value)} className="input mt-1.5 w-full" />
        </label>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="font-mono text-[11px] uppercase tracking-[0.1em] text-ink/50">Title</span>
            <input required value={form.title} onChange={(e) => update('title', e.target.value)} className="input mt-1.5 w-full" />
          </label>
          <label className="block">
            <span className="font-mono text-[11px] uppercase tracking-[0.1em] text-ink/50">Title highlight (italic)</span>
            <input value={form.highlight} onChange={(e) => update('highlight', e.target.value)} className="input mt-1.5 w-full" />
          </label>
        </div>
        <label className="block">
          <span className="font-mono text-[11px] uppercase tracking-[0.1em] text-ink/50">Subtitle</span>
          <textarea value={form.subtitle} onChange={(e) => update('subtitle', e.target.value)} rows={3} className="input mt-1.5 w-full" />
        </label>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="font-mono text-[11px] uppercase tracking-[0.1em] text-ink/50">Primary button label</span>
            <input value={form.ctaLabel} onChange={(e) => update('ctaLabel', e.target.value)} className="input mt-1.5 w-full" />
          </label>
          <label className="block">
            <span className="font-mono text-[11px] uppercase tracking-[0.1em] text-ink/50">Primary button link</span>
            <input value={form.ctaHref} onChange={(e) => update('ctaHref', e.target.value)} className="input mt-1.5 w-full" />
          </label>
          <label className="block">
            <span className="font-mono text-[11px] uppercase tracking-[0.1em] text-ink/50">Secondary button label</span>
            <input value={form.secondaryCtaLabel} onChange={(e) => update('secondaryCtaLabel', e.target.value)} className="input mt-1.5 w-full" />
          </label>
          <label className="block">
            <span className="font-mono text-[11px] uppercase tracking-[0.1em] text-ink/50">Secondary button link</span>
            <input value={form.secondaryCtaHref} onChange={(e) => update('secondaryCtaHref', e.target.value)} className="input mt-1.5 w-full" />
          </label>
        </div>

        <div>
          <span className="font-mono text-[11px] uppercase tracking-[0.1em] text-ink/50">Background image</span>
          <label className="mt-1.5 flex w-fit cursor-pointer items-center gap-2 rounded-md border border-dashed border-brass/30 px-4 py-3 text-sm text-ink/60 hover:border-brass/60 hover:text-ink">
            <Upload size={16} />
            {uploading ? 'Uploading…' : 'Upload new image (max 6MB)'}
            <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp,image/avif" onChange={handleUpload} className="hidden" />
          </label>
        </div>

        <div className="flex items-center gap-4 pt-2">
          <button type="submit" disabled={saving} className="btn-dark">
            {saving ? 'Saving…' : 'Save hero section'}
          </button>
          {saved && <span className="font-mono text-xs uppercase tracking-wide text-forest">Saved</span>}
          {error && <span className="text-xs text-ember">{error}</span>}
        </div>
      </form>

      <div>
        <span className="font-mono text-[11px] uppercase tracking-[0.1em] text-ink/50">Live preview</span>
        <div className="relative mt-2 aspect-[4/3] overflow-hidden rounded-md border border-ink/10 bg-ink">
          {form.imageUrl && <Image src={form.imageUrl} alt="" fill className="object-cover opacity-50" />}
          <div className="absolute inset-0 flex flex-col justify-end p-6">
            {form.eyebrow && <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-brass-light">{form.eyebrow}</span>}
            <h2 className="mt-2 font-display text-2xl leading-tight text-cream">
              {form.title} <span className="italic">{form.highlight}</span>
            </h2>
            {form.subtitle && <p className="mt-2 line-clamp-2 text-xs text-cream/70">{form.subtitle}</p>}
          </div>
        </div>
      </div>
    </div>
  );
}
