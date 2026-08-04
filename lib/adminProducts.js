// lib/adminProducts.js
import { query, getClient } from '@/lib/db';
import { friendlyUniqueViolationMessage } from '@/lib/dbErrors';

function slugify(v) {
  return v.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

export async function createProduct({
  name,
  slug,
  description,
  shortDescription,
  price,
  compareAtPrice,
  sku,
  brand,
  category,
  subcategory,
  stock,
  lowStockThreshold,
  status,
  featured,
  bestSeller,
  newArrival,
}) {
  const finalSlug = slug ? slugify(slug) : slugify(name);
  const result = await query(
    `insert into products (
       slug, name, description, short_description, price, compare_at_price, sku, brand,
       category, subcategory, stock, low_stock_threshold, status, featured, best_seller, new_arrival
     ) values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16)
     returning *`,
    [
      finalSlug,
      name,
      description || null,
      shortDescription || null,
      price,
      compareAtPrice || null,
      sku || null,
      brand || null,
      category || null,
      subcategory || null,
      stock ?? 0,
      lowStockThreshold ?? 5,
      status || 'draft',
      Boolean(featured),
      Boolean(bestSeller),
      Boolean(newArrival),
    ]
  );
  return result.rows[0];
}

export async function updateProduct(id, fields) {
  const {
    name,
    slug,
    description,
    shortDescription,
    price,
    compareAtPrice,
    sku,
    brand,
    category,
    subcategory,
    stock,
    lowStockThreshold,
    status,
    featured,
    bestSeller,
    newArrival,
  } = fields;

  // Slug is a soft-reference key used by product_tags and
  // collection_products (both keyed on product_slug, not product_id —
  // see db/schema.sql), so renaming it has to happen in the same
  // transaction as the products row update, or those associations would
  // silently detach from the product.
  const client = await getClient();
  try {
    await client.query('begin');

    const current = await client.query('select slug from products where id = $1', [id]);
    const currentSlug = current.rows[0]?.slug;
    const finalSlug = slug ? slugify(slug) : currentSlug;

    const result = await client.query(
      `update products set
         name = $2, slug = $3, description = $4, short_description = $5, price = $6, compare_at_price = $7,
         sku = $8, brand = $9, category = $10, subcategory = $11, stock = $12, low_stock_threshold = $13,
         status = $14, featured = $15, best_seller = $16, new_arrival = $17, updated_at = now()
       where id = $1
       returning *`,
      [
        id,
        name,
        finalSlug,
        description || null,
        shortDescription || null,
        price,
        compareAtPrice || null,
        sku || null,
        brand || null,
        category || null,
        subcategory || null,
        stock ?? 0,
        lowStockThreshold ?? 5,
        status || 'draft',
        Boolean(featured),
        Boolean(bestSeller),
        Boolean(newArrival),
      ]
    );

    if (currentSlug && finalSlug !== currentSlug) {
      await client.query('update product_tags set product_slug = $2 where product_slug = $1', [currentSlug, finalSlug]);
      await client.query('update collection_products set product_slug = $2 where product_slug = $1', [currentSlug, finalSlug]);
    }

    await client.query('commit');
    return result.rows[0];
  } catch (err) {
    await client.query('rollback');
    throw err;
  } finally {
    client.release();
  }
}

export async function setProductStatus(id, status) {
  const result = await query(`update products set status = $2, updated_at = now() where id = $1 returning *`, [id, status]);
  return result.rows[0];
}

export async function deleteProduct(id) {
  await query(`delete from products where id = $1`, [id]);
}

export async function getProductIdBySlug(slug) {
  const result = await query(`select id from products where slug = $1`, [slug]);
  return result.rows[0]?.id || null;
}

export async function getProductByIdAdmin(id) {
  const result = await query(
    `select p.*,
            coalesce(json_agg(distinct jsonb_build_object('id', pi.id, 'url', pi.url, 'alt_text', pi.alt_text, 'is_primary', pi.is_primary, 'position', pi.position))
                     filter (where pi.id is not null), '[]') as images
     from products p
     left join product_images pi on pi.product_id = p.id
     where p.id = $1
     group by p.id`,
    [id]
  );
  const row = result.rows[0];
  if (!row) return null;
  row.images = (row.images || []).sort((a, b) => a.position - b.position);
  return row;
}

// ---------- Images ----------

export async function addProductImage(productId, { url, altText }) {
  const countResult = await query(`select count(*)::int as count from product_images where product_id = $1`, [productId]);
  const isFirst = countResult.rows[0].count === 0;
  const result = await query(
    `insert into product_images (product_id, url, alt_text, position, is_primary)
     values ($1, $2, $3, $4, $5) returning *`,
    [productId, url, altText || null, countResult.rows[0].count, isFirst]
  );
  return result.rows[0];
}

export async function deleteProductImage(imageId) {
  const existing = await query(`select * from product_images where id = $1`, [imageId]);
  const deleted = existing.rows[0];
  if (!deleted) return null;

  await query(`delete from product_images where id = $1`, [imageId]);

  // If the deleted image was the primary one, promote the next image
  // (lowest position) so the product never ends up with zero primary
  // images while it still has photos.
  if (deleted.is_primary) {
    const remaining = await query(
      `select id from product_images where product_id = $1 order by position asc limit 1`,
      [deleted.product_id]
    );
    if (remaining.rows[0]) {
      await query(`update product_images set is_primary = true where id = $1`, [remaining.rows[0].id]);
    }
  }

  return deleted;
}

export async function setPrimaryImage(productId, imageId) {
  await query(`update product_images set is_primary = false where product_id = $1`, [productId]);
  await query(`update product_images set is_primary = true where id = $1`, [imageId]);
}

export async function reorderProductImage(productId, imageId, direction) {
  const result = await query(`select id, position from product_images where product_id = $1 order by position asc`, [productId]);
  const images = result.rows;
  const idx = images.findIndex((i) => i.id === imageId);
  const swapIdx = direction === 'up' ? idx - 1 : idx + 1;
  if (idx === -1 || swapIdx < 0 || swapIdx >= images.length) return;

  await query(`update product_images set position = $2 where id = $1`, [images[idx].id, images[swapIdx].position]);
  await query(`update product_images set position = $2 where id = $1`, [images[swapIdx].id, images[idx].position]);
}

// ---------- Bulk operations ----------
// Every bulk function takes an array of product UUIDs (only real,
// DB-backed products can be bulk-edited — demo catalog rows aren't real
// database rows and are filtered out before these are ever called).

export async function bulkDelete(ids) {
  const result = await query(`delete from products where id = any($1) returning id`, [ids]);
  return result.rowCount;
}

export async function bulkSetStatus(ids, status) {
  const result = await query(`update products set status = $2, updated_at = now() where id = any($1) returning id`, [ids, status]);
  return result.rowCount;
}

export async function bulkSetCategory(ids, { category, subcategory }) {
  const result = await query(
    `update products set category = $2, subcategory = $3, updated_at = now() where id = any($1) returning id`,
    [ids, category || null, subcategory || null]
  );
  return result.rowCount;
}

export async function bulkSetBrand(ids, brand) {
  const result = await query(`update products set brand = $2, updated_at = now() where id = any($1) returning id`, [ids, brand || null]);
  return result.rowCount;
}

// mode: 'percent' or 'fixed'; direction: 'increase' or 'decrease'
export async function bulkAdjustPrice(ids, { mode, direction, value }) {
  const amount = Number(value);
  const sign = direction === 'decrease' ? -1 : 1;
  const expr =
    mode === 'percent'
      ? `greatest(price + price * (${sign} * $2 / 100.0), 0.01)`
      : `greatest(price + (${sign} * $2), 0.01)`;
  const result = await query(
    `update products set price = round((${expr})::numeric, 2), updated_at = now() where id = any($1) returning id`,
    [ids, amount]
  );
  return result.rowCount;
}

// mode: 'set', 'increase', or 'decrease'
export async function bulkAdjustStock(ids, { mode, value }) {
  const amount = Number(value);
  let expr;
  if (mode === 'set') expr = `$2`;
  else if (mode === 'increase') expr = `stock + $2`;
  else expr = `greatest(stock - $2, 0)`;
  const result = await query(
    `update products set stock = (${expr})::integer, updated_at = now() where id = any($1) returning id`,
    [ids, amount]
  );
  return result.rowCount;
}

// ---------- CSV export/import ----------

const CSV_COLUMNS = [
  'slug', 'name', 'description', 'short_description', 'price', 'compare_at_price', 'sku', 'brand',
  'category', 'subcategory', 'stock', 'low_stock_threshold', 'status', 'featured', 'best_seller', 'new_arrival',
];

function csvEscape(value) {
  const str = value === null || value === undefined ? '' : String(value);
  if (/[",\n]/.test(str)) return `"${str.replace(/"/g, '""')}"`;
  return str;
}

export async function exportProductsCSV() {
  const result = await query(`select ${CSV_COLUMNS.join(', ')} from products order by created_at asc`);
  const header = CSV_COLUMNS.join(',');
  const rows = result.rows.map((row) => CSV_COLUMNS.map((col) => csvEscape(row[col])).join(','));
  return [header, ...rows].join('\n');
}

// Validates and normalizes one CSV row without touching the database.
// Shared by both the dry-run preview and the real import, so the two
// can never disagree about what counts as valid.
function parseImportRow(row) {
  if (!row.name?.trim()) throw new Error('Missing name');
  if (!row.slug?.trim()) throw new Error('Missing slug');
  const price = Number(row.price);
  if (!row.price || Number.isNaN(price) || price <= 0) throw new Error('Missing or invalid price');

  const compareAtPrice = row.compare_at_price ? Number(row.compare_at_price) : null;
  if (row.compare_at_price && Number.isNaN(compareAtPrice)) throw new Error('Invalid compare-at price');

  const stock = row.stock ? Number(row.stock) : 0;
  if (row.stock && (Number.isNaN(stock) || stock < 0)) throw new Error('Invalid stock quantity');

  const lowStockThreshold = row.low_stock_threshold ? Number(row.low_stock_threshold) : 5;
  if (row.low_stock_threshold && Number.isNaN(lowStockThreshold)) throw new Error('Invalid low-stock threshold');

  const status = row.status?.trim();
  if (status && !['draft', 'published', 'archived'].includes(status)) {
    throw new Error(`Invalid status "${status}" (must be draft, published, or archived)`);
  }

  return {
    slug: row.slug.trim(),
    sku: row.sku?.trim() || null,
    fields: {
      name: row.name.trim(),
      description: row.description || null,
      shortDescription: row.short_description || null,
      price,
      compareAtPrice,
      sku: row.sku?.trim() || null,
      brand: row.brand || null,
      category: row.category || null,
      subcategory: row.subcategory || null,
      stock,
      lowStockThreshold,
      status: status || 'draft',
      featured: String(row.featured).toLowerCase() === 'true',
      bestSeller: String(row.best_seller).toLowerCase() === 'true',
      newArrival: String(row.new_arrival).toLowerCase() === 'true',
    },
  };
}

// Dry-run preview: validates every row, flags in-file duplicate
// slugs/SKUs (two rows in the same CSV colliding with each other, not
// just with the database), and reports which existing products would
// be updated vs. created — without writing anything.
export async function previewImportRows(rows) {
  const report = { toCreate: 0, toUpdate: 0, errors: [], rows: [] };
  const seenSlugs = new Map();
  const seenSkus = new Map();

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const rowNum = i + 2;
    try {
      const parsed = parseImportRow(row);

      if (seenSlugs.has(parsed.slug)) {
        throw new Error(`Duplicate slug "${parsed.slug}" also appears on row ${seenSlugs.get(parsed.slug)}`);
      }
      seenSlugs.set(parsed.slug, rowNum);

      if (parsed.sku) {
        if (seenSkus.has(parsed.sku)) {
          throw new Error(`Duplicate SKU "${parsed.sku}" also appears on row ${seenSkus.get(parsed.sku)}`);
        }
        seenSkus.set(parsed.sku, rowNum);
      }

      const existingBySlug = await query('select id from products where slug = $1', [parsed.slug]);
      let skuConflict = null;
      if (parsed.sku) {
        const existingBySku = await query('select id from products where sku = $1 and slug != $2', [parsed.sku, parsed.slug]);
        if (existingBySku.rows[0]) skuConflict = `SKU "${parsed.sku}" is already used by a different product`;
      }
      if (skuConflict) throw new Error(skuConflict);

      const action = existingBySlug.rows[0] ? 'update' : 'create';
      if (action === 'update') report.toUpdate += 1;
      else report.toCreate += 1;
      report.rows.push({ row: rowNum, slug: parsed.slug, name: parsed.fields.name, action });
    } catch (err) {
      report.errors.push({ row: rowNum, slug: row.slug || '(none)', message: err.message });
    }
  }

  return report;
}

// Upserts by slug: creates a new product if the slug doesn't exist yet,
// otherwise updates the existing one. Returns a per-row report so the
// admin can see exactly what happened without digging through logs.
export async function importProductsFromRows(rows) {
  const report = { created: 0, updated: 0, errors: [] };

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const rowNum = i + 2; // +1 for header, +1 for 1-indexing
    try {
      const parsed = parseImportRow(row);
      const existing = await query('select id from products where slug = $1', [parsed.slug]);

      if (existing.rows[0]) {
        await updateProduct(existing.rows[0].id, parsed.fields);
        report.updated += 1;
      } else {
        await createProduct({ ...parsed.fields, slug: parsed.slug });
        report.created += 1;
      }
    } catch (err) {
      const duplicateMessage = friendlyUniqueViolationMessage(err);
      report.errors.push({ row: rowNum, slug: row.slug || '(none)', message: duplicateMessage || err.message });
    }
  }

  return report;
}
