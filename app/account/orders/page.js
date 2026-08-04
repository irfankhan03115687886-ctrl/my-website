import Link from 'next/link';
import { getSession } from '@/lib/auth';
import { query } from '@/lib/db';
import StatusPill from '@/components/StatusPill';
import { formatDate } from '@/lib/formatDate';

export default async function AccountOrdersPage() {
  const session = await getSession();

  let orders = [];
  try {
    const result = await query(
      `select o.id, o.total, o.status, o.created_at,
              coalesce(json_agg(json_build_object('slug', oi.product_id, 'name', oi.name, 'qty', oi.qty, 'price', oi.price)) filter (where oi.id is not null), '[]') as items
       from orders o
       left join order_items oi on oi.order_id = o.id
       where o.user_id = $1
       group by o.id
       order by o.created_at desc
       limit 50`,
      [session.id]
    );
    orders = result.rows;
  } catch {
    orders = [];
  }

  return (
    <div>
      <span className="font-mono text-xs uppercase tracking-[0.2em] text-brass-light">My account</span>
      <h1 className="mt-2 font-display text-3xl italic text-cream">Order history.</h1>

      <div className="card-surface mt-7 p-7">
        {orders.length === 0 ? (
          <div className="py-6 text-center">
            <p className="text-sm text-ink/60">No orders yet — once you complete a checkout, it'll show up here.</p>
            <Link href="/products" className="btn-dark mt-6 inline-flex">
              Start shopping
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-ink/10">
            {orders.map((order) => (
              <Link key={order.id} href={`/account/orders/${order.id}`} className="block py-4 transition-colors hover:bg-ink/[0.02]">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs uppercase tracking-wide text-ink/50">
                    {formatDate(order.created_at)} · #{order.id.slice(0, 8)}
                  </span>
                  <StatusPill status={order.status} />
                </div>
                <div className="mt-2 flex items-center justify-between">
                  <span className="text-sm text-ink/70">{order.items.map((i) => `${i.name} ×${i.qty}`).join(', ')}</span>
                  <span className="font-mono text-sm text-ink">${Number(order.total).toFixed(2)}</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
