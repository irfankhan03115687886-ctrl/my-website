import Link from 'next/link';
import { getStripe } from '@/lib/stripe';
import ClearCartOnLoad from '@/components/ClearCartOnLoad';

export const metadata = {
  title: 'Order Confirmed',
  robots: { index: false, follow: true },
};

export default async function CheckoutSuccessPage({ searchParams }) {
  const sessionId = searchParams?.session_id;
  let session = null;

  if (sessionId) {
    try {
      const stripe = getStripe();
      session = await stripe.checkout.sessions.retrieve(sessionId, { expand: ['line_items'] });
    } catch {
      session = null;
    }
  }

  return (
    <section className="mx-auto max-w-lg bg-ink px-5 py-24 text-center sm:px-8">
      <ClearCartOnLoad />
      <span className="font-mono text-xs uppercase tracking-[0.2em] text-brass-light">Order confirmed</span>
      <h1 className="mt-3 font-display text-3xl italic text-cream">Packed and on its way.</h1>
      {session ? (
        <>
          <p className="mt-4 font-mono text-sm text-cream/60">
            Order total: ${(session.amount_total / 100).toFixed(2)}
          </p>
          <p className="mt-2 text-sm text-cream/60">
            A receipt was sent to {session.customer_details?.email}.
          </p>
        </>
      ) : (
        <p className="mt-4 text-sm text-cream/60">Your payment was received. A confirmation email is on its way.</p>
      )}
      <Link href="/products" className="btn-primary mt-8">
        Keep exploring
      </Link>
    </section>
  );
}
