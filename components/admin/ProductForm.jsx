'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { CATEGORIES, SUBCATEGORIES } from '@/lib/catalogConstants';
import NewProductImagePicker from '@/components/admin/NewProductImagePicker';

const emptyForm = {
  name: '',
  slug: '',
  shortDescription: '',
  description: '',
  price: '',
  compareAtPrice: '',
  sku: '',
  brand: '',
  category: CATEGORIES[0]?.slug || '',
  subcategory: '',
  stock: 0,
  lowStockThreshold: 5,
  status: 'draft',
  featured: false,
  bestSeller: false,
  newArrival: false,
};

export default function ProductForm({ product, redirectBasePath = '/admin/products' }) {
  const router = useRouter();
  const isEdit = Boolean(product);
  const [form, setForm] = useState(
    isEdit
      ? {
          name: product.name || '',
          slug: product.slug || '',
          shortDescription: product.short_description || '',
          description: product.description || '',
          price: product.price ?? '',
          compareAtPrice: product.compare_at_price ?? '',
          sku: product.sku || '',
          brand: product.brand || '',
          category: product.category || CATEGORIES[0]?.slug || '',
          subcategory: product.subcategory || '',
          stock: product.stock ?? 0,
          lowStockThreshold: product.low_stock_threshold ?? 5,
          status: product.status || 'draft',
          featured: Boolean(product.featured),
          bestSeller: Boolean(product.best_seller),
          newArrival: Boolean(product.new_arrival),
        }
      : emptyForm
  );
  const [saving, setSaving] = useState(false);
  const [savingStage, setSavingStage] = useState('');
  const [error, setError] = useState('');
  // Create-mode only: staged local files (with preview URLs), uploaded
  // right after the product itself is created — see handleSubmit. Edit
  // mode keeps using ProductImageManager against the already-saved product.
  const [pendingImages, setPendingImages] = useState([]);

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  const subcategoryOptions = SUBCATEGORIES.filter((s) => s.category === form.category);

  async function uploadPendingImages(slug) {
    for (let i = 0; i < pendingImages.length; i++) {
      setSavingStage(`Uploading photo ${i + 1} of ${pendingImages.length}…`);
      const formData = new FormData();
      formData.append('file', pendingImages[i].file);
      const res = await fetch(`/api/admin/products/${slug}/images`, { method: 'POST', body: formData });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        // The product itself already saved successfully at this point, so
        // surface the image failure but don't block navigating to the
        // product where the admin can retry the upload.
        throw new Error(data.message || `Photo ${i + 1} failed to upload — you can add it from the product page.`);
      }
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setSavingStage(isEdit ? 'Saving changes…' : 'Creating product…');
    setError('');
    try {
      const payload = {
        ...form,
        price: Number(form.price),
        compareAtPrice: form.compareAtPrice ? Number(form.compareAtPrice) : null,
        stock: Number(form.stock),
        lowStockThreshold: Number(form.lowStockThreshold),
      };
      const res = isEdit
        ? await fetch(`/api/admin/products/${product.slug}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          })
        : await fetch('/api/admin/products', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message || 'Failed to save product');

      if (!isEdit) {
        if (pendingImages.length > 0) {
          try {
            await uploadPendingImages(data.product.slug);
          } catch (uploadErr) {
            // Product was created; just let the admin know the photo(s)
            // need a retry rather than losing the product too.
            router.push(`${redirectBasePath}/${data.product.slug}`);
            router.refresh();
            setError(uploadErr.message);
            setSaving(false);
            setSavingStage('');
            return;
          }
        }
        router.push(`${redirectBasePath}/${data.product.slug}`);
      } else if (data.product.slug !== product.slug) {
        // Slug changed — the current URL segment is now stale, so
        // navigate to the new one instead of just refreshing in place.
        router.push(`${redirectBasePath}/${data.product.slug}`);
      } else {
        router.refresh();
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
      setSavingStage('');
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block sm:col-span-2">
          <span className="font-mono text-[11px] uppercase tracking-[0.1em] text-ink/50">Product name</span>
          <input required value={form.name} onChange={(e) => update('name', e.target.value)} className="input mt-1.5 w-full" />
        </label>

        <label className="block sm:col-span-2">
          <span className="font-mono text-[11px] uppercase tracking-[0.1em] text-ink/50">SEO slug</span>
          <input
            value={form.slug}
            onChange={(e) => update('slug', e.target.value)}
            placeholder={isEdit ? undefined : 'Leave blank to generate from the product name'}
            className="input mt-1.5 w-full font-mono text-sm"
          />
          <span className="mt-1 block text-xs text-ink/40">
            Used in the product URL (/products/your-slug). Changing it on a published product will change its live URL.
          </span>
        </label>

        <label className="block sm:col-span-2">
          <span className="font-mono text-[11px] uppercase tracking-[0.1em] text-ink/50">Short description</span>
          <input
            value={form.shortDescription}
            onChange={(e) => update('shortDescription', e.target.value)}
            placeholder="One line shown on product cards"
            className="input mt-1.5 w-full"
          />
        </label>

        <label className="block sm:col-span-2">
          <span className="font-mono text-[11px] uppercase tracking-[0.1em] text-ink/50">Full description</span>
          <textarea
            value={form.description}
            onChange={(e) => update('description', e.target.value)}
            rows={4}
            className="input mt-1.5 w-full"
          />
        </label>

        <label className="block">
          <span className="font-mono text-[11px] uppercase tracking-[0.1em] text-ink/50">Price ($)</span>
          <input
            required
            type="number"
            min="0.01"
            step="0.01"
            value={form.price}
            onChange={(e) => update('price', e.target.value)}
            className="input mt-1.5 w-full"
          />
        </label>
        <label className="block">
          <span className="font-mono text-[11px] uppercase tracking-[0.1em] text-ink/50">Compare-at price (optional)</span>
          <input
            type="number"
            min="0"
            step="0.01"
            value={form.compareAtPrice}
            onChange={(e) => update('compareAtPrice', e.target.value)}
            className="input mt-1.5 w-full"
          />
        </label>

        <label className="block">
          <span className="font-mono text-[11px] uppercase tracking-[0.1em] text-ink/50">SKU</span>
          <input value={form.sku} onChange={(e) => update('sku', e.target.value)} className="input mt-1.5 w-full" />
        </label>
        <label className="block">
          <span className="font-mono text-[11px] uppercase tracking-[0.1em] text-ink/50">Brand</span>
          <input value={form.brand} onChange={(e) => update('brand', e.target.value)} className="input mt-1.5 w-full" />
        </label>

        <label className="block">
          <span className="font-mono text-[11px] uppercase tracking-[0.1em] text-ink/50">Category</span>
          <select
            value={form.category}
            onChange={(e) => setForm((f) => ({ ...f, category: e.target.value, subcategory: '' }))}
            className="input mt-1.5 w-full"
          >
            {CATEGORIES.map((c) => (
              <option key={c.slug} value={c.slug}>
                {c.label}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="font-mono text-[11px] uppercase tracking-[0.1em] text-ink/50">Subcategory</span>
          <select value={form.subcategory} onChange={(e) => update('subcategory', e.target.value)} className="input mt-1.5 w-full">
            <option value="">None</option>
            {subcategoryOptions.map((s) => (
              <option key={s.slug} value={s.slug}>
                {s.label}
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="font-mono text-[11px] uppercase tracking-[0.1em] text-ink/50">Stock quantity</span>
          <input
            type="number"
            min="0"
            value={form.stock}
            onChange={(e) => update('stock', e.target.value)}
            className="input mt-1.5 w-full"
          />
        </label>
        <label className="block">
          <span className="font-mono text-[11px] uppercase tracking-[0.1em] text-ink/50">Low-stock threshold</span>
          <input
            type="number"
            min="0"
            value={form.lowStockThreshold}
            onChange={(e) => update('lowStockThreshold', e.target.value)}
            className="input mt-1.5 w-full"
          />
        </label>

        <label className="block">
          <span className="font-mono text-[11px] uppercase tracking-[0.1em] text-ink/50">Status</span>
          <select value={form.status} onChange={(e) => update('status', e.target.value)} className="input mt-1.5 w-full">
            <option value="draft">Draft (hidden from shop)</option>
            <option value="published">Published (live on the shop)</option>
            <option value="archived">Archived</option>
          </select>
        </label>

        <div className="flex flex-wrap items-center gap-5 self-end pb-1">
          <label className="flex items-center gap-2 text-sm text-ink/70">
            <input type="checkbox" checked={form.featured} onChange={(e) => update('featured', e.target.checked)} />
            Featured
          </label>
          <label className="flex items-center gap-2 text-sm text-ink/70">
            <input type="checkbox" checked={form.bestSeller} onChange={(e) => update('bestSeller', e.target.checked)} />
            Best seller
          </label>
          <label className="flex items-center gap-2 text-sm text-ink/70">
            <input type="checkbox" checked={form.newArrival} onChange={(e) => update('newArrival', e.target.checked)} />
            New arrival
          </label>
        </div>
      </div>

      {!isEdit && (
        <div>
          <span className="font-mono text-[11px] uppercase tracking-[0.1em] text-ink/50">Photos</span>
          <p className="mt-1 text-xs text-ink/40">
            Add one or more photos now — they'll be uploaded together with the product when you click Create product below.
          </p>
          <div className="mt-2.5">
            <NewProductImagePicker images={pendingImages} onChange={setPendingImages} />
          </div>
        </div>
      )}

      <div className="flex items-center gap-4">
        <button type="submit" disabled={saving} className="btn-dark">
          {saving ? savingStage || 'Saving…' : isEdit ? 'Save changes' : 'Create product'}
        </button>
        {error && <span className="text-xs text-ember">{error}</span>}
      </div>
    </form>
  );
}
