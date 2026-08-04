// lib/analytics.js
import { query } from '@/lib/db';

const PAID_STATUSES = ['paid', 'processing', 'shipped', 'delivered'];

// Resolves a preset (or explicit from/to) into a concrete UTC date range.
// Both bounds are inclusive of the whole day.
export function resolveDateRange({ preset, from, to } = {}) {
  const now = new Date();
  const startOfDay = (d) => new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  const endOfDay = (d) => new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 23, 59, 59, 999));
  const addDays = (d, n) => new Date(d.getTime() + n * 86400000);

  if (preset === 'custom' && from && to) {
    return { from: startOfDay(new Date(from)), to: endOfDay(new Date(to)), label: 'Custom range' };
  }

  switch (preset) {
    case 'today':
      return { from: startOfDay(now), to: endOfDay(now), label: 'Today' };
    case 'yesterday': {
      const y = addDays(now, -1);
      return { from: startOfDay(y), to: endOfDay(y), label: 'Yesterday' };
    }
    case 'last7':
      return { from: startOfDay(addDays(now, -6)), to: endOfDay(now), label: 'Last 7 days' };
    case 'last30':
      return { from: startOfDay(addDays(now, -29)), to: endOfDay(now), label: 'Last 30 days' };
    case 'thisMonth':
      return { from: new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)), to: endOfDay(now), label: 'This month' };
    case 'lastMonth': {
      const firstOfThisMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
      const lastMonthEnd = new Date(firstOfThisMonth.getTime() - 1);
      const lastMonthStart = new Date(Date.UTC(lastMonthEnd.getUTCFullYear(), lastMonthEnd.getUTCMonth(), 1));
      return { from: lastMonthStart, to: endOfDay(lastMonthEnd), label: 'Last month' };
    }
    case 'thisYear':
      return { from: new Date(Date.UTC(now.getUTCFullYear(), 0, 1)), to: endOfDay(now), label: 'This year' };
    case 'last30':
    default:
      return { from: startOfDay(addDays(now, -29)), to: endOfDay(now), label: 'Last 30 days' };
  }
}

export async function getRevenueOverTime({ from, to }) {
  const result = await query(
    `select date_trunc('day', created_at)::date as day,
            coalesce(sum(total), 0)::float as revenue,
            count(*)::int as orders
     from orders
     where created_at between $1 and $2 and status = any($3)
     group by 1
     order by 1 asc`,
    [from, to, PAID_STATUSES]
  );
  return result.rows.map((r) => ({ date: r.day, revenue: r.revenue, orders: r.orders }));
}

export async function getBestSellingProducts({ from, to, limit = 8 }) {
  const result = await query(
    `select oi.product_id as slug, oi.name,
            sum(oi.qty)::int as units_sold,
            sum(oi.qty * oi.price)::float as revenue
     from order_items oi
     join orders o on o.id = oi.order_id
     where o.created_at between $1 and $2 and o.status = any($3)
     group by oi.product_id, oi.name
     order by units_sold desc
     limit $4`,
    [from, to, PAID_STATUSES, limit]
  );
  return result.rows;
}

export async function getSalesByCategory({ from, to }) {
  const result = await query(
    `select coalesce(p.category, 'Uncategorized') as category,
            sum(oi.qty * oi.price)::float as revenue,
            sum(oi.qty)::int as units_sold
     from order_items oi
     join orders o on o.id = oi.order_id
     left join products p on p.slug = oi.product_id
     where o.created_at between $1 and $2 and o.status = any($3)
     group by 1
     order by revenue desc`,
    [from, to, PAID_STATUSES]
  );
  return result.rows;
}

export async function getOrderStatusDistribution({ from, to }) {
  const result = await query(
    `select status, count(*)::int as count
     from orders
     where created_at between $1 and $2
     group by status
     order by count desc`,
    [from, to]
  );
  return result.rows;
}

export async function getNewCustomersOverTime({ from, to }) {
  const result = await query(
    `select date_trunc('day', created_at)::date as day, count(*)::int as customers
     from users
     where created_at between $1 and $2 and role is null and is_admin = false
     group by 1
     order by 1 asc`,
    [from, to]
  );
  return result.rows.map((r) => ({ date: r.day, customers: r.customers }));
}

export async function getAnalyticsSummary(range) {
  try {
    const [revenueOverTime, bestSellers, salesByCategory, statusDistribution, newCustomers] = await Promise.all([
      getRevenueOverTime(range),
      getBestSellingProducts({ ...range, limit: 8 }),
      getSalesByCategory(range),
      getOrderStatusDistribution(range),
      getNewCustomersOverTime(range),
    ]);

    const totalRevenue = revenueOverTime.reduce((sum, d) => sum + d.revenue, 0);
    const totalOrders = revenueOverTime.reduce((sum, d) => sum + d.orders, 0);
    const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
    const totalNewCustomers = newCustomers.reduce((sum, d) => sum + d.customers, 0);

    return {
      revenueOverTime,
      bestSellers,
      salesByCategory,
      statusDistribution,
      newCustomers,
      totals: { totalRevenue, totalOrders, avgOrderValue, totalNewCustomers },
    };
  } catch (err) {
    console.error('[analytics]', err);
    return {
      revenueOverTime: [],
      bestSellers: [],
      salesByCategory: [],
      statusDistribution: [],
      newCustomers: [],
      totals: { totalRevenue: 0, totalOrders: 0, avgOrderValue: 0, totalNewCustomers: 0 },
    };
  }
}
