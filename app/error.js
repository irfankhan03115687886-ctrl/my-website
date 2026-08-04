'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { AlertTriangle } from 'lucide-react';

export default function GlobalError({ error, reset }) {
  useEffect(() => {
    // Log the real error server-side (console here; wire to a real
    // error-tracking service like Sentry when you have one) — never
    // show the raw message/stack to the customer.
    console.error('[app error]', error);
  }, [error]);

  return (
    <section className="flex min-h-[70vh] flex-col items-center justify-center bg-ink px-5 text-center sm:px-8">
      <AlertTriangle size={32} className="text-ember" strokeWidth={1.5} />
      <span className="mt-5 font-mono text-xs uppercase tracking-[0.2em] text-brass-light">Something went wrong</span>
      <h1 className="mt-3 font-display text-3xl italic text-cream">That wasn't supposed to happen.</h1>
      <p className="mt-3 max-w-sm text-sm leading-relaxed text-cream/60">
        Our side, not yours — try again in a moment. If it keeps happening, reach out through the contact page.
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-4">
        <button onClick={() => reset()} className="btn-primary">
          Try again
        </button>
        <Link href="/" className="btn-outline">
          Back home
        </Link>
      </div>
    </section>
  );
}
