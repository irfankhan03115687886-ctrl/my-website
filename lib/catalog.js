// lib/catalog.js
// Categories/subcategories, tags, and merchandising collections, backed by
// Postgres (see db/schema.sql). Every read function falls back to sensible
// demo data if DATABASE_URL isn't configured yet, so the storefront and the
// admin dashboard both render before a database is connected.

import { query } from '@/lib/db';
import { CATEGORIES, SUBCATEGORIES, TAGS, DEMO_COLLECTIONS, getProductsBySlugs } from '@/lib/products';

// ---------- Categories & subcategories ----------

export async function getCategoryTree() {
  try {
    const result = await query(
      `select id, slug, label, parent_id, sort_order from categories order by sort_order asc, label asc`
    );
    if (result.rows.length === 0) throw new Error('empty');
    const rows = result.rows;
    const parents = rows.filter((r) => !r.parent_id);
    return parents.map((p) => ({
      ...p,
      children: rows.filter((r) => r.parent_id === p.id),
    }));
  } catch {
    // Demo fallback built from the static catalog in lib/products.js
    return CATEGORIES.map((c) => ({
      id: c.slug,
      slug: c.slug,
      label: c.label,
      parent_id: null,
      children: SUBCATEGORIES.filter((s) => s.category === c.slug).map((s) => ({
        id: s.slug,
        slug: s.slug,
        label: s.label,
        parent_id: c.slug,
      })),
    }));
  }
}

export async function createCategory({ slug, label, parentId, sortOrder = 0 }) {
  const result = await query(
    `insert into categories (slug, label, parent_id, sort_order) values ($1, $2, $3, $4) returning *`,
    [slug, label, parentId || null, sortOrder]
  );
  return result.rows[0];
}

export async function deleteCategory(id) {
  await query(`delete from categories where id = $1`, [id]);
}

// ---------- Tags ----------

export async function getAllTags() {
  try {
    const result = await query(`select id, slug, label from tags order by label asc`);
    if (result.rows.length === 0) throw new Error('empty');
    return result.rows;
  } catch {
    return TAGS.map((t) => ({ id: t.slug, slug: t.slug, label: t.label }));
  }
}

export async function createTag({ slug, label }) {
  const result = await query(`insert into tags (slug, label) values ($1, $2) returning *`, [slug, label]);
  return result.rows[0];
}

export async function deleteTag(id) {
  await query(`delete from tags where id = $1`, [id]);
}

export async function getTagsForProduct(slug) {
  try {
    const result = await query(
      `select t.id, t.slug, t.label from product_tags pt join tags t on t.id = pt.tag_id where pt.product_slug = $1`,
      [slug]
    );
    return result.rows;
  } catch {
    return [];
  }
}

export async function toggleProductTag(productSlug, tagId, attach) {
  if (attach) {
    await query(
      `insert into product_tags (product_slug, tag_id) values ($1, $2) on conflict do nothing`,
      [productSlug, tagId]
    );
  } else {
    await query(`delete from product_tags where product_slug = $1 and tag_id = $2`, [productSlug, tagId]);
  }
}

// ---------- Collections ----------

export async function getActiveCollections() {
  try {
    const result = await query(
      `select c.id, c.slug, c.title, c.subtitle, c.image_url,
              coalesce(json_agg(cp.product_slug) filter (where cp.product_slug is not null), '[]') as product_slugs
       from collections c
       left join collection_products cp on cp.collection_id = c.id
       where c.active = true
       group by c.id
       order by c.sort_order asc, c.title asc`
    );
    if (result.rows.length === 0) throw new Error('empty');
    return result.rows.map((r) => ({ ...r, products: r.product_slugs }));
  } catch {
    return DEMO_COLLECTIONS;
  }
}

export async function getAllCollectionsAdmin() {
  try {
    const result = await query(
      `select c.id, c.slug, c.title, c.subtitle, c.image_url, c.active, c.sort_order,
              coalesce(json_agg(cp.product_slug) filter (where cp.product_slug is not null), '[]') as product_slugs
       from collections c
       left join collection_products cp on cp.collection_id = c.id
       group by c.id
       order by c.sort_order asc, c.title asc`
    );
    return result.rows.map((r) => ({ ...r, products: r.product_slugs }));
  } catch {
    return [];
  }
}

export async function getCollectionBySlug(slug) {
  const active = await getActiveCollections();
  return active.find((c) => c.slug === slug) || null;
}

export async function getCollectionWithProducts(slug) {
  const collection = await getCollectionBySlug(slug);
  if (!collection) return null;
  const products = await getProductsBySlugs(collection.products || []);
  return { ...collection, resolvedProducts: products };
}

export async function createCollection({ slug, title, subtitle, imageUrl, sortOrder = 0 }) {
  const result = await query(
    `insert into collections (slug, title, subtitle, image_url, sort_order) values ($1, $2, $3, $4, $5) returning *`,
    [slug, title, subtitle || null, imageUrl || null, sortOrder]
  );
  return result.rows[0];
}

export async function updateCollection(id, { title, subtitle, imageUrl, active, sortOrder }) {
  const result = await query(
    `update collections set title = $2, subtitle = $3, image_url = $4, active = $5, sort_order = $6 where id = $1 returning *`,
    [id, title, subtitle || null, imageUrl || null, active, sortOrder ?? 0]
  );
  return result.rows[0];
}

export async function deleteCollection(id) {
  await query(`delete from collections where id = $1`, [id]);
}

export async function toggleCollectionProduct(collectionId, productSlug, attach) {
  if (attach) {
    await query(
      `insert into collection_products (collection_id, product_slug) values ($1, $2) on conflict do nothing`,
      [collectionId, productSlug]
    );
  } else {
    await query(`delete from collection_products where collection_id = $1 and product_slug = $2`, [
      collectionId,
      productSlug,
    ]);
  }
}
