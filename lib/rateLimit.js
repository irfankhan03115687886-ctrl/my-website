// lib/rateLimit.js
// A simple fixed-window rate limiter, in memory. This is intentionally
// dependency-free so it works with zero setup — but it only limits
// within a single server process. That's fine for `npm run dev`, a
// single traditional Node server, or a single long-running container.
// If you deploy to a multi-instance/serverless platform (Vercel, etc.)
// where each request can hit a different process, swap this for a
// shared store like Upstash Redis (`@upstash/ratelimit`) so the counts
// are consistent across instances — the call sites below don't need to
// change, just what `rateLimit()` does internally.

const buckets = new Map();

// Periodically forget old buckets so this Map doesn't grow forever.
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of buckets) {
    if (now - entry.start > 60 * 60 * 1000) buckets.delete(key);
  }
}, 10 * 60 * 1000).unref?.();

export function rateLimit({ key, limit, windowMs }) {
  const now = Date.now();
  const entry = buckets.get(key);

  if (!entry || now - entry.start > windowMs) {
    buckets.set(key, { start: now, count: 1 });
    return { allowed: true, remaining: limit - 1 };
  }

  entry.count += 1;
  if (entry.count > limit) {
    return { allowed: false, remaining: 0, retryAfterSeconds: Math.ceil((windowMs - (now - entry.start)) / 1000) };
  }
  return { allowed: true, remaining: limit - entry.count };
}

export function getClientIp(request) {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0].trim();
  return request.headers.get('x-real-ip') || '127.0.0.1';
}
