'use client';

import { Suspense, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [status, setStatus] = useState('idle');
  const [error, setError] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    if (password !== confirm) {
      setError('Passwords do not match.');
      return;
    }
    setStatus('loading');
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message || 'Could not reset password');
      setStatus('done');
      setTimeout(() => router.push('/login'), 2000);
    } catch (err) {
      setError(err.message);
      setStatus('error');
    }
  }

  if (!token) {
    return (
      <div className="card-surface mt-8 p-7 text-center">
        <p className="text-sm text-ink/70">This reset link is missing its token. Request a new one below.</p>
        <Link href="/forgot-password" className="btn-dark mt-5 inline-flex">
          Request a new link
        </Link>
      </div>
    );
  }

  if (status === 'done') {
    return (
      <div className="card-surface mt-8 p-7 text-center">
        <p className="text-sm text-forest">Password updated. Redirecting you to sign in…</p>
      </div>
    );
  }

  return (
    <div className="card-surface mt-8 p-7">
      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="New password"
          className="input"
        />
        <input
          type="password"
          required
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          placeholder="Confirm new password"
          className="input"
        />
        {error && <p className="text-xs text-ember">{error}</p>}
        <button type="submit" disabled={status === 'loading'} className="btn-dark w-full disabled:opacity-60">
          {status === 'loading' ? 'Saving…' : 'Reset password'}
        </button>
      </form>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <section className="mx-auto flex min-h-[70vh] max-w-md flex-col justify-center bg-ink px-5 py-16 sm:px-8">
      <span className="font-mono text-xs uppercase tracking-[0.2em] text-brass-light">Account recovery</span>
      <h1 className="mt-3 font-display text-3xl italic text-cream">Set a new password.</h1>
      <Suspense fallback={null}>
        <ResetPasswordForm />
      </Suspense>
    </section>
  );
}
