'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Heart, Star } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import clsx from 'clsx';
import StampBadge from './StampBadge';
import { fireToast } from './Toast';
import TiltCard from './TiltCard';

export default function ProductCard({ product }) {
  const { addToCart, toggleWishlist, wishlist } = useCart();
  const isWishlisted = wishlist.some((item) => item.id === product.id);
  const outOfStock = product.stock === 0;
  const lowStock = product.stock > 0 && product.stock <= 5;

  return (
    <TiltCard className="group relative rounded-2xl border border-ink/8 bg-canvas-2 shadow-[0_1px_2px_rgba(0,0,0,0.04),0_16px_36px_rgba(0,0,0,0.10)] transition-shadow duration-300 hover:shadow-[0_1px_2px_rgba(0,0,0,0.05),0_24px_48px_rgba(0,0,0,0.16)]">
      <StampBadge label={product.badge} />

      <button
        onClick={() => toggleWishlist(product)}
        aria-label="Toggle wishlist"
        className="absolute right-3 top-3 z-10 rounded-full bg-canvas-2/90 p-2 text-ink/50 shadow-sm backdrop-blur transition-colors hover:text-ember"
      >
        <Heart size={16} fill={isWishlisted ? '#8C4A2F' : 'none'} stroke={isWishlisted ? '#8C4A2F' : 'currentColor'} />
      </button>

      <Link href={`/products/${product.slug}`} className="block overflow-hidden rounded-t-2xl p-3">
        <div className="relative aspect-[4/5] w-full overflow-hidden rounded-xl bg-ink/5">
          <Image
            src={product.img}
            alt={product.name}
            fill
            sizes="(max-width: 768px) 50vw, 25vw"
            className={clsx('object-cover transition-transform duration-700 ease-out group-hover:scale-[1.04]', outOfStock && 'grayscale')}
          />
          {outOfStock && (
            <div className="absolute inset-0 flex items-center justify-center bg-ink/40">
              <span className="rounded-full bg-ink px-3 py-1 font-mono text-[11px] uppercase tracking-[0.14em] text-cream">Out of stock</span>
            </div>
          )}
        </div>
      </Link>

      <div className="px-4 pb-4 pt-1">
        <Link href={`/products/${product.slug}`}>
          <h3 className="font-display text-[17px] leading-snug text-ink hover:text-forest">{product.name}</h3>
        </Link>
        <div className="mt-1 flex items-center gap-1 text-xs text-ink/50">
          <Star size={12} fill="#15654E" stroke="none" />
          <span className="font-mono">{product.rating}</span>
          <span>· {product.reviews} reviews</span>
        </div>

        <div className="mt-3 flex items-center justify-between">
          <div className="flex items-baseline gap-2">
            <span className="font-mono text-base text-ink">${product.price}</span>
            {product.oldPrice && (
              <span className="font-mono text-xs text-ink/40 line-through">${product.oldPrice}</span>
            )}
          </div>
          {lowStock && !outOfStock && (
            <span className="font-mono text-[11px] text-ember">{product.stock} left</span>
          )}
        </div>

        <button
          onClick={() => {
            addToCart(product);
            fireToast(product.name);
          }}
          disabled={outOfStock}
          className={clsx(
            'mt-3 w-full rounded-full border py-2 font-mono text-[12px] uppercase tracking-[0.12em] transition-all duration-300 ease-out',
            outOfStock
              ? 'cursor-not-allowed border-ink/10 bg-ink/10 text-ink/30'
              : 'border-forest bg-forest text-cream hover:-translate-y-0.5 hover:bg-forest-2 hover:shadow-[0_8px_20px_rgba(0,0,0,0.22)] active:translate-y-0 active:scale-[0.97]'
          )}
        >
          {outOfStock ? 'Sold out' : 'Add to cart'}
        </button>
      </div>
    </TiltCard>
  );
}
