import { SkeletonBlock, SkeletonStatCards, SkeletonTableRows } from '@/components/Skeleton';

export default function LoadingDashboard() {
  return (
    <div>
      <SkeletonBlock className="h-3 w-24" />
      <SkeletonBlock className="mt-3 h-9 w-64" />
      <div className="mt-8">
        <SkeletonStatCards count={4} />
      </div>
      <div className="card-surface mt-6 p-7">
        <SkeletonBlock className="h-5 w-40" />
        <div className="mt-5">
          <SkeletonTableRows rows={5} cols={5} />
        </div>
      </div>
    </div>
  );
}
