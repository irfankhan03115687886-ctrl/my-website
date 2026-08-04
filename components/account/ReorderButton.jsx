'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { RotateCcw } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { fireToast } from '@/components/Toast';

export default function ReorderButton({ items }) {
  const router = useRouter();
  const { addToCart } = useCart();
  const [loading, setLoading] = useState(false);

  async function handleReorder() {
    setLoading(true);
    try {
      const slugs = items.map((i) => i.slug).filter(Boolean);
      const res = await fetch(`/api/products/by-slugs?slugs=${encodeURIComponent(slugs.join(','))}`);
      const data = await res.json();
      const bySlug = Object.fromEntries(data.products.map((p) => [p.slug, p]));

      let added = 0;
      let skipped = 0;
      for (const item of items) {
        const product = bySlug[item.slug];
        if (!product || product.stock === 0) {
          skipped += 1;
          continue;
        }
        addToCart(product, Math.min(item.qty, product.stock));
        added += 1;
      }

      if (added > 0) {
        fireToast(`${added} item${added === 1 ? '' : 's'} added to your cart${skipped > 0 ? ` (${skipped} no longer available)` : ''}`, 'Reorder');
        router.push('/cart');
      } else {
        fireToast('None of these items are available anymore.', 'Reorder');
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <button onClick={handleReorder} disabled={loading} className="btn-outline-ink">
      <RotateCcw size={14} className="mr-1.5" />
      {loading ? 'Adding…' : 'Reorder'}
    </button>
  );
}
