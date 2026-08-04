import WishlistContent from '@/components/WishlistContent';

export default function WishlistPage() {
  return (
    <section className="mx-auto max-w-7xl bg-ink px-5 py-16 sm:px-8">
      <span className="font-mono text-xs uppercase tracking-[0.2em] text-brass-light">Your wishlist</span>
      <h1 className="mt-3 font-display text-3xl italic text-cream">Saved for later.</h1>
      <div className="mt-8">
        <WishlistContent />
      </div>
    </section>
  );
}
