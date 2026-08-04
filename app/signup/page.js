'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

export default function SignupPage() {
  const [status, setStatus] = useState('idle');
  const [error, setError] = useState('');
  const router = useRouter();
  const { refresh } = useAuth();

  async function handleSubmit(e) {
    e.preventDefault();
    setStatus('loading');
    setError('');
    const form = new FormData(e.target);
    const data = Object.fromEntries(form.entries());
    if (data.password !== data.confirmPassword) {
      setError('Passwords do not match');
      setStatus('error');
      return;
    }
    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const text = await res.text();
      const result = text ? JSON.parse(text) : {};
      if (!res.ok) throw new Error(result.message || 'Could not create account');
      await refresh();
      router.push('/account');
    } catch (err) {
      setError(err.message);
      setStatus('error');
    }
  }

  return (
    <section className="mx-auto flex min-h-[70vh] max-w-md flex-col justify-center bg-ink px-5 py-16 sm:px-8">
      <span className="font-mono text-xs uppercase tracking-[0.2em] text-brass-light">Join the crew</span>
      <h1 className="mt-3 font-display text-3xl italic text-cream">Create your account.</h1>

      <div className="card-surface mt-8 p-7">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <input name="firstName" required placeholder="First name" className="input" />
            <input name="lastName" required placeholder="Last name" className="input" />
          </div>
          <input name="email" type="email" required placeholder="Email" className="input" />
          <input name="password" type="password" required minLength={8} placeholder="Password (min 8 characters)" className="input" />
          <input name="confirmPassword" type="password" required placeholder="Confirm password" className="input" />
          {error && <p className="text-xs text-ember">{error}</p>}
          <button type="submit" disabled={status === 'loading'} className="btn-dark w-full disabled:opacity-60">
            {status === 'loading' ? 'Creating account…' : 'Create account'}
          </button>
        </form>
      </div>

      <p className="mt-6 text-center text-sm text-cream/60">
        Already have an account? <Link href="/login" className="text-brass-light underline underline-offset-2">Sign in</Link>
      </p>
    </section>
  );
}
