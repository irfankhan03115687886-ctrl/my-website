'use client';

import { useState } from 'react';

export default function ChangePasswordForm() {
  const [form, setForm] = useState({ current: '', next: '', confirm: '' });
  const [status, setStatus] = useState('idle');
  const [message, setMessage] = useState('');

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setMessage('');
    if (form.next.length < 8) {
      setMessage('New password must be at least 8 characters.');
      setStatus('error');
      return;
    }
    if (form.next !== form.confirm) {
      setMessage('New passwords do not match.');
      setStatus('error');
      return;
    }
    setStatus('loading');
    try {
      const res = await fetch('/api/account/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword: form.current, newPassword: form.next }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message || 'Could not change password');
      setStatus('done');
      setMessage('Password updated.');
      setForm({ current: '', next: '', confirm: '' });
    } catch (err) {
      setStatus('error');
      setMessage(err.message);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-md space-y-4">
      <label className="block">
        <span className="font-mono text-[11px] uppercase tracking-[0.1em] text-ink/50">Current password</span>
        <input
          type="password"
          required
          value={form.current}
          onChange={(e) => update('current', e.target.value)}
          className="input mt-1.5 w-full"
        />
      </label>
      <label className="block">
        <span className="font-mono text-[11px] uppercase tracking-[0.1em] text-ink/50">New password</span>
        <input
          type="password"
          required
          value={form.next}
          onChange={(e) => update('next', e.target.value)}
          className="input mt-1.5 w-full"
        />
      </label>
      <label className="block">
        <span className="font-mono text-[11px] uppercase tracking-[0.1em] text-ink/50">Confirm new password</span>
        <input
          type="password"
          required
          value={form.confirm}
          onChange={(e) => update('confirm', e.target.value)}
          className="input mt-1.5 w-full"
        />
      </label>
      <div className="flex items-center gap-4">
        <button type="submit" disabled={status === 'loading'} className="btn-dark">
          {status === 'loading' ? 'Saving…' : 'Update password'}
        </button>
        {status === 'done' && <span className="font-mono text-xs uppercase tracking-wide text-forest">{message}</span>}
        {status === 'error' && <span className="text-xs text-ember">{message}</span>}
      </div>
    </form>
  );
}
