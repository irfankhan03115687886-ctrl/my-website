'use client';

import { useMemo, useState } from 'react';
import { Search, Star, Check, X, Trash2 } from 'lucide-react';
import clsx from 'clsx';
import { formatDate } from '@/lib/formatDate';

const PAGE_SIZE = 15;

const STATUS_STYLES = {
  pending: 'border-brass/40 text-brass-light',
  approved: 'border-forest text-forest',
  rejected: 'border-ember text-ember',
};

export default function ReviewsManager({ initialReviews }) {
  const [reviews, setReviews] = useState(initialReviews);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [busyId, setBusyId] = useState(null);
  const [error, setError] = useState('');

  const filtered = useMemo(() => {
    let list = reviews;
    if (statusFilter !== 'all') list = list.filter((r) => r.status === statusFilter);
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(
        (r) =>
          (r.product_name || '').toLowerCase().includes(q) ||
          `${r.first_name} ${r.last_name}`.toLowerCase().includes(q) ||
          (r.email || '').toLowerCase().includes(q) ||
          (r.title || '').toLowerCase().includes(q) ||
          (r.body || '').toLowerCase().includes(q)
      );
    }
    return list;
  }, [reviews, search, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageItems = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const pendingCount = reviews.filter((r) => r.status === 'pending').length;

  async function updateStatus(review, status) {
    setBusyId(review.id);
    setError('');
    try {
      const res = await fetch(`/api/admin/reviews/${review.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message || 'Could not update review');
      setReviews((prev) => prev.map((r) => (r.id === review.id ? { ...r, ...data.review } : r)));
    } catch (err) {
      setError(err.message);
    } finally {
      setBusyId(null);
    }
  }

  async function handleDelete(review) {
    if (!confirm('Delete this review permanently?')) return;
    setBusyId(review.id);
    setError('');
    try {
      const res = await fetch(`/api/admin/reviews/${review.id}`, { method: 'DELETE' });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message || 'Could not delete review');
      setReviews((prev) => prev.filter((r) => r.id !== review.id));
    } catch (err) {
      setError(err.message);
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink/30" />
            <input
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Search reviews…"
              className="input w-64 pl-8"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="input w-auto"
          >
            <option value="all">All ({reviews.length})</option>
            <option value="pending">Pending ({pendingCount})</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
        <span className="font-mono text-xs uppercase tracking-[0.1em] text-ink/40">
          {filtered.length} review{filtered.length === 1 ? '' : 's'}
        </span>
      </div>

      {error && <p className="mt-3 text-xs text-ember">{error}</p>}

      <div className="mt-5 space-y-4">
        {pageItems.map((review) => (
          <div key={review.id} className="rounded-md border border-ink/10 p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="font-display text-base text-ink">{review.product_name || review.product_slug}</p>
                <p className="mt-0.5 text-xs text-ink/50">
                  {review.first_name} {review.last_name} · {review.email}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <span className={clsx('rounded-full border px-2.5 py-0.5 font-mono text-[10px] uppercase tracking-[0.1em]', STATUS_STYLES[review.status])}>
                  {review.status}
                </span>
                <span className="font-mono text-xs text-ink/40">{formatDate(review.created_at)}</span>
              </div>
            </div>
            <div className="mt-3 flex items-center gap-0.5">
              {[1, 2, 3, 4, 5].map((n) => (
                <Star key={n} size={13} fill={n <= review.rating ? '#15654E' : 'none'} stroke={n <= review.rating ? '#15654E' : '#8a8a8a'} />
              ))}
            </div>
            {review.title && <p className="mt-2 text-sm font-semibold text-ink">{review.title}</p>}
            {review.body && <p className="mt-1 text-sm text-ink/70">{review.body}</p>}
            <div className="mt-4 flex flex-wrap gap-3 border-t border-ink/10 pt-4">
              {review.status !== 'approved' && (
                <button
                  onClick={() => updateStatus(review, 'approved')}
                  disabled={busyId === review.id}
                  className="inline-flex items-center gap-1.5 font-mono text-xs uppercase tracking-[0.1em] text-forest disabled:opacity-50"
                >
                  <Check size={13} /> Approve
                </button>
              )}
              {review.status !== 'rejected' && (
                <button
                  onClick={() => updateStatus(review, 'rejected')}
                  disabled={busyId === review.id}
                  className="inline-flex items-center gap-1.5 font-mono text-xs uppercase tracking-[0.1em] text-ink/50 disabled:opacity-50"
                >
                  <X size={13} /> Reject
                </button>
              )}
              <button
                onClick={() => handleDelete(review)}
                disabled={busyId === review.id}
                className="inline-flex items-center gap-1.5 font-mono text-xs uppercase tracking-[0.1em] text-ember disabled:opacity-50"
              >
                <Trash2 size={13} /> Delete
              </button>
            </div>
          </div>
        ))}
        {pageItems.length === 0 && <p className="py-10 text-center text-sm text-ink/40">No reviews found.</p>}
      </div>

      {totalPages > 1 && (
        <div className="mt-6 flex items-center justify-center gap-3">
          <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="rounded-full border border-ink/15 px-3 py-1 text-xs disabled:opacity-30">
            Prev
          </button>
          <span className="font-mono text-xs text-ink/50">
            Page {page} of {totalPages}
          </span>
          <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="rounded-full border border-ink/15 px-3 py-1 text-xs disabled:opacity-30">
            Next
          </button>
        </div>
      )}
    </div>
  );
}
