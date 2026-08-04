'use client';

import { useState } from 'react';

function ContactForm() {
  const [status, setStatus] = useState('idle');

  async function handleSubmit(e) {
    e.preventDefault();
    setStatus('loading');
    const form = new FormData(e.target);
    try {
      await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(Object.fromEntries(form.entries())),
      });
      setStatus('done');
      e.target.reset();
    } catch {
      setStatus('error');
    }
  }

  if (status === 'done') {
    return (
      <p className="rounded-md border border-forest/40 bg-forest/10 p-5 text-sm text-forest">
        Message sent. We usually reply within a day.
      </p>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <input name="name" required placeholder="Your name" className="input" />
        <input name="email" type="email" required placeholder="Email" className="input" />
      </div>
      <input name="subject" required placeholder="Subject" className="input" />
      <textarea name="message" required placeholder="How can we help?" rows={5} className="input resize-none" />
      {status === 'error' && <p className="text-xs text-ember">Something went wrong — please try again.</p>}
      <button type="submit" disabled={status === 'loading'} className="btn-dark disabled:opacity-60">
        {status === 'loading' ? 'Sending…' : 'Send message'}
      </button>
    </form>
  );
}

export default function ContactPage() {
  return (
    <section className="mx-auto max-w-3xl bg-ink px-5 py-20 sm:px-8">
      <span className="font-mono text-xs uppercase tracking-[0.2em] text-brass-light">Get in touch</span>
      <h1 className="mt-3 font-display text-4xl italic text-cream">We read every message.</h1>
      <p className="mt-4 max-w-md text-sm text-cream/60">
        Questions about sizing, an order, or a repair — reach out and a real person from the shop will get back to you.
      </p>
      <div className="card-surface mt-10 p-7">
        <ContactForm />
      </div>
    </section>
  );
}
