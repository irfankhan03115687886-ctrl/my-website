// lib/settings.js
import { query } from '@/lib/db';

const DEFAULT_SETTINGS = {
  store_name: 'Field & Co',
  store_email: 'irfankhan03115687886@gmail.com',
  store_phone: '03348419628',
  store_address: 'H-9, Islamabad',
  currency: 'USD',
  timezone: 'UTC',
  shipping_fee: 5,
  free_shipping_threshold: 50,
  delivery_country: 'GB',
  bank_payment_instructions: '',
};

export async function getSiteSettings() {
  try {
    const result = await query(`select * from site_settings where id = 1`);
    if (result.rows[0]) return { ...DEFAULT_SETTINGS, ...result.rows[0] };
    return DEFAULT_SETTINGS;
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export async function updateSiteSettings({
  storeName,
  storeEmail,
  storePhone,
  storeAddress,
  currency,
  timezone,
  shippingFee,
  freeShippingThreshold,
  deliveryCountry,
  bankPaymentInstructions,
}) {
  const result = await query(
    `insert into site_settings (
       id, store_name, store_email, store_phone, store_address, currency, timezone,
       shipping_fee, free_shipping_threshold, delivery_country, bank_payment_instructions, updated_at
     )
     values (1, $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, now())
     on conflict (id) do update set
       store_name = $1, store_email = $2, store_phone = $3, store_address = $4,
       currency = $5, timezone = $6, shipping_fee = $7, free_shipping_threshold = $8,
       delivery_country = $9, bank_payment_instructions = $10, updated_at = now()
     returning *`,
    [
      storeName,
      storeEmail || null,
      storePhone || null,
      storeAddress || null,
      currency || 'USD',
      timezone || 'UTC',
      shippingFee ?? 5,
      freeShippingThreshold ?? 50,
      deliveryCountry || 'GB',
      bankPaymentInstructions || null,
    ]
  );
  return result.rows[0];
}
