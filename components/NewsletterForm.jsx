'use client';

import { useState } from 'react';

export default function NewsletterForm({ variant = 'light' }) {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState('idle'); // idle | loading | done | error
  const onDark = variant === 'dark';

  async function handleSubmit(e) {
    e.preventDefault();
    if (!email) return;
    setStatus('loading');
    try {
      const res = await fetch('/api/newsletter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      if (!res.ok) throw new Error('Request failed');
      setStatus('done');
      setEmail('');
    } catch {
      setStatus('error');
    }
  }

  if (status === 'done') {
    return <p className={`font-mono text-sm ${onDark ? 'text-brass-light' : 'text-forest'}`}>You're on the list. Welcome aboard.</p>;
  }

  return (
    <form onSubmit={handleSubmit} className="flex w-full max-w-sm gap-2">
      <input
        type="email"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="you@trailhead.com"
        className="w-full rounded-full border border-ink/15 bg-canvas px-4 py-2.5 text-sm text-ink placeholder:text-ink/40 focus:border-brass"
      />
      <button
        type="submit"
        disabled={status === 'loading'}
        className={
          onDark
            ? 'shrink-0 rounded-full bg-cream px-5 py-2.5 font-mono text-xs uppercase tracking-[0.1em] text-ink transition-colors hover:bg-brass-light disabled:opacity-60'
            : 'shrink-0 rounded-full bg-ink px-5 py-2.5 font-mono text-xs uppercase tracking-[0.1em] text-cream transition-colors hover:bg-forest disabled:opacity-60'
        }
      >
        {status === 'loading' ? 'Sending' : 'Join'}
      </button>
    </form>
  );
}
