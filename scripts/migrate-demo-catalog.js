#!/usr/bin/env node
// scripts/migrate-demo-catalog.js
//
// One-time migration: moves every product from the old in-code demo
// catalog into real rows in Postgres (`products`, `product_images`,
// `tags`, `product_tags`) so the admin dashboard and storefront run
// entirely on the database — no fallback catalog involved.
//
// Usage:
//   node scripts/migrate-demo-catalog.js
//
// Requires DATABASE_URL — either already exported in your shell, or set
// in .env.local (this script reads .env.local itself, no extra
// dependency needed).
//
// Safe to re-run: every insert is an upsert keyed on slug (products,
// tags) or on the natural key of the join table (product_tags), so
// running this twice does not create duplicates or duplicate photos.

const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

// ---------- tiny .env.local loader (no dotenv dependency) ----------
function loadEnvLocal() {
  const envPath = path.join(__dirname, '..', '.env.local');
  if (!fs.existsSync(envPath)) return;
  const contents = fs.readFileSync(envPath, 'utf8');
  for (const line of contents.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    if (!(key in process.env)) process.env[key] = value;
  }
}
loadEnvLocal();

if (!process.env.DATABASE_URL) {
  console.error('DATABASE_URL is not set (checked the environment and .env.local). Aborting.');
  process.exit(1);
}

// ---------- the old demo catalog (previously lib/products.js DEMO_PRODUCTS) ----------
const DEMO_PRODUCTS = [
  { id: 'p01', slug: 'summit-ridge-pack', name: 'Summit Ridge Pack', category: 'packs', subcategory: 'daypacks', tags: ['best-seller', 'staff-pick'], price: 189, oldPrice: null, badge: 'Best Seller', stock: 50, rating: 4.8, reviews: 214, desc: 'A 38L waxed-canvas pack built around a hidden aluminum frame, made to carry real weight without complaint.', img: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?q=80&w=900&auto=format&fit=crop' },
  { id: 'p02', slug: 'waxed-trail-jacket', name: 'Waxed Trail Jacket', category: 'outerwear', subcategory: 'shells', tags: ['on-sale', 'waterproof'], price: 210, oldPrice: 245, badge: 'Sale', stock: 32, rating: 4.6, reviews: 138, desc: 'Storm-ready waxed cotton shell with a corduroy collar. Re-wax it once a year and it will outlast the trail.', img: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?q=80&w=900&auto=format&fit=crop' },
  { id: 'p03', slug: 'cascade-hiking-boots', name: 'Cascade Hiking Boots', category: 'footwear', subcategory: 'boots', tags: ['waterproof', 'staff-pick'], price: 165, oldPrice: null, badge: null, stock: 27, rating: 4.7, reviews: 302, desc: 'Full-grain leather boots with a Vibram outsole, built for wet rock and long descents.', img: 'https://images.unsplash.com/photo-1520639888713-7851133b1ed0?q=80&w=900&auto=format&fit=crop' },
  { id: 'p04', slug: 'brass-buckle-belt', name: 'Brass Buckle Belt', category: 'accessories', subcategory: 'carry', tags: [], price: 42, oldPrice: null, badge: null, stock: 60, rating: 4.5, reviews: 87, desc: 'Full-grain leather belt with a solid brass buckle that only looks better with age.', img: 'https://images.unsplash.com/photo-1624222247344-550fb60583dc?q=80&w=900&auto=format&fit=crop' },
  { id: 'p05', slug: 'canvas-rolltop-daypack', name: 'Canvas Rolltop Daypack', category: 'packs', subcategory: 'daypacks', tags: ['new-arrival', 'limited-run'], price: 129, oldPrice: null, badge: 'New', stock: 3, rating: 4.9, reviews: 41, desc: 'A 22L rolltop daypack that shrinks and grows with your load — perfect for city or singletrack.', img: 'https://images.unsplash.com/photo-1622560480605-d83c853bc5c3?q=80&w=900&auto=format&fit=crop' },
  { id: 'p06', slug: 'ridge-wool-flannel', name: 'Ridge Wool Flannel', category: 'outerwear', subcategory: 'flannels', tags: [], price: 98, oldPrice: null, badge: null, stock: 45, rating: 4.4, reviews: 96, desc: 'Heavyweight brushed wool flannel, cut roomy enough to layer over a base layer at camp.', img: 'https://images.unsplash.com/photo-1517438476312-10d79c077509?q=80&w=900&auto=format&fit=crop' },
  { id: 'p07', slug: 'trailhead-wool-socks', name: 'Trailhead Wool Socks', category: 'accessories', subcategory: 'carry', tags: ['best-seller'], price: 18, oldPrice: null, badge: null, stock: 120, rating: 4.6, reviews: 410, desc: 'Merino wool blend socks with reinforced heel and toe. Sold in pairs.', img: 'https://images.unsplash.com/photo-1586350977771-b3b0abd50c82?q=80&w=900&auto=format&fit=crop' },
  { id: 'p08', slug: 'alpine-insulated-bottle', name: 'Alpine Insulated Bottle', category: 'accessories', subcategory: 'carry', tags: ['on-sale'], price: 36, oldPrice: 44, badge: 'Sale', stock: 0, rating: 4.7, reviews: 158, desc: 'Double-wall stainless bottle that keeps water cold for 24 hours, coffee hot for 12.', img: 'https://images.unsplash.com/photo-1602143407151-7111542de6e8?q=80&w=900&auto=format&fit=crop' },
  { id: 'p09', slug: 'basecamp-duffel-60l', name: 'Basecamp Duffel 60L', category: 'packs', subcategory: 'duffels', tags: [], price: 159, oldPrice: null, badge: null, stock: 18, rating: 4.5, reviews: 73, desc: 'A rugged 60L duffel with backpack straps for the last mile between trailhead and camp.', img: 'https://images.unsplash.com/photo-1590874103328-eac38a683ce7?q=80&w=900&auto=format&fit=crop' },
  { id: 'p10', slug: 'storm-ridge-shell', name: 'Storm Ridge Shell', category: 'outerwear', subcategory: 'shells', tags: ['new-arrival', 'waterproof'], price: 230, oldPrice: null, badge: 'New', stock: 14, rating: 4.8, reviews: 52, desc: 'A 3-layer waterproof shell with pit zips and a helmet-compatible hood for alpine weather.', img: 'https://images.unsplash.com/photo-1544966503-7cc531cd8213?q=80&w=900&auto=format&fit=crop' },
  { id: 'p11', slug: 'low-trail-runners', name: 'Low Trail Runners', category: 'footwear', subcategory: 'trail-runners', tags: [], price: 138, oldPrice: null, badge: null, stock: 39, rating: 4.3, reviews: 121, desc: 'Lightweight trail runners with a sticky rubber outsole built for fast, technical terrain.', img: 'https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?q=80&w=900&auto=format&fit=crop' },
  { id: 'p12', slug: 'field-notes-sling-bag', name: 'Field Notes Sling Bag', category: 'accessories', subcategory: 'carry', tags: ['staff-pick'], price: 58, oldPrice: null, badge: null, stock: 24, rating: 4.6, reviews: 64, desc: 'A compact sling built for a notebook, a lens, and whatever you find along the way.', img: 'https://images.unsplash.com/photo-1622560480605-d83c853bc5c3?q=80&w=900&auto=format&fit=crop' },
  { id: 'p13', slug: 'timberline-beanie', name: 'Timberline Beanie', category: 'accessories', subcategory: 'headwear', tags: [], price: 24, oldPrice: null, badge: null, stock: 75, rating: 4.7, reviews: 189, desc: 'Ribbed wool beanie, roomy enough for a top-knot, warm enough for a whiteout.', img: 'https://images.unsplash.com/photo-1576871337622-98d48d1cf531?q=80&w=900&auto=format&fit=crop' },
  { id: 'p14', slug: 'granite-softshell-vest', name: 'Granite Softshell Vest', category: 'outerwear', subcategory: 'flannels', tags: ['on-sale'], price: 112, oldPrice: 132, badge: 'Sale', stock: 21, rating: 4.5, reviews: 58, desc: 'A windproof softshell vest that layers clean under a shell or alone at basecamp.', img: 'https://images.unsplash.com/photo-1551232864-3f0890e580d9?q=80&w=900&auto=format&fit=crop' },
];

// Same TAGS list as lib/catalogConstants.js, duplicated here so this
// script has zero dependency on Next.js module resolution and can be
// run with plain `node`.
const TAGS = [
  { slug: 'best-seller', label: 'Best Seller' },
  { slug: 'new-arrival', label: 'New Arrival' },
  { slug: 'on-sale', label: 'On Sale' },
  { slug: 'waterproof', label: 'Waterproof' },
  { slug: 'limited-run', label: 'Limited Run' },
  { slug: 'staff-pick', label: 'Staff Pick' },
];

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL.includes('localhost') ? false : { rejectUnauthorized: false },
});

async function ensureTags(client) {
  const idBySlug = {};
  for (const tag of TAGS) {
    const result = await client.query(
      `insert into tags (slug, label) values ($1, $2)
       on conflict (slug) do update set label = excluded.label
       returning id`,
      [tag.slug, tag.label]
    );
    idBySlug[tag.slug] = result.rows[0].id;
  }
  return idBySlug;
}

async function migrateProduct(client, demo, tagIdBySlug) {
  const sku = `FCO-${demo.id.toUpperCase()}`;
  const status = 'published';
  const bestSeller = demo.tags.includes('best-seller') || demo.badge === 'Best Seller';
  const newArrival = demo.tags.includes('new-arrival') || demo.badge === 'New';
  const featured = demo.tags.includes('staff-pick');

  const result = await client.query(
    `insert into products (
       slug, name, description, price, compare_at_price, sku, brand,
       category, subcategory, stock, low_stock_threshold, status,
       featured, best_seller, new_arrival, rating, reviews_count
     ) values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17)
     on conflict (slug) do update set
       name = excluded.name,
       description = excluded.description,
       price = excluded.price,
       compare_at_price = excluded.compare_at_price,
       category = excluded.category,
       subcategory = excluded.subcategory,
       stock = excluded.stock,
       status = excluded.status,
       featured = excluded.featured,
       best_seller = excluded.best_seller,
       new_arrival = excluded.new_arrival,
       rating = excluded.rating,
       reviews_count = excluded.reviews_count,
       updated_at = now()
     returning id, slug, (xmax = 0) as inserted`,
    [
      demo.slug,
      demo.name,
      demo.desc,
      demo.price,
      demo.oldPrice || null,
      sku,
      'Field & Co',
      demo.category,
      demo.subcategory,
      demo.stock,
      5,
      status,
      featured,
      bestSeller,
      newArrival,
      demo.rating,
      demo.reviews,
    ]
  );
  const row = result.rows[0];

  // Image — only add if this product doesn't already have one (avoids
  // piling up duplicate photos if this script is re-run).
  const existingImages = await client.query('select count(*)::int as count from product_images where product_id = $1', [row.id]);
  if (existingImages.rows[0].count === 0 && demo.img) {
    await client.query(
      `insert into product_images (product_id, url, alt_text, position, is_primary) values ($1, $2, $3, 0, true)`,
      [row.id, demo.img, demo.name]
    );
  }

  // Tags
  for (const tagSlug of demo.tags) {
    const tagId = tagIdBySlug[tagSlug];
    if (!tagId) continue;
    await client.query(
      `insert into product_tags (product_slug, tag_id) values ($1, $2) on conflict do nothing`,
      [demo.slug, tagId]
    );
  }

  return row;
}

async function main() {
  const client = await pool.connect();
  try {
    console.log(`Migrating ${DEMO_PRODUCTS.length} demo products into Postgres…`);
    await client.query('begin');

    const tagIdBySlug = await ensureTags(client);

    let created = 0;
    let updated = 0;
    for (const demo of DEMO_PRODUCTS) {
      const row = await migrateProduct(client, demo, tagIdBySlug);
      if (row.inserted) created += 1;
      else updated += 1;
      console.log(`  ✓ ${row.slug}`);
    }

    await client.query('commit');
    console.log(`\nDone. ${created} product(s) created, ${updated} already existed and were refreshed.`);
    console.log('The storefront and admin dashboard now read these as real database rows.');
  } catch (err) {
    await client.query('rollback');
    console.error('\nMigration failed, nothing was written:', err.message);
    process.exitCode = 1;
  } finally {
    client.release();
    await pool.end();
  }
}

main();
