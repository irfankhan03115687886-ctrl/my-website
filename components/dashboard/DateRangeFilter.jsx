'use client';

import { useState } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import clsx from 'clsx';

const PRESETS = [
  { key: 'today', label: 'Today' },
  { key: 'yesterday', label: 'Yesterday' },
  { key: 'last7', label: 'Last 7 days' },
  { key: 'last30', label: 'Last 30 days' },
  { key: 'thisMonth', label: 'This month' },
  { key: 'lastMonth', label: 'Last month' },
  { key: 'thisYear', label: 'This year' },
];

export default function DateRangeFilter({ activePreset }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [customFrom, setCustomFrom] = useState(searchParams.get('from') || '');
  const [customTo, setCustomTo] = useState(searchParams.get('to') || '');
  const [showCustom, setShowCustom] = useState(activePreset === 'custom');

  function applyPreset(preset) {
    router.push(`${pathname}?preset=${preset}`);
    setShowCustom(false);
  }

  function applyCustom(e) {
    e.preventDefault();
    if (!customFrom || !customTo) return;
    router.push(`${pathname}?preset=custom&from=${customFrom}&to=${customTo}`);
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {PRESETS.map((p) => (
          <button
            key={p.key}
            onClick={() => applyPreset(p.key)}
            className={clsx(
              'rounded-full border px-4 py-1.5 font-mono text-xs uppercase tracking-[0.1em] transition-colors',
              activePreset === p.key
                ? 'border-brass bg-brass text-ink'
                : 'border-cream/20 text-cream/60 hover:border-brass/50 hover:text-cream'
            )}
          >
            {p.label}
          </button>
        ))}
        <button
          onClick={() => setShowCustom((v) => !v)}
          className={clsx(
            'rounded-full border px-4 py-1.5 font-mono text-xs uppercase tracking-[0.1em] transition-colors',
            activePreset === 'custom'
              ? 'border-brass bg-brass text-ink'
              : 'border-cream/20 text-cream/60 hover:border-brass/50 hover:text-cream'
          )}
        >
          Custom range
        </button>
      </div>

      {showCustom && (
        <form onSubmit={applyCustom} className="flex flex-wrap items-center gap-3">
          <input type="date" value={customFrom} onChange={(e) => setCustomFrom(e.target.value)} className="input" />
          <span className="text-cream/40">to</span>
          <input type="date" value={customTo} onChange={(e) => setCustomTo(e.target.value)} className="input" />
          <button type="submit" className="btn-outline">
            Apply
          </button>
        </form>
      )}
    </div>
  );
}
