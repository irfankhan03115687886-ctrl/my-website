// lib/formatDate.js
// Centralizes every human-readable date string in the app.
//
// Why this exists: `new Date(x).toLocaleDateString()` with no locale
// argument uses the *runtime's* default locale. The Node server process
// and a customer's browser very often disagree on that default (e.g. the
// server resolves to en-US "8/2/2026" while a browser set to en-GB
// resolves to "02/08/2026"), which is exactly what shows up as a React
// hydration mismatch: "Text content does not match server-rendered HTML."
//
// The fix is to never rely on the ambient locale — every call site below
// pins an explicit locale and an explicit timeZone, so the string is
// byte-identical whether it's produced on the server or in the browser.
const LOCALE = 'en-US';
const TIME_ZONE = 'UTC';

export function formatDate(input) {
  if (!input) return '';
  const date = input instanceof Date ? input : new Date(input);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleDateString(LOCALE, { month: 'numeric', day: 'numeric', year: 'numeric', timeZone: TIME_ZONE });
}

export function formatDateTime(input) {
  if (!input) return '';
  const date = input instanceof Date ? input : new Date(input);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleString(LOCALE, {
    month: 'numeric',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    timeZone: TIME_ZONE,
  });
}

export function formatShortDate(input) {
  if (!input) return '';
  const date = input instanceof Date ? input : new Date(input);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleDateString(LOCALE, { month: 'short', day: 'numeric', timeZone: TIME_ZONE });
}
