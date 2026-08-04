import ReviewsManager from '@/components/admin/ReviewsManager';
import { getAllReviewsForAdmin } from '@/lib/reviews';

export default async function DashboardReviewsPage() {
  const reviews = await getAllReviewsForAdmin();

  return (
    <div>
      <span className="font-mono text-xs uppercase tracking-[0.2em] text-brass-light">Catalog</span>
      <h1 className="mt-2 font-display text-3xl italic text-cream">Reviews.</h1>
      <p className="mt-2 max-w-xl text-sm text-cream/60">
        New and edited reviews start pending — approve them to show on the product page, or reject/delete spam.
      </p>

      <div className="card-surface mt-7 p-7">
        <ReviewsManager initialReviews={reviews} />
      </div>
    </div>
  );
}
