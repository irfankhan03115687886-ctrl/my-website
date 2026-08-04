// lib/dbErrors.js
// Postgres unique-violation errors (code 23505) carry a `.constraint`
// name we can match against to say exactly which field collided,
// instead of a generic "duplicate key" message that doesn't tell the
// admin whether it was the slug or the SKU.
const UNIQUE_VIOLATION = '23505';

const CONSTRAINT_MESSAGES = {
  products_slug_key: 'A product with that slug already exists. Try a different name or set a custom slug.',
  idx_products_sku_unique: 'That SKU is already used by another product.',
  brands_slug_key: 'A brand with that name already exists.',
  collections_slug_key: 'A collection with that slug already exists.',
  categories_slug_key: 'A category with that slug already exists.',
  custom_pages_slug_key: 'A page with that slug already exists.',
};

// Returns a user-facing message if `err` is a known unique-constraint
// violation, otherwise null (so the caller can fall back to a generic
// 500 for anything unexpected).
export function friendlyUniqueViolationMessage(err) {
  if (err?.code !== UNIQUE_VIOLATION) return null;
  if (err.constraint && CONSTRAINT_MESSAGES[err.constraint]) {
    return CONSTRAINT_MESSAGES[err.constraint];
  }
  // Fallback for a constraint name we haven't mapped explicitly, but
  // still recognizably a duplicate-key error.
  return 'That value is already in use — please choose a different one.';
}
