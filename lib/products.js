// lib/products.js
// Product catalog, backed by Postgres (`products` + `product_images` —
// see db/schema.sql). All products in this store are real database rows;
// the old in-code demo catalog was migrated into Postgres via
// `npm run db:migrate-demo` (see scripts/migrate-demo-catalog.js) and has
// been removed from here. If the products table is genuinely empty (e.g.
// a brand-new database) or unreachable, these functions return an empty
// list rather than showing placeholder data — add real products through
// /admin/products.

import { query } from '@/lib/db';
import { CATEGORIES, SUBCATEGORIES, TAGS, subcategoriesFor } from '@/lib/catalogConstants';

export { CATEGORIES, SUBCATEGORIES, TAGS, subcategoriesFor };

// Fallback merchandising collections, used on the homepage/collections
// pages until real rows exist in the DB `collections` table (see
// lib/catalog.js — same shape, so pages don't need separate branches).
export const DEMO_COLLECTIONS = [
  {
    id: 'demo-night-trail',
    slug: 'night-trail',
    title: 'The Night Trail Edit',
    subtitle: 'Reflective trims and storm shells for gear that clocks out after dark.',
    image_url: 'https://images.unsplash.com/photo-1478131143081-80f7f84ca84d?q=80&w=1200&auto=format&fit=crop',
    products: ['storm-ridge-shell', 'waxed-trail-jacket', 'cascade-hiking-boots'],
  },
  {
    id: 'demo-basecamp',
    slug: 'basecamp-essentials',
    title: 'Basecamp Essentials',
    subtitle: 'The short list for the last mile between trailhead and camp.',
    image_url: 'https://images.unsplash.com/photo-1590874103328-eac38a683ce7?q=80&w=1200&auto=format&fit=crop',
    products: ['basecamp-duffel-60l', 'summit-ridge-pack', 'alpine-insulated-bottle'],
  },
  {
    id: 'demo-first-frost',
    slug: 'first-frost',
    title: 'First Frost',
    subtitle: "Wool layers and brass-buttoned flannels for the season's first cold snap.",
    image_url: 'https://images.unsplash.com/photo-1517438476312-10d79c077509?q=80&w=1200&auto=format&fit=crop',
    products: ['ridge-wool-flannel', 'timberline-beanie', 'trailhead-wool-socks'],
  },
];

// ---------- DB row -> storefront shape ----------
// Keeps every existing page/component working unchanged: they all expect
// `product.img`, `product.desc`, `product.oldPrice`, `product.tags`, etc.
function shapeRow(row) {
  const images = row.images || [];
  const primary = images.find((i) => i.is_primary) || images[0];
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    category: row.category,
    subcategory: row.subcategory,
    tags: row.tag_slugs || [],
    price: Number(row.price),
    oldPrice: row.compare_at_price ? Number(row.compare_at_price) : null,
    badge: row.best_seller ? 'Best Seller' : row.new_arrival ? 'New' : row.compare_at_price ? 'Sale' : null,
    stock: row.stock,
    lowStockThreshold: row.low_stock_threshold,
    rating: row.rating ? Number(row.rating) : 4.5,
    reviews: row.reviews_count || 0,
    desc: row.description || row.short_description || '',
    specs: [],
    img: primary?.url || '/uploads/products/placeholder.jpg',
    images: images.map((i) => ({ id: i.id, url: i.url, alt: i.alt_text, isPrimary: i.is_primary })),
    sku: row.sku,
    brand: row.brand,
    status: row.status,
    featured: row.featured,
    bestSeller: row.best_seller,
    newArrival: row.new_arrival,
  };
}

async function fetchDbProducts({ onlyPublished = true } = {}) {
  const where = onlyPublished ? `where p.status = 'published'` : '';
  const result = await query(
    `select p.*,
            coalesce(json_agg(distinct jsonb_build_object('id', pi.id, 'url', pi.url, 'alt_text', pi.alt_text, 'is_primary', pi.is_primary, 'position', pi.position))
                     filter (where pi.id is not null), '[]') as images,
            coalesce(array_agg(distinct t.slug) filter (where t.slug is not null), '{}') as tag_slugs
     from products p
     left join product_images pi on pi.product_id = p.id
     left join product_tags pt on pt.product_slug = p.slug
     left join tags t on t.id = pt.tag_id
     ${where}
     group by p.id
     order by p.created_at desc`
  );
  return result.rows.map((row) => ({
    ...shapeRow({ ...row, images: (row.images || []).sort((a, b) => a.position - b.position) }),
  }));
}

async function getCatalog({ onlyPublished = true } = {}) {
  try {
    return await fetchDbProducts({ onlyPublished });
  } catch (err) {
    console.error('[products] could not read from the database', err.message);
    return [];
  }
}

export async function getProducts({ category, subcategory, tag, search } = {}) {
  let list = await getCatalog();
  if (category && category !== 'all') {
    list = list.filter((p) => p.category === category);
  }
  if (subcategory) {
    list = list.filter((p) => p.subcategory === subcategory);
  }
  if (tag) {
    list = list.filter((p) => p.tags?.includes(tag));
  }
  if (search && search.trim()) {
    const q = search.trim().toLowerCase();
    list = list.filter((p) =>
      [p.name, p.sku, p.category, p.subcategory, p.brand, p.desc].some((field) => field && field.toLowerCase().includes(q))
    );
  }
  return list;
}

export async function getFeaturedProducts(limit = 4) {
  const list = await getCatalog();
  return [...list].sort((a, b) => b.rating * b.reviews - a.rating * a.reviews).slice(0, limit);
}

export async function getProductBySlug(slug) {
  const list = await getCatalog();
  return list.find((p) => p.slug === slug) || null;
}

export async function getProductsBySlugs(slugs = []) {
  const list = await getCatalog();
  return slugs.map((slug) => list.find((p) => p.slug === slug)).filter(Boolean);
}

export async function getAllSlugs() {
  const list = await getCatalog();
  return list.map((p) => p.slug);
}

// Used by the admin dashboard — includes drafts/archived, not just published.
export async function getAllProductsFlat() {
  return getCatalog({ onlyPublished: false });
}

export async function getRelatedProducts(product, limit = 4) {
  const list = await getCatalog();
  return list.filter((p) => p.category === product.category && p.id !== product.id).slice(0, limit);
}

// Live search — hits the database directly with an ILIKE match across
// name/SKU/category/subcategory/brand/description rather than filtering
// the full shaped catalog in JS, so it stays fast as the catalog grows
// and the header's live-search dropdown feels instant.
export async function searchProducts(searchTerm, { limit = 8 } = {}) {
  const term = (searchTerm || '').trim();
  if (!term) return [];

  const result = await query(
    `select p.*,
            coalesce(json_agg(distinct jsonb_build_object('id', pi.id, 'url', pi.url, 'alt_text', pi.alt_text, 'is_primary', pi.is_primary, 'position', pi.position))
                     filter (where pi.id is not null), '[]') as images,
            coalesce(array_agg(distinct t.slug) filter (where t.slug is not null), '{}') as tag_slugs
     from products p
     left join product_images pi on pi.product_id = p.id
     left join product_tags pt on pt.product_slug = p.slug
     left join tags t on t.id = pt.tag_id
     where p.status = 'published'
       and (
         p.name ilike $1 or
         p.sku ilike $1 or
         p.category ilike $1 or
         p.subcategory ilike $1 or
         p.brand ilike $1 or
         p.description ilike $1 or
         p.short_description ilike $1
       )
     group by p.id
     order by
       -- Exact/prefix name matches float to the top of the dropdown
       -- ahead of matches that only hit the description.
       (case when p.name ilike $2 then 0 when p.name ilike $1 then 1 else 2 end),
       p.created_at desc
     limit $3`,
    [`%${term}%`, `${term}%`, limit]
  ).catch((err) => {
    console.error('[products] search query failed', err.message);
    return { rows: [] };
  });

  return result.rows.map((row) => shapeRow({ ...row, images: (row.images || []).sort((a, b) => a.position - b.position) }));
}


