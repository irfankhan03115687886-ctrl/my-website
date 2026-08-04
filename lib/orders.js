// lib/orders.js
// Order tracking + admin order-management helpers, built on top of the
// `orders` / `order_items` / `order_status_history` tables in db/schema.sql.

import { query } from '@/lib/db';
import { ORDER_STEPS, ALL_STATUSES, stepIndexForStatus } from '@/lib/orderStatuses';

export { ORDER_STEPS, ALL_STATUSES, stepIndexForStatus };

export async function getOrderForUser(orderId, userId) {
  const orderResult = await query(
    `select o.*, coalesce(json_agg(json_build_object('slug', oi.product_id, 'name', oi.name, 'qty', oi.qty, 'price', oi.price)) filter (where oi.id is not null), '[]') as items
     from orders o
     left join order_items oi on oi.order_id = o.id
     where o.id = $1 and o.user_id = $2
     group by o.id`,
    [orderId, userId]
  );
  const order = orderResult.rows[0];
  if (!order) return null;

  const history = await getOrderHistory(orderId);
  return { ...order, history };
}

export async function getOrderHistory(orderId) {
  try {
    const result = await query(
      `select status, note, created_at from order_status_history where order_id = $1 order by created_at asc`,
      [orderId]
    );
    if (result.rows.length > 0) return result.rows;
  } catch {
    // fall through to synthesized history below
  }
  return [];
}

export async function getAdminOrders({ status, limit = 50 } = {}) {
  const clauses = [];
  const params = [];
  if (status && status !== 'all') {
    params.push(status);
    clauses.push(`status = $${params.length}`);
  }
  const where = clauses.length ? `where ${clauses.join(' and ')}` : '';
  params.push(limit);
  const result = await query(
    `select id, email, shipping_name, total, status, created_at from orders ${where} order by created_at desc limit $${params.length}`,
    params
  );
  return result.rows;
}

export async function getAdminOrderById(orderId) {
  const orderResult = await query(
    `select o.*, coalesce(json_agg(json_build_object('slug', oi.product_id, 'name', oi.name, 'qty', oi.qty, 'price', oi.price)) filter (where oi.id is not null), '[]') as items
     from orders o
     left join order_items oi on oi.order_id = o.id
     where o.id = $1
     group by o.id`,
    [orderId]
  );
  const order = orderResult.rows[0];
  if (!order) return null;
  const history = await getOrderHistory(orderId);
  return { ...order, history };
}

export async function updateOrderStatus(orderId, status, note) {
  await query(`update orders set status = $2 where id = $1`, [orderId, status]);
  await query(`insert into order_status_history (order_id, status, note) values ($1, $2, $3)`, [
    orderId,
    status,
    note || null,
  ]);
}

export async function getAdminStats() {
  const [orderStats, statusCounts, customerCount] = await Promise.all([
    query(`select count(*)::int as count, coalesce(sum(total), 0)::float as revenue from orders where status in ('paid','processing','shipped','delivered')`),
    query(`select status, count(*)::int as count from orders group by status`),
    query(`select count(*)::int as count from users`),
  ]);

  return {
    totalOrders: orderStats.rows[0]?.count || 0,
    totalRevenue: orderStats.rows[0]?.revenue || 0,
    totalCustomers: customerCount.rows[0]?.count || 0,
    statusCounts: statusCounts.rows,
  };
}
