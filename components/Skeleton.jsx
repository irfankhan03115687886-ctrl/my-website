// components/Skeleton.jsx
// Shimmering placeholder blocks for Next.js loading.js states — see
// the `.skeleton` class in app/globals.css for the shimmer animation
// (respects prefers-reduced-motion globally, same as every other
// animation in the site).

export function SkeletonBlock({ className = '' }) {
  return <div className={`skeleton rounded-lg ${className}`} />;
}

export function SkeletonProductCard() {
  return (
    <div className="space-y-3">
      <SkeletonBlock className="aspect-[4/5] w-full rounded-2xl" />
      <SkeletonBlock className="h-3 w-3/4" />
      <SkeletonBlock className="h-3 w-1/3" />
    </div>
  );
}

export function SkeletonProductGrid({ count = 8 }) {
  return (
    <div className="grid grid-cols-2 gap-5 lg:grid-cols-4">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonProductCard key={i} />
      ))}
    </div>
  );
}

export function SkeletonTableRows({ rows = 6, cols = 5 }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} className="flex gap-4">
          {Array.from({ length: cols }).map((_, c) => (
            <SkeletonBlock key={c} className={`h-4 ${c === 0 ? 'w-1/4' : 'flex-1'}`} />
          ))}
        </div>
      ))}
    </div>
  );
}

export function SkeletonStatCards({ count = 4 }) {
  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="admin-stat-card">
          <SkeletonBlock className="h-5 w-5" />
          <SkeletonBlock className="mt-4 h-7 w-16" />
          <SkeletonBlock className="mt-2 h-3 w-24" />
        </div>
      ))}
    </div>
  );
}
