'use client';

import { useEffect, useState } from 'react';
import { CheckCircle2 } from 'lucide-react';

export default function Toast() {
  const [toast, setToast] = useState(null);

  useEffect(() => {
    function handleToast(e) {
      setToast(e.detail);
      const timer = setTimeout(() => setToast(null), 2400);
      return () => clearTimeout(timer);
    }
    window.addEventListener('fieldco:toast', handleToast);
    return () => window.removeEventListener('fieldco:toast', handleToast);
  }, []);

  if (!toast) return null;

  return (
    <div
      key={toast.id}
      className="fixed bottom-6 right-6 z-[100] flex items-center gap-3 rounded-md border border-brass/40 bg-ink px-5 py-3.5 text-cream shadow-[0_8px_28px_rgba(0,0,0,0.35),0_0_24px_rgba(21,101,78,0.25)] animate-pop-in"
      role="status"
    >
      <CheckCircle2 size={18} className="shrink-0 text-brass-light" />
      <div className="font-mono text-[13px]">
        <span className="text-cream/60">{toast.label || 'Added'} — </span>
        {toast.message}
      </div>
    </div>
  );
}

export function fireToast(message, label = 'Added') {
  window.dispatchEvent(new CustomEvent('fieldco:toast', { detail: { id: Date.now(), message, label } }));
}
