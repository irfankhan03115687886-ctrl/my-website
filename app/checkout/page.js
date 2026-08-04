'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import { useShippingSettings } from '@/lib/useShippingSettings';

export default function CheckoutPage() {
  const { cart, cartTotal } = useCart();
  const { user } = useAuth();
  const { shippingFee, freeShippingThreshold } = useShippingSettings();
  const [email, setEmail] = useState('');
  const [placing, setPlacing] = useState(false);
  const [error, setError] = useState('');
  const shipping = cartTotal >= freeShippingThreshold || cart.length === 0 ? 0 : shippingFee;

  async function handleCheckout(e) {
    e.preventDefault();
    setPlacing(true);
    setError('');
    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: cart, email: user?.email || email }),
      });
      const data = await res.json();
      if (!res.ok || !data.url) throw new Error(data.message || 'Could not start checkout');
      window.location.href = data.url; // Stripe's hosted, secure payment page
    } catch (err) {
      setError(err.message);
      setPlacing(false);
    }
  }

  if (cart.length === 0) {
    return (
      <section className="mx-auto max-w-lg bg-ink px-5 py-24 text-center sm:px-8">
        <h1 className="font-display text-2xl italic text-cream">Your bag is empty.</h1>
        <Link href="/products" className="btn-primary mt-6">
          Shop the collection
        </Link>
      </section>
    );
  }

  return (
    <section className="mx-auto max-w-3xl bg-ink px-5 py-16 sm:px-8">
      <span className="font-mono text-xs uppercase tracking-[0.2em] text-brass-light">Checkout</span>
      <h1 className="mt-3 font-display text-3xl italic text-cream">Review your order.</h1>
      <p className="mt-2 max-w-md text-sm text-cream/60">
        Shipping address and payment are collected securely on Stripe's own checkout page — we never see or store your card details.
      </p>

      <form onSubmit={handleCheckout} className="card-surface mt-8 p-7">
        <div className="space-y-2">
          {cart.map((item) => (
            <div key={item.id} className="flex justify-between text-sm text-ink/70">
              <span>{item.name} × {item.qty}</span>
              <span className="font-mono">${(item.price * item.qty).toFixed(2)}</span>
            </div>
          ))}
        </div>

        <div className="mt-5 space-y-2 border-t border-ink/10 pt-4 text-sm text-ink/70">
          <div className="flex justify-between"><span>Subtotal</span><span className="font-mono">${cartTotal.toFixed(2)}</span></div>
          <div className="flex justify-between"><span>Shipping</span><span className="font-mono">{shipping === 0 ? 'Free' : `$${shipping.toFixed(2)}`}</span></div>
        </div>
        <div className="mt-4 flex justify-between border-t border-ink/10 pt-4 font-display text-lg text-ink">
          <span>Total</span>
          <span className="font-mono">${(cartTotal + shipping).toFixed(2)}</span>
        </div>

        {!user && (
          <input
            type="email"
            required
            placeholder="Email for your receipt"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="input mt-5"
          />
        )}

        {error && <p className="mt-3 text-xs text-ember">{error}</p>}

        <button type="submit" disabled={placing} className="btn-dark mt-6 w-full disabled:opacity-60">
          {placing ? 'Redirecting to secure payment…' : 'Continue to secure payment'}
        </button>
      </form>
    </section>
  );
}
