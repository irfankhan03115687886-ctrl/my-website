'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function AccountSettingsForm({ marketingOptIn: initialOptIn }) {
  const router = useRouter();
  const [marketingOptIn, setMarketingOptIn] = useState(initialOptIn);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const [confirming, setConfirming] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [deleteStatus, setDeleteStatus] = useState('idle'); // idle | loading | error
  const [deleteError, setDeleteError] = useState('');

  async function toggleMarketing() {
    const next = !marketingOptIn;
    setMarketingOptIn(next);
    setSaving(true);
    try {
      await fetch('/api/account/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ marketingOptIn: next }),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteAccount(e) {
    e.preventDefault();
    if (!deletePassword) return;
    setDeleteStatus('loading');
    setDeleteError('');
    try {
      const res = await fetch('/api/account/delete-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: deletePassword }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message || 'Could not delete your account.');
      // Account and session are gone server-side — send them home.
      router.push('/');
      router.refresh();
    } catch (err) {
      setDeleteError(err.message);
      setDeleteStatus('error');
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <h3 className="font-display text-base text-ink">Email preferences</h3>
        <label className="mt-3 flex items-center gap-3 text-sm text-ink/70">
          <input type="checkbox" checked={marketingOptIn} onChange={toggleMarketing} disabled={saving} />
          Send me new drops, restocks, and offers
        </label>
        {saved && <p className="mt-2 font-mono text-xs uppercase tracking-wide text-forest">Saved</p>}
      </div>

      <div className="border-t border-ink/10 pt-6">
        <h3 className="font-display text-base text-ember">Delete account</h3>
        <p className="mt-1 max-w-md text-sm text-ink/60">
          This permanently deletes your account, saved addresses, and reviews. Your password confirms it's really you.
          This can't be undone.
        </p>
        {confirming ? (
          <form onSubmit={handleDeleteAccount} className="mt-3 max-w-sm space-y-3">
            <input
              type="password"
              required
              autoFocus
              value={deletePassword}
              onChange={(e) => setDeletePassword(e.target.value)}
              placeholder="Confirm your password"
              autoComplete="current-password"
              className="input w-full"
            />
            {deleteStatus === 'error' && <p className="text-xs text-ember">{deleteError}</p>}
            <div className="flex gap-3">
              <button
                type="submit"
                disabled={deleteStatus === 'loading'}
                className="rounded-full border border-ember bg-ember px-5 py-2 font-mono text-xs uppercase tracking-[0.1em] text-cream disabled:opacity-60"
              >
                {deleteStatus === 'loading' ? 'Deleting…' : 'Permanently delete my account'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setConfirming(false);
                  setDeletePassword('');
                  setDeleteError('');
                  setDeleteStatus('idle');
                }}
                className="btn-outline-ink"
              >
                Cancel
              </button>
            </div>
          </form>
        ) : (
          <button onClick={() => setConfirming(true)} className="mt-3 font-mono text-xs uppercase tracking-[0.1em] text-ember underline">
            Delete my account
          </button>
        )}
      </div>
    </div>
  );
}
