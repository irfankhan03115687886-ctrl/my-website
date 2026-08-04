'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Minus, Plus, X } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { useShippingSettings } from '@/lib/useShippingSettings';

export default function CartPage() {
  const { cart, updateQty, removeFromCart, cartTotal } = useCart();
  const { shippingFee, freeShippingThreshold } = useShippingSettings();
  const shipping = cart.length === 0 || cartTotal >= freeShippingThreshold ? 0 : shippingFee;

  if (cart.length === 0) {
    return (
      <section className="mx-auto max-w-3xl bg-ink px-5 py-24 text-center sm:px-8">
        <span className="font-mono text-xs uppercase tracking-[0.2em] text-brass-light">Your bag</span>
        <h1 className="mt-3 font-display text-3xl italic text-cream">Empty, for now.</h1>
        <p className="mt-3 text-sm text-cream/60">Nothing packed yet — go find something worth carrying.</p>
        <Link href="/products" className="btn-primary mt-8">
          Shop the collection
        </Link>
      </section>
    );
  }

  return (
    <section className="mx-auto max-w-5xl bg-ink px-5 py-16 sm:px-8">
      <span className="font-mono text-xs uppercase tracking-[0.2em] text-brass-light">Your bag</span>
      <h1 className="mt-3 font-display text-3xl italic text-cream">{cart.length} {cart.length === 1 ? 'item' : 'items'} ready to ship.</h1>

      <div className="mt-10 grid gap-10 lg:grid-cols-[1fr_320px]">
        <div className="card-surface divide-y divide-ink/10 px-5">
          {cart.map((item) => (
            <div key={item.id} className="flex gap-4 py-5">
              <div className="relative h-24 w-20 shrink-0 overflow-hidden rounded-sm border border-brass/20 bg-canvas">
                <Image src={item.img} alt={item.name} fill sizes="80px" className="object-cover" />
              </div>
              <div className="flex flex-1 flex-col justify-between">
                <div className="flex items-start justify-between gap-3">
                  <Link href={`/products/${item.slug}`} className="font-display text-lg text-ink hover:text-forest">
                    {item.name}
                  </Link>
                  <button onClick={() => removeFromCart(item.id)} aria-label="Remove item" className="text-ink/40 hover:text-ember">
                    <X size={16} />
                  </button>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center rounded-full border border-ink/15">
                    <button onClick={() => updateQty(item.id, item.qty - 1)} className="p-2 text-ink/60 hover:text-ink" aria-label="Decrease quantity">
                      <Minus size={14} />
                    </button>
                    <span className="w-7 text-center font-mono text-sm text-ink">{item.qty}</span>
                    <button onClick={() => updateQty(item.id, item.qty + 1)} className="p-2 text-ink/60 hover:text-ink" aria-label="Increase quantity">
                      <Plus size={14} />
                    </button>
                  </div>
                  <span className="font-mono text-sm text-ink">${(item.price * item.qty).toFixed(2)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="card-surface h-fit p-6">
          <h2 className="font-display text-lg text-ink">Order summary</h2>
          <div className="mt-5 space-y-3 text-sm">
            <div className="flex justify-between text-ink/70">
              <span>Subtotal</span>
              <span className="font-mono">${cartTotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-ink/70">
              <span>Shipping</span>
              <span className="font-mono">{shipping === 0 ? 'Free' : `$${shipping.toFixed(2)}`}</span>
            </div>
            {shipping > 0 && (
              <p className="font-mono text-[11px] text-ember">Free shipping over ${freeShippingThreshold}</p>
            )}
          </div>
          <div className="mt-5 flex justify-between border-t border-ink/10 pt-5 font-display text-lg text-ink">
            <span>Total</span>
            <span className="font-mono">${(cartTotal + shipping).toFixed(2)}</span>
          </div>
          <Link href="/checkout" className="btn-dark mt-6 w-full">
            Checkout
          </Link>
        </div>
      </div>
    </section>
  );
}
