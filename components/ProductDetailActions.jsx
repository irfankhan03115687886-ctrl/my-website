'use client';

import { useState } from 'react';
import { Heart, Minus, Plus } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { fireToast } from './Toast';

export default function ProductDetailActions({ product }) {
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);
  const { addToCart, toggleWishlist, wishlist } = useCart();
  const isWishlisted = wishlist.some((item) => item.id === product.id);
  const outOfStock = product.stock === 0;
  const atMax = product.stock > 0 && qty >= product.stock;

  function handleAdd() {
    addToCart(product, qty);
    fireToast(product.name);
    setAdded(true);
    setTimeout(() => setAdded(false), 1800);
  }

  return (
    <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-center">
      <div className="flex items-center rounded-full border border-brass/25 bg-canvas-2">
        <button
          onClick={() => setQty((q) => Math.max(1, q - 1))}
          className="p-3 text-ink/60 hover:text-ink"
          aria-label="Decrease quantity"
        >
          <Minus size={16} />
        </button>
        <span className="w-8 text-center font-mono text-sm text-ink">{qty}</span>
        <button
          onClick={() => setQty((q) => (product.stock ? Math.min(product.stock, q + 1) : q + 1))}
          disabled={atMax}
          className="p-3 text-ink/60 hover:text-ink disabled:cursor-not-allowed disabled:text-ink/20"
          aria-label="Increase quantity"
        >
          <Plus size={16} />
        </button>
      </div>

      <button
        onClick={handleAdd}
        disabled={outOfStock}
        className="flex-1 rounded-full border border-forest bg-forest py-3.5 font-mono text-[13px] uppercase tracking-[0.12em] text-cream transition-all duration-300 ease-out hover:-translate-y-0.5 hover:bg-forest-2 hover:shadow-[0_10px_24px_rgba(0,0,0,0.28)] active:translate-y-0 active:scale-[0.97] disabled:cursor-not-allowed disabled:border-cream/10 disabled:bg-cream/10 disabled:text-cream/30 disabled:hover:translate-y-0 disabled:hover:shadow-none"
      >
        {outOfStock ? 'Sold out' : added ? 'Added to cart ✓' : 'Add to cart'}
      </button>

      <button
        onClick={() => toggleWishlist(product)}
        aria-label="Toggle wishlist"
        className="flex items-center justify-center rounded-full border border-cream/20 p-3.5 text-cream/70 transition-colors hover:border-ember hover:text-ember"
      >
        <Heart size={18} fill={isWishlisted ? '#8C4A2F' : 'none'} stroke={isWishlisted ? '#8C4A2F' : 'currentColor'} />
      </button>
    </div>
  );
}
