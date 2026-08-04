'use client';

import Link from 'next/link';
import { useCart } from '@/context/CartContext';
import ProductCard from '@/components/ProductCard';
import { Heart } from 'lucide-react';

export default function WishlistContent({ compact = false }) {
  const { wishlist } = useCart();

  if (wishlist.length === 0) {
    return (
      <div className={compact ? 'py-12 text-center' : 'mx-auto max-w-lg py-24 text-center'}>
        <Heart size={28} className="mx-auto text-brass-light" strokeWidth={1.5} />
        <span className="mt-5 block font-mono text-xs uppercase tracking-[0.2em] text-brass-light">Your wishlist</span>
        <h2 className="mt-3 font-display text-2xl italic text-cream lg:text-3xl">Nothing saved yet.</h2>
        <p className="mt-3 text-sm text-cream/60">Tap the heart on anything you love — it'll show up here.</p>
        <Link href="/products" className="btn-primary mt-8 inline-flex">
          Shop the collection
        </Link>
      </div>
    );
  }

  return (
    <div>
      {!compact && (
        <p className="mb-6 text-sm text-cream/60">
          {wishlist.length} {wishlist.length === 1 ? 'piece' : 'pieces'} you're keeping an eye on. Tap the heart to remove,
          or add straight to your cart.
        </p>
      )}
      <div className="grid grid-cols-2 gap-5 lg:grid-cols-4">
        {wishlist.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </div>
  );
}
