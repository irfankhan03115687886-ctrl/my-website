import { SkeletonBlock, SkeletonProductGrid } from '@/components/Skeleton';

export default function LoadingProducts() {
  return (
    <section className="mx-auto max-w-7xl bg-ink px-5 py-16 sm:px-8">
      <SkeletonBlock className="h-3 w-40" />
      <SkeletonBlock className="mt-4 h-9 w-72" />
      <SkeletonBlock className="mt-4 h-4 w-52" />
      <div className="mt-8 flex gap-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <SkeletonBlock key={i} className="h-8 w-24 rounded-full" />
        ))}
      </div>
      <div className="mt-10">
        <SkeletonProductGrid count={8} />
      </div>
    </section>
  );
}
