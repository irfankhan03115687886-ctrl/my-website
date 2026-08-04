import Link from 'next/link';
import clsx from 'clsx';
import { getAdminOrders } from '@/lib/orders';
import { ALL_STATUSES } from '@/lib/orders';
import StatusPill from '@/components/StatusPill';
import { formatDate } from '@/lib/formatDate';

export default async function DashboardOrdersPage({ searchParams }) {
  const status = searchParams?.status || 'all';
  let orders = [];
  try {
    orders = await getAdminOrders({ status, limit: 100 });
  } catch {
    orders = [];
  }

  return (
    <div>
      <span className="font-mono text-xs uppercase tracking-[0.2em] text-brass-light">Fulfillment</span>
      <h1 className="mt-2 font-display text-3xl italic text-cream">Orders.</h1>
      <p className="mt-2 text-sm text-cream/60">Every order, its current status, and where to update it.</p>

      <div className="mt-7 flex flex-wrap gap-2">
        {['all', ...ALL_STATUSES].map((s) => (
          <Link
            key={s}
            href={s === 'all' ? '/dashboard/admin/orders' : `/dashboard/admin/orders?status=${s}`}
            className={clsx(
              'rounded-full border px-4 py-1.5 font-mono text-xs uppercase tracking-[0.1em] transition-colors',
              status === s ? 'border-brass bg-brass text-ink' : 'border-cream/20 text-cream/60 hover:border-brass/50 hover:text-cream'
            )}
          >
            {s}
          </Link>
        ))}
      </div>

      <div className="card-surface mt-7 p-7">
        {orders.length === 0 ? (
          <p className="text-sm text-ink/60">No orders match this filter yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Order</th>
                  <th>Customer</th>
                  <th>Date</th>
                  <th>Status</th>
                  <th className="text-right">Total</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <tr key={order.id}>
                    <td className="font-mono text-xs">#{order.id.slice(0, 8)}</td>
                    <td>{order.shipping_name || order.email}</td>
                    <td className="font-mono text-xs text-ink/50">{formatDate(order.created_at)}</td>
                    <td>
                      <StatusPill status={order.status} />
                    </td>
                    <td className="text-right font-mono">${Number(order.total).toFixed(2)}</td>
                    <td className="text-right">
                      <Link href={`/dashboard/admin/orders/${order.id}`} className="font-mono text-xs uppercase tracking-[0.1em] text-forest hover:underline">
                        Manage →
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
