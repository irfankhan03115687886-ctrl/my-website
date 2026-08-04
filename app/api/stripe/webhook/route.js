import { NextResponse } from 'next/server';
import { getStripe } from '@/lib/stripe';
import { query } from '@/lib/db';

// POST /api/stripe/webhook — Stripe calls this URL directly when a payment
// completes. It verifies the request really came from Stripe (using
// STRIPE_WEBHOOK_SECRET), then saves the order to the database.
//
// Local testing: run `stripe listen --forward-to localhost:3000/api/stripe/webhook`
// (see README.md for the full setup).
export async function POST(request) {
  const stripe = getStripe();
  const body = await request.text();
  const signature = request.headers.get('stripe-signature');

  let event;
  try {
    event = stripe.webhooks.constructEvent(body, signature, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error('[stripe webhook] signature verification failed', err.message);
    return NextResponse.json({ message: 'Invalid signature' }, { status: 400 });
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    const items = JSON.parse(session.metadata?.itemsJson || '[]');
    const userId = session.metadata?.userId || null;

    try {
      const orderResult = await query(
        `insert into orders (user_id, email, stripe_session_id, total, status, shipping_name, shipping_address)
         values ($1, $2, $3, $4, 'paid', $5, $6)
         on conflict (stripe_session_id) do nothing
         returning id`,
        [
          userId || null,
          session.customer_details?.email || session.customer_email || '',
          session.id,
          (session.amount_total || 0) / 100,
          session.customer_details?.name || null,
          JSON.stringify(session.customer_details?.address || {}),
        ]
      );

      const orderId = orderResult.rows[0]?.id;
      if (orderId && items.length) {
        for (const item of items) {
          await query(
            `insert into order_items (order_id, product_id, name, price, qty) values ($1, $2, $3, $4, $5)`,
            [orderId, item.slug, item.name, item.price, item.qty]
          );

          // Atomically decrement stock — the WHERE clause guarantees we
          // never go negative even if two customers check out the same
          // last unit at the same moment; whichever request's UPDATE
          // commits first wins, the second simply decrements 0 rows.
          await query(
            `update products set stock = stock - $2, updated_at = now() where slug = $1 and stock >= $2`,
            [item.slug, item.qty]
          );
        }
      }
      if (orderId) {
        // Seed the tracking timeline: the order existed as "pending" the
        // instant checkout started, then Stripe confirmed payment.
        await query(
          `insert into order_status_history (order_id, status, note) values ($1, 'pending', 'Order placed'), ($1, 'paid', 'Payment confirmed by Stripe')`,
          [orderId]
        );
      }
    } catch (err) {
      console.error('[stripe webhook] failed to save order', err);
      // Still return 200 — Stripe will retry on non-2xx, but a DB hiccup
      // shouldn't cause repeated retries forever. Check your logs/DB directly.
    }
  }

  return NextResponse.json({ received: true });
}
