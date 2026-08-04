'use client';

import { useEffect, useState } from 'react';

// Defaults match lib/settings.js's DEFAULT_SETTINGS, used only for the
// brief moment before the real values load (or if the request fails).
const FALLBACK = { shippingFee: 5, freeShippingThreshold: 50 };

export function useShippingSettings() {
  const [settings, setSettings] = useState(FALLBACK);

  useEffect(() => {
    let cancelled = false;
    fetch('/api/settings/shipping')
      .then((res) => res.json())
      .then((data) => {
        if (!cancelled) setSettings(data);
      })
      .catch(() => {
        // keep the fallback — better to show a reasonable estimate than crash
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return settings;
}
