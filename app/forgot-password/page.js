'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState('idle');
  const [message, setMessage] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    setStatus('loading');
    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message || 'Something went wrong');
      setMessage(data.message);
      setStatus('done');
    } catch (err) {
      setMessage(err.message);
      setStatus('error');
    }
  }

  return (
    <section className="mx-auto flex min-h-[70vh] max-w-md flex-col justify-center bg-ink px-5 py-16 sm:px-8">
      <span className="font-mono text-xs uppercase tracking-[0.2em] text-brass-light">Account recovery</span>
      <h1 className="mt-3 font-display text-3xl italic text-cream">Forgot your password?</h1>
      <p className="mt-2 text-sm text-cream/60">Enter your email and we'll send you a link to reset it.</p>

      <div className="card-surface mt-8 p-7">
        {status === 'done' ? (
          <p className="text-sm text-forest">{message}</p>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email"
              className="input"
            />
            {status === 'error' && <p className="text-xs text-ember">{message}</p>}
            <button type="submit" disabled={status === 'loading'} className="btn-dark w-full disabled:opacity-60">
              {status === 'loading' ? 'Sending…' : 'Send reset link'}
            </button>
          </form>
        )}
      </div>

      <p className="mt-6 text-center text-sm text-cream/60">
        <Link href="/login" className="text-brass-light underline underline-offset-2">
          Back to sign in
        </Link>
      </p>
    </section>
  );
}
