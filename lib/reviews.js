// lib/reviews.js
// Reviews are moderated: a new/edited review starts 'pending' and only
// counts toward a product's public rating/count once an admin approves
// it (see db/schema.sql). This keeps the storefront's aggregate rating
// trustworthy without needing to review every submission before it's
// even saved.
import { query } from '@/lib/db';
import { ensureAppSchema } from '@/lib/ensureSchema';

// Public summary for a product page: average rating, total count, and a
// 1–5 star distribution — computed live from approved reviews so it's
// always accurate, rather than trusting a cached column that could
// drift out of sync.
export async function getReviewSummary(productSlug) {
  const empty = { average: 0, count: 0, distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 } };
  try {
    await ensureAppSchema();
    const result = await query(
      `select rating, count(*) as count from reviews
       where product_slug = $1 and status = 'approved'
       group by rating`,
      [productSlug]
    );

    const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    let total = 0;
    let sum = 0;
    for (const row of result.rows) {
      const rating = Number(row.rating);
      const count = Number(row.count);
      distribution[rating] = count;
      total += count;
      sum += rating * count;
    }
    return {
      average: total > 0 ? Math.round((sum / total) * 10) / 10 : 0,
      count: total,
      distribution,
    };
  } catch (err) {
    // The product page must render even if reviews can't load — a
    // pending migration or a hiccuped connection shouldn't 500 the
    // whole page. Log it clearly so it's obvious in server logs.
    console.error('[reviews] getReviewSummary failed', err.message);
    return empty;
  }
}

// Approved reviews for the public product page, newest first.
export async function getApprovedReviews(productSlug) {
  try {
    await ensureAppSchema();
    const result = await query(
      `select r.id, r.rating, r.title, r.body, r.created_at, r.updated_at, u.first_name, u.last_name
       from reviews r
       join users u on u.id = r.user_id
       where r.product_slug = $1 and r.status = 'approved'
       order by r.created_at desc`,
      [productSlug]
    );
    return result.rows;
  } catch (err) {
    console.error('[reviews] getApprovedReviews failed', err.message);
    return [];
  }
}

// The signed-in customer's own review for this product (any status) —
// used to show "edit your review" instead of the write form again.
export async function getOwnReview(productSlug, userId) {
  if (!userId) return null;
  try {
    await ensureAppSchema();
    const result = await query(`select * from reviews where product_slug = $1 and user_id = $2`, [productSlug, userId]);
    return result.rows[0] || null;
  } catch (err) {
    console.error('[reviews] getOwnReview failed', err.message);
    return null;
  }
}

// Upsert: one review per customer per product (enforced by the unique
// index on (product_slug, user_id)) — writing again edits the existing
// row and resets it to 'pending' so the edited content gets re-moderated.
export async function upsertReview({ productSlug, userId, rating, title, body }) {
  await ensureAppSchema();
  const result = await query(
    `insert into reviews (product_slug, user_id, rating, title, body, status)
     values ($1, $2, $3, $4, $5, 'pending')
     on conflict (product_slug, user_id)
     do update set rating = excluded.rating, title = excluded.title, body = excluded.body,
                   status = 'pending', updated_at = now()
     returning *`,
    [productSlug, userId, rating, title || null, body || null]
  );
  return result.rows[0];
}

export async function deleteOwnReview(reviewId, userId) {
  await ensureAppSchema();
  const result = await query(`delete from reviews where id = $1 and user_id = $2 returning id`, [reviewId, userId]);
  return result.rows.length > 0;
}

// ---------- Admin ----------

export async function getAllReviewsForAdmin() {
  try {
    await ensureAppSchema();
    const result = await query(
      `select r.*, u.first_name, u.last_name, u.email, p.name as product_name
       from reviews r
       join users u on u.id = r.user_id
       left join products p on p.slug = r.product_slug
       order by r.created_at desc`
    );
    return result.rows;
  } catch (err) {
    console.error('[reviews] getAllReviewsForAdmin failed', err.message);
    return [];
  }
}

export async function setReviewStatus(id, status) {
  await ensureAppSchema();
  const result = await query(`update reviews set status = $2, updated_at = now() where id = $1 returning *`, [id, status]);
  return result.rows[0] || null;
}

export async function deleteReviewAsAdmin(id) {
  await ensureAppSchema();
  await query(`delete from reviews where id = $1`, [id]);
}
