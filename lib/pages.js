// lib/pages.js
import { query } from '@/lib/db';

function slugify(v) {
  return v.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

export async function listPages() {
  try {
    const result = await query('select * from custom_pages order by updated_at desc');
    return result.rows;
  } catch {
    return [];
  }
}

export async function getPageById(id) {
  const result = await query('select * from custom_pages where id = $1', [id]);
  return result.rows[0] || null;
}

export async function getPublishedPageBySlug(slug) {
  try {
    const result = await query(`select * from custom_pages where slug = $1 and status = 'published'`, [slug]);
    return result.rows[0] || null;
  } catch {
    return null;
  }
}

export async function createPage({ title, slug, content, status }) {
  const result = await query(
    `insert into custom_pages (slug, title, content, status) values ($1, $2, $3, $4) returning *`,
    [slug ? slugify(slug) : slugify(title), title, content || null, status || 'draft']
  );
  return result.rows[0];
}

export async function updatePage(id, { title, content, status }) {
  const result = await query(
    `update custom_pages set title = $2, content = $3, status = $4, updated_at = now() where id = $1 returning *`,
    [id, title, content || null, status || 'draft']
  );
  return result.rows[0];
}

export async function deletePage(id) {
  await query('delete from custom_pages where id = $1', [id]);
}
