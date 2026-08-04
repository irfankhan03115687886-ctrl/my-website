import { NextResponse } from 'next/server';
import { getStripe } from '@/lib/stripe';
import { getSession } from '@/lib/auth';
import { getProductsBySlugs } from '@/lib/products';
import { getSiteSettings } from '@/lib/settings';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

// POST /api/checkout — creates a real Stripe Checkout Session and returns
// its URL. The browser redirects the customer there to enter card details
// on Stripe's own secure, PCI-compliant page — we never touch raw card
// numbers. Requires STRIPE_SECRET_KEY (see README.md).
//
// Security: prices and stock are never trusted from the client. Every
// line item is re-priced from the database here, and any item that's
// out of stock or unpublished is rejected before Stripe is ever called.
export async function POST(request) {
  try {
    const { items, email } = await request.json();

    if (!items?.length) {
      return NextResponse.json({ message: 'Your cart is empty' }, { status: 400 });
    }

    const slugs = items.map((i) => i.slug).filter(Boolean);
    if (slugs.length !== items.length) {
      return NextResponse.json({ message: 'Your cart has an item we no longer recognize — remove it and try again.' }, { status: 400 });
    }

    const realProducts = await getProductsBySlugs(slugs);
    const bySlug = Object.fromEntries(realProducts.map((p) => [p.slug, p]));

    for (const item of items) {
      const product = bySlug[item.slug];
      if (!product) {
        return NextResponse.json({ message: `"${item.name}" is no longer available.` }, { status: 409 });
      }
      if (product.status && product.status !== 'published') {
        return NextResponse.json({ message: `"${product.name}" is no longer available.` }, { status: 409 });
      }
      if (item.qty > product.stock) {
        return NextResponse.json(
          { message: product.stock === 0 ? `"${product.name}" is out of stock.` : `Only ${product.stock} of "${product.name}" left in stock.` },
          { status: 409 }
        );
      }
    }

    const settings = await getSiteSettings();
    const subtotal = items.reduce((sum, item) => sum + bySlug[item.slug].price * item.qty, 0);
    const shippingFee = subtotal >= Number(settings.free_shipping_threshold) ? 0 : Number(settings.shipping_fee);

    const session = await getSession().catch(() => null);
    const stripe = getStripe();

    const lineItems = items.map((item) => {
      const product = bySlug[item.slug];
      return {
        price_data: {
          currency: (settings.currency || 'usd').toLowerCase(),
          product_data: { name: product.name },
          unit_amount: Math.round(product.price * 100),
        },
        quantity: item.qty,
      };
    });

    if (shippingFee > 0) {
      lineItems.push({
        price_data: {
          currency: (settings.currency || 'usd').toLowerCase(),
          product_data: { name: 'Shipping' },
          unit_amount: Math.round(shippingFee * 100),
        },
        quantity: 1,
      });
    }

    const checkoutSession = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      line_items: lineItems,
      shipping_address_collection: { allowed_countries: [settings.delivery_country || 'GB'] },
      customer_email: session?.email || email || undefined,
      success_url: `${SITE_URL}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${SITE_URL}/cart`,
      metadata: {
        userId: session?.id || '',
        itemsJson: JSON.stringify(
          items.map((i) => ({ slug: i.slug, name: bySlug[i.slug].name, price: bySlug[i.slug].price, qty: i.qty }))
        ),
      },
    });

    return NextResponse.json({ url: checkoutSession.url });
  } catch (err) {
    console.error('[checkout]', err);
    const hint = err.message?.includes('STRIPE_SECRET_KEY')
      ? err.message
      : `Could not start checkout: ${err.message || 'unknown error'}. Check your Stripe keys in .env.local — see README.md.`;
    return NextResponse.json({ message: hint }, { status: 500 });
  }
}
