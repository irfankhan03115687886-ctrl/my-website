'use client';

import { useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Download, Upload, X, Search, ChevronUp, ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react';
import { CATEGORIES, SUBCATEGORIES } from '@/lib/catalogConstants';
import ProductRowActions from '@/components/admin/ProductRowActions';

const PAGE_SIZE = 20;

export default function ProductsTable({ products, brands = [], editBasePath }) {
  const router = useRouter();
  const fileInputRef = useRef(null);
  const [selected, setSelected] = useState(new Set());
  const [activeAction, setActiveAction] = useState(null);
  const [actionValues, setActionValues] = useState({});
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState(null);
  const [importReport, setImportReport] = useState(null);

  // Search / filter / sort / pagination — all client-side, since the
  // full product list is already loaded server-side for this page.
  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterBrand, setFilterBrand] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterStock, setFilterStock] = useState('');
  const [sortKey, setSortKey] = useState(null);
  const [sortDir, setSortDir] = useState('asc');
  const [page, setPage] = useState(1);

  // Two-step CSV import: preview (dry run, nothing written) -> confirm.
  const [importPreview, setImportPreview] = useState(null);
  const [pendingImportFile, setPendingImportFile] = useState(null);
  const [previewing, setPreviewing] = useState(false);
  const [importing, setImporting] = useState(false);

  const allEditableSelected = products.length > 0 && products.every((p) => selected.has(p.id));

  function toggleOne(id) {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function toggleAll() {
    setSelected(allEditableSelected ? new Set() : new Set(products.map((p) => p.id)));
  }

  function clearSelection() {
    setSelected(new Set());
    setActiveAction(null);
    setActionValues({});
  }

  async function runBulkAction(action, extra = {}) {
    if (action === 'delete') {
      const count = selected.size;
      if (!confirm(`Delete ${count} product${count === 1 ? '' : 's'} permanently? This cannot be undone.`)) return;
    }
    setBusy(true);
    setMessage(null);
    try {
      const res = await fetch('/api/admin/products/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, ids: Array.from(selected), ...extra }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message || 'Bulk action failed');
      setMessage({ type: 'success', text: `Updated ${data.count} product${data.count === 1 ? '' : 's'}.` });
      clearSelection();
      router.refresh();
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setBusy(false);
    }
  }

  async function handleExport() {
    window.location.href = '/api/admin/products/export';
  }

  // Step 1: pick a file -> ask the server to validate/preview it
  // (dry run, nothing written yet).
  async function handleImportFileSelected(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setPreviewing(true);
    setMessage(null);
    setImportReport(null);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('dryRun', 'true');
      const res = await fetch('/api/admin/products/import', { method: 'POST', body: formData });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message || 'Could not preview this CSV');
      setImportPreview(data.preview);
      setPendingImportFile(file);
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setPreviewing(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }

  // Step 2: admin reviews the preview and confirms -> real import.
  async function handleConfirmImport() {
    if (!pendingImportFile) return;
    setImporting(true);
    setMessage(null);
    try {
      const formData = new FormData();
      formData.append('file', pendingImportFile);
      const res = await fetch('/api/admin/products/import', { method: 'POST', body: formData });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message || 'Import failed');
      setImportReport(data.report);
      setImportPreview(null);
      setPendingImportFile(null);
      router.refresh();
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setImporting(false);
    }
  }

  function cancelImportPreview() {
    setImportPreview(null);
    setPendingImportFile(null);
  }

  const subOptions = SUBCATEGORIES.filter((s) => s.category === actionValues.category);

  // ---------- Search / filter / sort / paginate ----------
  const filtered = useMemo(() => {
    let list = products;
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter((p) => p.name.toLowerCase().includes(q) || (p.sku || '').toLowerCase().includes(q));
    }
    if (filterCategory) list = list.filter((p) => p.category === filterCategory);
    if (filterBrand) list = list.filter((p) => p.brand === filterBrand);
    if (filterStatus) list = list.filter((p) => (p.status || 'published') === filterStatus);
    if (filterStock === 'in') list = list.filter((p) => p.stock > (p.lowStockThreshold ?? 5));
    else if (filterStock === 'low') list = list.filter((p) => p.stock > 0 && p.stock <= (p.lowStockThreshold ?? 5));
    else if (filterStock === 'out') list = list.filter((p) => p.stock === 0);

    if (sortKey) {
      list = [...list].sort((a, b) => {
        let av = a[sortKey];
        let bv = b[sortKey];
        if (typeof av === 'string') {
          av = av.toLowerCase();
          bv = (bv || '').toLowerCase();
        }
        if (av < bv) return sortDir === 'asc' ? -1 : 1;
        if (av > bv) return sortDir === 'asc' ? 1 : -1;
        return 0;
      });
    }
    return list;
  }, [products, search, filterCategory, filterBrand, filterStatus, filterStock, sortKey, sortDir]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const paginated = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  function resetToFirstPage(setter) {
    return (value) => {
      setter(value);
      setPage(1);
    };
  }

  function toggleSort(key) {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  }

  function SortHeader({ label, sortField }) {
    const active = sortKey === sortField;
    return (
      <button onClick={() => toggleSort(sortField)} className="flex items-center gap-1 hover:text-ink">
        {label}
        {active && (sortDir === 'asc' ? <ChevronUp size={12} /> : <ChevronDown size={12} />)}
      </button>
    );
  }

  const brandOptions = brands.length > 0 ? brands.map((b) => b.name) : Array.from(new Set(products.map((p) => p.brand).filter(Boolean)));

  return (
    <div>
      <div className="flex flex-wrap items-center gap-3">
        <button onClick={handleExport} className="btn-outline">
          <Download size={15} className="mr-1.5" /> Export CSV
        </button>
        <label className="btn-outline cursor-pointer">
          <Upload size={15} className="mr-1.5" /> {previewing ? 'Reading CSV…' : 'Import CSV'}
          <input ref={fileInputRef} type="file" accept=".csv" onChange={handleImportFileSelected} disabled={previewing} className="hidden" />
        </label>
        {selected.size > 0 && (
          <span className="font-mono text-xs uppercase tracking-[0.1em] text-cream/50">{selected.size} selected</span>
        )}
      </div>

      {message && (
        <p className={`mt-3 text-sm ${message.type === 'error' ? 'text-ember' : 'text-brass-light'}`}>{message.text}</p>
      )}

      {importPreview && (
        <div className="mt-3 rounded-md border border-brass/25 bg-canvas-2 p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-ink/70">
              Preview: <strong className="text-forest">{importPreview.toCreate}</strong> to create,{' '}
              <strong className="text-forest">{importPreview.toUpdate}</strong> to update
              {importPreview.errors.length > 0 && (
                <>
                  , <strong className="text-ember">{importPreview.errors.length}</strong> row{importPreview.errors.length === 1 ? '' : 's'} will be skipped
                </>
              )}
              .
            </p>
            <div className="flex gap-3">
              <button
                onClick={handleConfirmImport}
                disabled={importing || (importPreview.toCreate === 0 && importPreview.toUpdate === 0)}
                className="btn-dark"
              >
                {importing ? 'Importing…' : 'Confirm import'}
              </button>
              <button onClick={cancelImportPreview} disabled={importing} className="btn-outline-ink">
                Cancel
              </button>
            </div>
          </div>

          {importPreview.rows.length > 0 && (
            <div className="mt-4 max-h-48 overflow-y-auto rounded border border-ink/10">
              <table className="admin-table">
                <thead>
                  <tr className="[&>th]:px-3 [&>th]:pt-2">
                    <th>Row</th>
                    <th>Product</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {importPreview.rows.map((r) => (
                    <tr key={r.row} className="[&>td]:px-3">
                      <td className="font-mono text-xs">{r.row}</td>
                      <td>{r.name}</td>
                      <td>
                        <span className={r.action === 'create' ? 'status-pill border-forest text-forest' : 'status-pill border-brass text-brass'}>
                          {r.action}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {importPreview.errors.length > 0 && (
            <div className="mt-3 max-h-32 overflow-y-auto">
              <ul className="space-y-1 font-mono text-xs text-ember">
                {importPreview.errors.map((e, i) => (
                  <li key={i}>
                    Row {e.row} ({e.slug}): {e.message}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {importReport && (
        <div className="mt-3 rounded-md border border-brass/25 bg-canvas-2 px-4 py-3 text-sm text-ink/70">
          <div className="flex items-center justify-between">
            <span>
              Import complete: <strong>{importReport.created}</strong> created, <strong>{importReport.updated}</strong> updated
              {importReport.errors.length > 0 && `, ${importReport.errors.length} skipped`}
            </span>
            <button onClick={() => setImportReport(null)} aria-label="Dismiss" className="text-ink/40 hover:text-ink">
              <X size={14} />
            </button>
          </div>
          {importReport.errors.length > 0 && (
            <div className="mt-2 max-h-40 overflow-y-auto">
              <ul className="space-y-1 font-mono text-xs text-ember">
                {importReport.errors.map((e, i) => (
                  <li key={i}>
                    Row {e.row} ({e.slug}): {e.message}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {selected.size > 0 && (
        <div className="card-surface mt-4 p-5">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-mono text-xs uppercase tracking-[0.1em] text-ink/50">Bulk action:</span>
            {['status', 'category', 'brand', 'price', 'stock'].map((a) => (
              <button
                key={a}
                onClick={() => setActiveAction(a)}
                className={`rounded-full border px-3 py-1 font-mono text-xs uppercase tracking-[0.08em] ${
                  activeAction === a ? 'border-forest bg-forest text-cream' : 'border-ink/15 text-ink/60 hover:border-forest/50'
                }`}
              >
                {a === 'status' ? 'Publish/Draft' : a === 'category' ? 'Category' : a === 'brand' ? 'Brand' : a === 'price' ? 'Price' : 'Stock'}
              </button>
            ))}
            <button
              onClick={() => runBulkAction('delete')}
              disabled={busy}
              className="ml-auto rounded-full border border-ember/40 px-3 py-1 font-mono text-xs uppercase tracking-[0.08em] text-ember hover:bg-ember/10"
            >
              Delete selected
            </button>
          </div>

          {activeAction === 'status' && (
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <select onChange={(e) => setActionValues({ status: e.target.value })} defaultValue="" className="input">
                <option value="" disabled>
                  Choose status…
                </option>
                <option value="draft">Draft</option>
                <option value="published">Published</option>
                <option value="archived">Archived</option>
              </select>
              <button disabled={busy || !actionValues.status} onClick={() => runBulkAction('status', { status: actionValues.status })} className="btn-dark">
                Apply
              </button>
            </div>
          )}

          {activeAction === 'category' && (
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <select
                onChange={(e) => setActionValues({ category: e.target.value, subcategory: '' })}
                defaultValue=""
                className="input"
              >
                <option value="" disabled>
                  Choose category…
                </option>
                {CATEGORIES.map((c) => (
                  <option key={c.slug} value={c.slug}>
                    {c.label}
                  </option>
                ))}
              </select>
              <select
                onChange={(e) => setActionValues((v) => ({ ...v, subcategory: e.target.value }))}
                value={actionValues.subcategory || ''}
                className="input"
                disabled={!actionValues.category}
              >
                <option value="">No subcategory</option>
                {subOptions.map((s) => (
                  <option key={s.slug} value={s.slug}>
                    {s.label}
                  </option>
                ))}
              </select>
              <button
                disabled={busy || !actionValues.category}
                onClick={() => runBulkAction('category', { category: actionValues.category, subcategory: actionValues.subcategory })}
                className="btn-dark"
              >
                Apply
              </button>
            </div>
          )}

          {activeAction === 'brand' && (
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <select onChange={(e) => setActionValues({ brand: e.target.value })} defaultValue="" className="input">
                <option value="" disabled>
                  Choose brand…
                </option>
                {brands.map((b) => (
                  <option key={b.id} value={b.name}>
                    {b.name}
                  </option>
                ))}
              </select>
              <button disabled={busy || !actionValues.brand} onClick={() => runBulkAction('brand', { brand: actionValues.brand })} className="btn-dark">
                Apply
              </button>
            </div>
          )}

          {activeAction === 'price' && (
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <select
                onChange={(e) => setActionValues((v) => ({ ...v, direction: e.target.value }))}
                defaultValue="increase"
                className="input"
              >
                <option value="increase">Increase by</option>
                <option value="decrease">Decrease by</option>
              </select>
              <input
                type="number"
                min="0"
                step="0.01"
                placeholder="Amount"
                onChange={(e) => setActionValues((v) => ({ ...v, value: e.target.value }))}
                className="input w-28"
              />
              <select onChange={(e) => setActionValues((v) => ({ ...v, mode: e.target.value }))} defaultValue="percent" className="input">
                <option value="percent">%</option>
                <option value="fixed">$ flat</option>
              </select>
              <button
                disabled={busy || !actionValues.value}
                onClick={() => runBulkAction('price', { mode: actionValues.mode || 'percent', direction: actionValues.direction || 'increase', value: actionValues.value })}
                className="btn-dark"
              >
                Apply
              </button>
            </div>
          )}

          {activeAction === 'stock' && (
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <select onChange={(e) => setActionValues((v) => ({ ...v, mode: e.target.value }))} defaultValue="set" className="input">
                <option value="set">Set to</option>
                <option value="increase">Increase by</option>
                <option value="decrease">Decrease by</option>
              </select>
              <input
                type="number"
                min="0"
                placeholder="Quantity"
                onChange={(e) => setActionValues((v) => ({ ...v, value: e.target.value }))}
                className="input w-28"
              />
              <button
                disabled={busy || actionValues.value === undefined}
                onClick={() => runBulkAction('stock', { mode: actionValues.mode || 'set', value: actionValues.value })}
                className="btn-dark"
              >
                Apply
              </button>
            </div>
          )}
        </div>
      )}

      <div className="mt-5 flex flex-wrap items-center gap-3">
        <div className="relative flex-1 sm:max-w-xs">
          <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-cream/40" />
          <input
            value={search}
            onChange={(e) => resetToFirstPage(setSearch)(e.target.value)}
            placeholder="Search name or SKU…"
            className="input py-2 pl-9 text-sm"
          />
        </div>
        <select value={filterCategory} onChange={(e) => resetToFirstPage(setFilterCategory)(e.target.value)} className="input py-2 text-sm">
          <option value="">All categories</option>
          {CATEGORIES.map((c) => (
            <option key={c.slug} value={c.slug}>
              {c.label}
            </option>
          ))}
        </select>
        <select value={filterBrand} onChange={(e) => resetToFirstPage(setFilterBrand)(e.target.value)} className="input py-2 text-sm">
          <option value="">All brands</option>
          {brandOptions.map((b) => (
            <option key={b} value={b}>
              {b}
            </option>
          ))}
        </select>
        <select value={filterStatus} onChange={(e) => resetToFirstPage(setFilterStatus)(e.target.value)} className="input py-2 text-sm">
          <option value="">All statuses</option>
          <option value="draft">Draft</option>
          <option value="published">Published</option>
          <option value="archived">Archived</option>
        </select>
        <select value={filterStock} onChange={(e) => resetToFirstPage(setFilterStock)(e.target.value)} className="input py-2 text-sm">
          <option value="">All stock</option>
          <option value="in">In stock</option>
          <option value="low">Low stock</option>
          <option value="out">Out of stock</option>
        </select>
      </div>

      <div className="card-surface mt-4 overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="admin-table">
            <thead>
              <tr className="[&>th]:px-6 [&>th]:pt-6">
                <th className="w-10">
                  <input type="checkbox" checked={allEditableSelected} onChange={toggleAll} disabled={products.length === 0} />
                </th>
                <th>
                  <SortHeader label="Product" sortField="name" />
                </th>
                <th>Category</th>
                <th>Subcategory</th>
                <th>
                  <SortHeader label="Price" sortField="price" />
                </th>
                <th>
                  <SortHeader label="Stock" sortField="stock" />
                </th>
                <th />
              </tr>
            </thead>
            <tbody>
              {paginated.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-10 text-center text-sm text-ink/50">
                    No products match your search/filters.
                  </td>
                </tr>
              ) : (
                paginated.map((p) => {
                  const categoryLabel = CATEGORIES.find((c) => c.slug === p.category)?.label || p.category;
                  const subLabel = SUBCATEGORIES.find((s) => s.slug === p.subcategory)?.label || p.subcategory;
                  return (
                    <tr key={p.id} className="[&>td]:px-6">
                      <td>
                        <input type="checkbox" checked={selected.has(p.id)} onChange={() => toggleOne(p.id)} />
                      </td>
                      <td>
                        <div className="flex items-center gap-3">
                          <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-sm bg-ink/5">
                            <Image src={p.img} alt={p.name} fill sizes="40px" className="object-cover" />
                          </div>
                          <div>
                            <Link href={`${editBasePath}/${p.slug}`} className="font-display text-[15px] text-ink hover:text-forest">
                              {p.name}
                            </Link>
                          </div>
                        </div>
                      </td>
                      <td>{categoryLabel}</td>
                      <td className="text-ink/60">{subLabel || '—'}</td>
                      <td className="font-mono">${Number(p.price).toFixed(2)}</td>
                      <td className="font-mono">
                        {p.stock}
                        {p.stock === 0 && <span className="ml-1.5 text-[10px] uppercase text-ember">out</span>}
                        {p.stock > 0 && p.stock <= (p.lowStockThreshold ?? 5) && (
                          <span className="ml-1.5 text-[10px] uppercase text-brass">low</span>
                        )}
                      </td>
                      <td className="text-right">
                        <ProductRowActions slug={p.slug} status={p.status} />
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        <div className="h-6" />
      </div>

      {filtered.length > 0 && (
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <p className="font-mono text-xs uppercase tracking-[0.1em] text-cream/45">
            {(currentPage - 1) * PAGE_SIZE + 1}–{Math.min(currentPage * PAGE_SIZE, filtered.length)} of {filtered.length}
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="rounded-full border border-cream/20 p-1.5 text-cream/60 hover:border-brass/50 hover:text-cream disabled:opacity-30"
              aria-label="Previous page"
            >
              <ChevronLeft size={14} />
            </button>
            <span className="font-mono text-xs text-cream/60">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="rounded-full border border-cream/20 p-1.5 text-cream/60 hover:border-brass/50 hover:text-cream disabled:opacity-30"
              aria-label="Next page"
            >
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
