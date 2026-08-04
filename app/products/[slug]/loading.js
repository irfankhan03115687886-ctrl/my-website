import { SkeletonBlock } from '@/components/Skeleton';

export default function LoadingProduct() {
  return (
    <section className="mx-auto grid max-w-7xl gap-10 bg-ink px-5 py-16 sm:px-8 lg:grid-cols-2 lg:py-24">
      <SkeletonBlock className="aspect-[4/5] w-full rounded-2xl" />
      <div className="space-y-4">
        <SkeletonBlock className="h-3 w-32" />
        <SkeletonBlock className="h-9 w-3/4" />
        <SkeletonBlock className="h-5 w-24" />
        <SkeletonBlock className="h-20 w-full" />
        <SkeletonBlock className="h-12 w-40 rounded-full" />
      </div>
    </section>
  );
}
