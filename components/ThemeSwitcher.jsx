'use client';

import { useEffect, useState } from 'react';
import { Palette } from 'lucide-react';

const THEMES = [
  { id: 'dusk', label: 'Night Trail', swatch: '#15654E' },
  { id: 'neon', label: 'Neon Grid', swatch: '#06D6C2' },
  { id: 'recon', label: 'Blackout Recon', swatch: '#4A542A' },
];

const THEME_KEY = 'fieldco_theme';

export default function ThemeSwitcher() {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState('dusk');

  useEffect(() => {
    const saved = window.localStorage.getItem(THEME_KEY) || 'dusk';
    document.documentElement.setAttribute('data-theme', saved);
    setActive(saved);
  }, []);

  function applyTheme(id) {
    document.documentElement.setAttribute('data-theme', id);
    window.localStorage.setItem(THEME_KEY, id);
    setActive(id);
  }

  return (
    <div className="fixed bottom-6 right-6 z-[90] flex flex-col items-end gap-3">
      {open && (
        <div className="w-52 rounded-lg border border-brass/25 bg-ink/95 p-4 text-cream shadow-[0_20px_50px_rgba(0,0,0,0.45)] backdrop-blur animate-pop-in">
          <h5 className="font-mono text-[11px] uppercase tracking-[0.14em] text-brass-light">Trail Light</h5>
          <div className="mt-3 flex gap-3">
            {THEMES.map((t) => (
              <button
                key={t.id}
                onClick={() => applyTheme(t.id)}
                aria-label={t.label}
                title={t.label}
                className="h-8 w-8 rounded-full border-2 transition-transform hover:scale-110"
                style={{
                  background: t.swatch,
                  borderColor: active === t.id ? '#F6F6F4' : 'transparent',
                  boxShadow: active === t.id ? `0 0 0 2px rgb(17 24 28), 0 0 12px ${t.swatch}` : 'none',
                }}
              />
            ))}
          </div>
          <p className="mt-3 text-[11px] leading-relaxed text-cream/50">Pick your trail conditions — every accent updates live.</p>
        </div>
      )}
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label="Change color theme"
        className="flex h-13 w-13 items-center justify-center rounded-full border border-brass/30 bg-ink text-brass-light shadow-[0_10px_30px_rgba(0,0,0,0.4)] transition-transform hover:-translate-y-0.5 hover:scale-105"
        style={{ height: 52, width: 52 }}
      >
        <Palette size={20} strokeWidth={1.7} />
      </button>
    </div>
  );
}
