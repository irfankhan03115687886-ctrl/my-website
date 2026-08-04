'use client';

import { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { fireToast } from '@/components/Toast';
import { useAuth } from '@/context/AuthContext';

const CartContext = createContext(null);
const CART_PREFIX = 'fieldco_cart_v1';
const WISHLIST_PREFIX = 'fieldco_wishlist_v1';

// Cart/wishlist are namespaced per account (or 'guest' when signed out) so
// that logging out of one customer's account and into another's on the
// same browser never leaks one person's cart/wishlist into the other's
// view — each key below is scoped to whoever is currently signed in.
function scopeKey(prefix, scopeId) {
  return `${prefix}:${scopeId}`;
}

function readStorage(key) {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function CartProvider({ children }) {
  const { user, loading: authLoading } = useAuth();
  const [cart, setCart] = useState([]);
  const [wishlist, setWishlist] = useState([]);
  const [hydrated, setHydrated] = useState(false);
  const scopeRef = useRef(null); // the scope id the in-memory state currently belongs to

  const scopeId = authLoading ? null : user?.id || 'guest';

  // Load (or switch) storage whenever the active scope changes — on
  // first mount once auth has resolved, and again any time the person
  // logs in or out.
  useEffect(() => {
    if (!scopeId || scopeId === scopeRef.current) return;
    scopeRef.current = scopeId;
    setCart(readStorage(scopeKey(CART_PREFIX, scopeId)));
    setWishlist(readStorage(scopeKey(WISHLIST_PREFIX, scopeId)));
    setHydrated(true);
  }, [scopeId]);

  useEffect(() => {
    if (hydrated && scopeRef.current) {
      window.localStorage.setItem(scopeKey(CART_PREFIX, scopeRef.current), JSON.stringify(cart));
    }
  }, [cart, hydrated]);

  useEffect(() => {
    if (hydrated && scopeRef.current) {
      window.localStorage.setItem(scopeKey(WISHLIST_PREFIX, scopeRef.current), JSON.stringify(wishlist));
    }
  }, [wishlist, hydrated]);

  const addToCart = (product, qty = 1) => {
    setCart((prev) => {
      const stock = typeof product.stock === 'number' ? product.stock : Infinity;
      const existing = prev.find((item) => item.id === product.id);
      const requested = (existing?.qty || 0) + qty;
      if (requested > stock) {
        fireToast(stock === 0 ? `${product.name} is out of stock.` : `Only ${stock} of ${product.name} in stock — cart adjusted.`, 'Note');
      }
      if (existing) {
        const nextQty = Math.min(requested, stock);
        return prev.map((item) => (item.id === product.id ? { ...item, qty: nextQty, stock } : item));
      }
      return [
        ...prev,
        { id: product.id, slug: product.slug, name: product.name, price: product.price, img: product.img, stock, qty: Math.min(qty, stock) },
      ];
    });
  };

  const updateQty = (id, qty) => {
    setCart((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item;
        const stock = typeof item.stock === 'number' ? item.stock : Infinity;
        if (qty > stock) fireToast(`Only ${stock} of ${item.name} in stock.`, 'Note');
        return { ...item, qty: Math.min(Math.max(1, qty), stock) };
      })
    );
  };

  const removeFromCart = (id) => setCart((prev) => prev.filter((item) => item.id !== id));
  const clearCart = () => setCart([]);

  const toggleWishlist = (product) => {
    setWishlist((prev) =>
      prev.some((item) => item.id === product.id)
        ? prev.filter((item) => item.id !== product.id)
        : [...prev, { id: product.id, slug: product.slug, name: product.name, price: product.price, img: product.img }]
    );
  };

  const cartCount = useMemo(() => cart.reduce((sum, item) => sum + item.qty, 0), [cart]);
  const cartTotal = useMemo(() => cart.reduce((sum, item) => sum + item.qty * item.price, 0), [cart]);

  const value = {
    cart,
    wishlist,
    cartCount,
    cartTotal,
    addToCart,
    updateQty,
    removeFromCart,
    clearCart,
    toggleWishlist,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
}
