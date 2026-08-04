import Link from 'next/link';
import { DollarSign, ShoppingBag, Users, PackageSearch } from 'lucide-react';
import { getAdminStats, getAdminOrders } from '@/lib/orders';
import { getAllProductsFlat } from '@/lib/products';
import AnimatedStat from '@/components/AnimatedStat';
import StatusPill from '@/components/StatusPill';
import { formatDate } from '@/lib/formatDate';

export default async function DashboardHomePage() {
  let stats = { totalOrders: 0, totalRevenue: 0, totalCustomers: 0, statusCounts: [] };
  let recentOrders = [];
  let products = [];
  let dbError = false;

  try {
    [stats, recentOrders, products] = await Promise.all([
      getAdminStats(),
      getAdminOrders({ limit: 6 }),
      getAllProductsFlat(),
    ]);
  } catch {
    dbError = true;
  }

  const pendingCount = stats.statusCounts.find((s) => s.status === 'pending')?.count || 0;
  const lowStockCount = products.filter((p) => p.stock > 0 && p.stock <= (p.lowStockThreshold ?? 5)).length;

  const cards = [
    { label: 'Total revenue', value: `$${Number(stats.totalRevenue).toFixed(2)}`, icon: DollarSign },
    { label: 'Paid & fulfilled orders', value: stats.totalOrders, icon: ShoppingBag },
    { label: 'Pending orders', value: pendingCount, icon: PackageSearch },
    { label: 'Registered customers', value: stats.totalCustomers, icon: Users },
  ];

  return (
    <div>
      <span className="font-mono text-xs uppercase tracking-[0.2em] text-brass-light">Overview</span>
      <h1 className="mt-2 font-display text-3xl italic text-cream">Good to see you back.</h1>
      <p className="mt-2 text-sm text-cream/60">A quick read on how the shop is doing right now.</p>

      {dbError && (
        <p className="mt-6 rounded-md border border-dashed border-brass/25 px-5 py-4 text-sm text-cream/60">
          Connect <code className="font-mono text-brass-light">DATABASE_URL</code> to see live stats — showing zeros until then.
        </p>
      )}

      <div className="mt-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {cards.map(({ label, value, icon: Icon }) => (
          <div key={label} className="admin-stat-card">
            <Icon size={18} className="text-brass-light" />
            <div className="mt-4 font-display text-2xl text-cream"><AnimatedStat value={String(value)} /></div>
            <div className="mt-1 font-mono text-[11px] uppercase tracking-[0.1em] text-cream/45">{label}</div>
          </div>
        ))}
      </div>

      {products.length > 0 && lowStockCount > 0 && (
        <Link
          href="/dashboard/admin/products"
          className="mt-6 flex items-center justify-between rounded-md border border-brass/30 bg-brass/10 px-5 py-3 text-sm text-brass-light hover:border-brass/60"
        >
          <span>
            {lowStockCount} product{lowStockCount === 1 ? '' : 's'} running low on stock
          </span>
          <span className="font-mono text-xs uppercase tracking-[0.1em]">Review →</span>
        </Link>
      )}

      <div className="card-surface mt-6 p-7">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-lg text-ink">Recent orders</h2>
          <Link href="/dashboard/admin/orders" className="font-mono text-xs uppercase tracking-[0.1em] text-forest hover:underline">
            View all →
          </Link>
        </div>
        {recentOrders.length === 0 ? (
          <p className="mt-5 text-sm text-ink/60">No orders yet.</p>
        ) : (
          <div className="mt-5 overflow-x-auto">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Order</th>
                  <th>Customer</th>
                  <th>Date</th>
                  <th>Status</th>
                  <th className="text-right">Total</th>
                </tr>
              </thead>
              <tbody>
                {recentOrders.map((order) => (
                  <tr key={order.id}>
                    <td>
                      <Link href={`/dashboard/admin/orders/${order.id}`} className="font-mono text-xs text-forest hover:underline">
                        #{order.id.slice(0, 8)}
                      </Link>
                    </td>
                    <td>{order.shipping_name || order.email}</td>
                    <td className="font-mono text-xs text-ink/50">{formatDate(order.created_at)}</td>
                    <td>
                      <StatusPill status={order.status} />
                    </td>
                    <td className="text-right font-mono">${Number(order.total).toFixed(2)}</td>
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
