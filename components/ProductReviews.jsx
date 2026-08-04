'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Star } from 'lucide-react';
import clsx from 'clsx';
import { useAuth } from '@/context/AuthContext';
import { formatDate } from '@/lib/formatDate';

function StarRow({ rating, size = 14, onRate, interactive = false }) {
  const [hover, setHover] = useState(0);
  const active = interactive ? hover || rating : rating;
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          disabled={!interactive}
          onClick={() => interactive && onRate(n)}
          onMouseEnter={() => interactive && setHover(n)}
          onMouseLeave={() => interactive && setHover(0)}
          className={clsx(!interactive && 'cursor-default')}
          aria-label={`${n} star${n === 1 ? '' : 's'}`}
        >
          <Star size={size} fill={n <= active ? '#15654E' : 'none'} stroke={n <= active ? '#15654E' : '#8a8a8a'} strokeWidth={1.4} />
        </button>
      ))}
    </div>
  );
}

function ReviewForm({ productSlug, existingReview, onSaved }) {
  const [rating, setRating] = useState(existingReview?.rating || 0);
  const [title, setTitle] = useState(existingReview?.title || '');
  const [body, setBody] = useState(existingReview?.body || '');
  const [status, setStatus] = useState('idle');
  const [error, setError] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    if (!rating) {
      setError('Choose a star rating.');
      return;
    }
    setStatus('loading');
    setError('');
    try {
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productSlug, rating, title, body }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message || 'Could not save your review.');
      setStatus('done');
      onSaved(data.review);
    } catch (err) {
      setError(err.message);
      setStatus('error');
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3 rounded-md border border-brass/20 p-5">
      <div>
        <span className="font-mono text-[11px] uppercase tracking-[0.1em] text-cream/50">Your rating</span>
        <div className="mt-1.5">
          <StarRow rating={rating} onRate={setRating} interactive size={20} />
        </div>
      </div>
      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Review title (optional)"
        maxLength={120}
        className="input w-full"
      />
      <textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder="Share details about your experience with this product (optional)"
        maxLength={4000}
        rows={4}
        className="input w-full resize-none"
      />
      {error && <p className="text-xs text-ember">{error}</p>}
      {status === 'done' && (
        <p className="text-xs text-forest">
          Thanks — your review is saved and will show once it's approved.
        </p>
      )}
      <button type="submit" disabled={status === 'loading'} className="btn-dark disabled:opacity-60">
        {status === 'loading' ? 'Saving…' : existingReview ? 'Update review' : 'Submit review'}
      </button>
    </form>
  );
}

export default function ProductReviews({ productSlug, summary, reviews, ownReview: initialOwnReview }) {
  const { user, loading } = useAuth();
  const [ownReview, setOwnReview] = useState(initialOwnReview);
  const [editing, setEditing] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [localReviews, setLocalReviews] = useState(reviews);

  async function handleDelete() {
    if (!ownReview || !confirm('Delete your review?')) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/reviews/${ownReview.id}`, { method: 'DELETE' });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message || 'Could not delete review');
      setLocalReviews((prev) => prev.filter((r) => r.id !== ownReview.id));
      setOwnReview(null);
    } catch (err) {
      alert(err.message);
    } finally {
      setDeleting(false);
    }
  }

  const maxCount = Math.max(1, ...Object.values(summary.distribution));

  return (
    <div className="mt-24 border-t border-brass/15 pt-14">
      <h2 className="font-display text-2xl italic text-cream">Reviews</h2>

      <div className="mt-8 grid gap-10 lg:grid-cols-[280px_1fr]">
        <div>
          <div className="flex items-baseline gap-2">
            <span className="font-display text-4xl text-cream">{summary.average || '—'}</span>
            <span className="text-sm text-cream/50">/ 5</span>
          </div>
          <div className="mt-1">
            <StarRow rating={Math.round(summary.average)} />
          </div>
          <p className="mt-1 text-sm text-cream/50">
            {summary.count} review{summary.count === 1 ? '' : 's'}
          </p>

          <div className="mt-5 space-y-1.5">
            {[5, 4, 3, 2, 1].map((n) => (
              <div key={n} className="flex items-center gap-2 text-xs text-cream/50">
                <span className="w-3 font-mono">{n}</span>
                <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-cream/10">
                  <div
                    className="h-full rounded-full bg-forest"
                    style={{ width: `${(summary.distribution[n] / maxCount) * 100}%` }}
                  />
                </div>
                <span className="w-4 text-right font-mono">{summary.distribution[n]}</span>
              </div>
            ))}
          </div>
        </div>

        <div>
          {!loading && user && !ownReview && !editing && (
            <button onClick={() => setEditing(true)} className="btn-outline mb-6">
              Write a review
            </button>
          )}
          {!loading && !user && (
            <p className="mb-6 text-sm text-cream/60">
              <Link href="/login" className="text-brass-light underline underline-offset-2">
                Sign in
              </Link>{' '}
              to write a review.
            </p>
          )}
          {!loading && user && ownReview && !editing && (
            <div className="mb-8 rounded-md border border-brass/25 bg-canvas-2/5 p-5">
              <p className="font-mono text-xs uppercase tracking-[0.1em] text-brass-light">Your review</p>
              <div className="mt-2 flex items-center gap-2">
                <StarRow rating={ownReview.rating} />
                <span className="text-xs text-cream/40">
                  {ownReview.status === 'pending' && '(awaiting approval)'}
                  {ownReview.status === 'rejected' && '(not approved)'}
                </span>
              </div>
              {ownReview.title && <p className="mt-2 font-display text-base italic text-cream">{ownReview.title}</p>}
              {ownReview.body && <p className="mt-1 text-sm text-cream/70">{ownReview.body}</p>}
              <div className="mt-3 flex gap-4">
                <button onClick={() => setEditing(true)} className="font-mono text-xs uppercase tracking-[0.1em] text-brass-light underline">
                  Edit
                </button>
                <button
                  onClick={handleDelete}
                  disabled={deleting}
                  className="font-mono text-xs uppercase tracking-[0.1em] text-ember underline disabled:opacity-50"
                >
                  {deleting ? 'Deleting…' : 'Delete'}
                </button>
              </div>
            </div>
          )}
          {!loading && user && editing && (
            <div className="mb-8">
              <ReviewForm
                productSlug={productSlug}
                existingReview={ownReview}
                onSaved={(review) => {
                  setOwnReview(review);
                  setEditing(false);
                }}
              />
              <button onClick={() => setEditing(false)} className="mt-2 font-mono text-xs uppercase tracking-[0.1em] text-cream/40 underline">
                Cancel
              </button>
            </div>
          )}

          <div className="space-y-6">
            {localReviews.length === 0 ? (
              <p className="text-sm text-cream/50">No reviews yet — be the first to share your experience.</p>
            ) : (
              localReviews.map((r) => (
                <div key={r.id} className="border-b border-cream/10 pb-6 last:border-0">
                  <div className="flex items-center justify-between">
                    <StarRow rating={r.rating} />
                    <span className="font-mono text-xs text-cream/40">{formatDate(r.created_at)}</span>
                  </div>
                  {r.title && <p className="mt-2 font-display text-base italic text-cream">{r.title}</p>}
                  {r.body && <p className="mt-1 text-sm leading-relaxed text-cream/70">{r.body}</p>}
                  <p className="mt-2 font-mono text-xs uppercase tracking-[0.08em] text-cream/40">
                    {r.first_name} {r.last_name?.[0]}.
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
