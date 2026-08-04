import { NextResponse } from 'next/server';
import { getSiteSettings } from '@/lib/settings';

// Public (no auth) — only exposes the two numbers needed to show accurate
// shipping costs before checkout. Everything else in site_settings stays
// admin-only. Read by the cart and checkout pages so they never drift
// out of sync with what /dashboard/admin/settings actually charges.
export async function GET() {
  try {
    const settings = await getSiteSettings();
    return NextResponse.json({
      shippingFee: Number(settings.shipping_fee),
      freeShippingThreshold: Number(settings.free_shipping_threshold),
      currency: settings.currency,
      deliveryCountry: settings.delivery_country,
    });
  } catch (err) {
    console.error('[public shipping settings]', err);
    return NextResponse.json({ shippingFee: 5, freeShippingThreshold: 50, currency: 'USD', deliveryCountry: 'GB' });
  }
}
