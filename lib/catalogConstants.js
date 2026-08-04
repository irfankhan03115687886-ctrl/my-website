// lib/catalogConstants.js
// Pure, dependency-free constants shared by both server code (lib/products.js)
// and client components (e.g. FilterBar.jsx, ProductForm.jsx). Kept in its
// own file so importing it from a 'use client' component never pulls in
// `pg` — lib/products.js itself imports lib/db.js for real DB queries,
// which breaks the client bundle if a client component imports *any*
// named export from it.

export const CATEGORIES = [
  { slug: 'packs', label: 'Packs & Bags' },
  { slug: 'outerwear', label: 'Outerwear' },
  { slug: 'footwear', label: 'Footwear' },
  { slug: 'accessories', label: 'Accessories' },
];

// Subcategories nest under a parent category slug. These pair with any
// DB-defined subcategories from the `categories` table (see lib/catalog.js)
// so the shop still has sensible defaults with no database configured.
export const SUBCATEGORIES = [
  { slug: 'daypacks', label: 'Daypacks', category: 'packs' },
  { slug: 'duffels', label: 'Duffels', category: 'packs' },
  { slug: 'shells', label: 'Shells & Rain', category: 'outerwear' },
  { slug: 'flannels', label: 'Flannels & Layers', category: 'outerwear' },
  { slug: 'boots', label: 'Boots', category: 'footwear' },
  { slug: 'trail-runners', label: 'Trail Runners', category: 'footwear' },
  { slug: 'headwear', label: 'Headwear', category: 'accessories' },
  { slug: 'carry', label: 'Everyday Carry', category: 'accessories' },
];

// Static tag catalog. Products carry a `tags` array of these slugs; the
// admin dashboard can additionally attach DB-managed tags per product.
export const TAGS = [
  { slug: 'best-seller', label: 'Best Seller' },
  { slug: 'new-arrival', label: 'New Arrival' },
  { slug: 'on-sale', label: 'On Sale' },
  { slug: 'waterproof', label: 'Waterproof' },
  { slug: 'limited-run', label: 'Limited Run' },
  { slug: 'staff-pick', label: 'Staff Pick' },
];

export function subcategoriesFor(categorySlug) {
  return SUBCATEGORIES.filter((s) => s.category === categorySlug);
}
