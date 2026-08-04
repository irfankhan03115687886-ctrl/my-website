// lib/brands.js
import { query } from '@/lib/db';

function slugify(v) {
  return v.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

export async function listBrands() {
  try {
    const result = await query('select * from brands order by name asc');
    return result.rows;
  } catch {
    return [];
  }
}

export async function createBrand({ name, logoUrl }) {
  const result = await query(
    `insert into brands (name, slug, logo_url) values ($1, $2, $3) returning *`,
    [name, slugify(name), logoUrl || null]
  );
  return result.rows[0];
}

export async function deleteBrand(id) {
  await query('delete from brands where id = $1', [id]);
}
