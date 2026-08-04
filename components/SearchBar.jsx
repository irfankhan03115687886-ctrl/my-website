'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { Search, X, Loader2 } from 'lucide-react';

export default function SearchBar({ mobile = false, onNavigate }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const containerRef = useRef(null);
  const debounceRef = useRef(null);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    clearTimeout(debounceRef.current);
    // 250ms debounce keeps this feeling instant while typing without
    // firing a request on every single keystroke.
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/products/search?q=${encodeURIComponent(query.trim())}`);
        const data = await res.json();
        setResults(data.products || []);
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 250);
    return () => clearTimeout(debounceRef.current);
  }, [query]);

  useEffect(() => {
    function handleClickOutside(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  function handleSubmit(e) {
    e.preventDefault();
    if (!query.trim()) return;
    setOpen(false);
    onNavigate?.();
    router.push(`/products?search=${encodeURIComponent(query.trim())}`);
  }

  function handleResultClick() {
    setOpen(false);
    onNavigate?.();
  }

  const showDropdown = open && query.trim().length > 0;

  return (
    <div ref={containerRef} className={mobile ? 'relative w-full' : 'relative w-full max-w-xs'}>
      <form onSubmit={handleSubmit} className="relative">
        <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-cream/40" />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setOpen(true)}
          placeholder="Search products…"
          aria-label="Search products"
          className="w-full rounded-full border border-cream/15 bg-ink-2 py-2 pl-9 pr-8 text-sm text-cream placeholder:text-cream/40 focus:border-brass/50 focus:outline-none"
        />
        {query && (
          <button
            type="button"
            aria-label="Clear search"
            onClick={() => {
              setQuery('');
              setResults([]);
            }}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-cream/40 hover:text-cream"
          >
            <X size={14} />
          </button>
        )}
      </form>

      {showDropdown && (
        <div className="absolute left-0 right-0 top-full z-50 mt-2 max-h-96 overflow-y-auto rounded-md border border-brass/20 bg-ink-2 shadow-[0_12px_32px_rgba(0,0,0,0.45)]">
          {loading ? (
            <div className="flex items-center justify-center gap-2 py-6 text-sm text-cream/50">
              <Loader2 size={15} className="animate-spin" /> Searching…
            </div>
          ) : results.length === 0 ? (
            <div className="py-6 text-center text-sm text-cream/50">No products found.</div>
          ) : (
            <>
              <ul className="divide-y divide-cream/10">
                {results.map((product) => (
                  <li key={product.id}>
                    <Link
                      href={`/products/${product.slug}`}
                      onClick={handleResultClick}
                      className="flex items-center gap-3 px-4 py-3 hover:bg-cream/5"
                    >
                      <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded bg-canvas-2">
                        <Image src={product.img} alt="" fill sizes="44px" className="object-cover" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm text-cream">{product.name}</p>
                        <p className="font-mono text-xs text-cream/40">${product.price}</p>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
              <button
                onClick={handleSubmit}
                className="w-full border-t border-brass/15 px-4 py-2.5 text-center font-mono text-xs uppercase tracking-[0.1em] text-brass-light hover:bg-cream/5"
              >
                See all results for "{query}"
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
