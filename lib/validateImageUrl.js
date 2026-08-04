// lib/validateImageUrl.js
// Admin-supplied image URLs (hero background, collection banners, brand
// logos) get fetched server-side by Next.js's Image Optimization —
// combined with next.config.mjs allowing any https hostname (needed so
// admins can paste a URL from anywhere), that's a textbook SSRF shape if
// left unchecked: an admin account could be used to make the server
// fetch internal/private network addresses. This only allows public
// http(s) URLs and blocks obvious private/loopback/link-local targets.
const BLOCKED_HOSTNAME_PATTERNS = [
  /^localhost$/i,
  /^127\./,
  /^0\.0\.0\.0$/,
  /^10\./,
  /^172\.(1[6-9]|2\d|3[0-1])\./,
  /^192\.168\./,
  /^169\.254\./, // link-local / cloud metadata (e.g. 169.254.169.254)
  /^::1$/,
  /^\[::1\]$/,
];

export function isSafeImageUrl(url) {
  if (!url) return true; // empty/undefined is fine — it just means "no image set"
  let parsed;
  try {
    parsed = new URL(url);
  } catch {
    return false;
  }
  if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') return false;
  const hostname = parsed.hostname;
  if (BLOCKED_HOSTNAME_PATTERNS.some((pattern) => pattern.test(hostname))) return false;
  return true;
}
