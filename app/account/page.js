import Link from 'next/link';
import { PackageSearch, MapPin, Heart, ArrowRight } from 'lucide-react';
import { getSession } from '@/lib/auth';
import { query } from '@/lib/db';
import { formatDate } from '@/lib/formatDate';

export default async function AccountDashboardPage() {
  const session = await getSession();

  let recentOrders = [];
  let orderCount = 0;
  let addressCount = 0;
  try {
    const [ordersResult, countResult, addressResult] = await Promise.all([
      query(
        `select o.id, o.total, o.status, o.created_at
         from orders o where o.user_id = $1 order by o.created_at desc limit 3`,
        [session.id]
      ),
      query(`select count(*)::int as count from orders where user_id = $1`, [session.id]),
      query(`select count(*)::int as count from addresses where user_id = $1`, [session.id]),
    ]);
    recentOrders = ordersResult.rows;
    orderCount = countResult.rows[0]?.count || 0;
    addressCount = addressResult.rows[0]?.count || 0;
  } catch {
    // DB not configured yet — show empty state rather than erroring the page.
  }

  return (
    <div>
      <span className="font-mono text-xs uppercase tracking-[0.2em] text-brass-light">My account</span>
      <h1 className="mt-2 font-display text-3xl italic text-cream">Welcome back, {session.firstName}.</h1>
      <p className="mt-2 text-sm text-cream/60">{session.email}</p>

      <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Link href="/account/orders" className="card-surface flex items-center gap-4 p-6 transition-shadow hover:shadow-[0_1px_2px_rgba(0,0,0,0.05),0_18px_36px_rgba(0,0,0,0.12)]">
          <PackageSearch size={22} className="text-forest" />
          <div>
            <div className="font-display text-xl text-ink">{orderCount}</div>
            <div className="font-mono text-[11px] uppercase tracking-[0.1em] text-ink/45">Orders</div>
          </div>
        </Link>
        <Link href="/account/addresses" className="card-surface flex items-center gap-4 p-6 transition-shadow hover:shadow-[0_1px_2px_rgba(0,0,0,0.05),0_18px_36px_rgba(0,0,0,0.12)]">
          <MapPin size={22} className="text-forest" />
          <div>
            <div className="font-display text-xl text-ink">{addressCount}</div>
            <div className="font-mono text-[11px] uppercase tracking-[0.1em] text-ink/45">Saved addresses</div>
          </div>
        </Link>
        <Link href="/account/wishlist" className="card-surface flex items-center gap-4 p-6 transition-shadow hover:shadow-[0_1px_2px_rgba(0,0,0,0.05),0_18px_36px_rgba(0,0,0,0.12)]">
          <Heart size={22} className="text-forest" />
          <div>
            <div className="font-display text-xl text-ink">View</div>
            <div className="font-mono text-[11px] uppercase tracking-[0.1em] text-ink/45">Wishlist</div>
          </div>
        </Link>
      </div>

      <div className="card-surface mt-6 p-7">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-lg text-ink">Recent orders</h2>
          <Link href="/account/orders" className="flex items-center gap-1 font-mono text-xs uppercase tracking-[0.1em] text-forest hover:underline">
            View all <ArrowRight size={13} />
          </Link>
        </div>
        {recentOrders.length === 0 ? (
          <p className="mt-4 text-sm text-ink/60">No orders yet — once you complete a checkout, it'll show up here.</p>
        ) : (
          <div className="mt-4 divide-y divide-ink/10">
            {recentOrders.map((order) => (
              <Link key={order.id} href={`/account/orders/${order.id}`} className="flex items-center justify-between py-3 transition-colors hover:bg-ink/[0.02]">
                <span className="font-mono text-xs uppercase tracking-wide text-ink/50">
                  {formatDate(order.created_at)} · #{order.id.slice(0, 8)}
                </span>
                <span className="font-mono text-sm text-ink">${Number(order.total).toFixed(2)}</span>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
