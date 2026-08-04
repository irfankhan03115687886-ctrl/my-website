'use client';

import { Suspense, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

function LoginForm() {
  const [status, setStatus] = useState('idle');
  const [error, setError] = useState('');
  const router = useRouter();
  const searchParams = useSearchParams();
  const { refresh } = useAuth();

  async function handleSubmit(e) {
    e.preventDefault();
    setStatus('loading');
    setError('');
    const form = new FormData(e.target);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(Object.fromEntries(form.entries())),
      });
      const text = await res.text();
      const data = text ? JSON.parse(text) : {};
      if (!res.ok) throw new Error(data.message || 'Could not sign in');
      await refresh();
      const next = searchParams.get('next');
      router.push(next && next.startsWith('/') ? next : '/account');
    } catch (err) {
      setError(err.message);
      setStatus('error');
    }
  }

  return (
    <section className="mx-auto flex min-h-[70vh] max-w-md flex-col justify-center bg-ink px-5 py-16 sm:px-8">
      <span className="font-mono text-xs uppercase tracking-[0.2em] text-brass-light">Welcome back</span>
      <h1 className="mt-3 font-display text-3xl italic text-cream">Sign in to your account.</h1>

      <div className="card-surface mt-8 p-7">
        <form onSubmit={handleSubmit} className="space-y-4">
          <input name="email" type="email" required placeholder="Email" className="input" />
          <div>
            <input name="password" type="password" required placeholder="Password" className="input" />
            <div className="mt-2 text-right">
              <Link href="/forgot-password" className="font-mono text-xs uppercase tracking-wide text-brass-light hover:underline">
                Forgot password?
              </Link>
            </div>
          </div>
          {error && <p className="text-xs text-ember">{error}</p>}
          <button type="submit" disabled={status === 'loading'} className="btn-dark w-full disabled:opacity-60">
            {status === 'loading' ? 'Signing in…' : 'Sign in'}
          </button>
        </form>
      </div>

      <p className="mt-6 text-center text-sm text-cream/60">
        New here? <Link href="/signup" className="text-brass-light underline underline-offset-2">Create an account</Link>
      </p>
    </section>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}
