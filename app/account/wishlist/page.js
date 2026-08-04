import WishlistContent from '@/components/WishlistContent';

export default function AccountWishlistPage() {
  return (
    <div>
      <span className="font-mono text-xs uppercase tracking-[0.2em] text-brass-light">My account</span>
      <h1 className="mt-2 font-display text-3xl italic text-cream">Your wishlist.</h1>
      <div className="mt-8">
        <WishlistContent compact />
      </div>
    </div>
  );
}
