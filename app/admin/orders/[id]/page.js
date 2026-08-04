import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { getAdminOrderById } from '@/lib/orders';
import { getAdminSession } from '@/lib/admin';
import { can } from '@/lib/roles';
import RestrictedNotice from '@/components/admin/RestrictedNotice';
import OrderTracker from '@/components/OrderTracker';
import AdminOrderStatusForm from '@/components/AdminOrderStatusForm';
import StatusPill from '@/components/StatusPill';
import { formatDateTime } from '@/lib/formatDate';

export default async function AdminOrderDetailPage({ params }) {
  const session = await getAdminSession();
  if (!can(session?.role, 'orders')) return <RestrictedNotice role={session?.role} resourceLabel="orders" />;

  let order = null;
  try {
    order = await getAdminOrderById(params.id);
  } catch {
    order = null;
  }

  if (!order) {
    return (
      <div>
        <Link href="/admin/orders" className="inline-flex items-center gap-1.5 font-mono text-xs uppercase tracking-[0.12em] text-cream/60 hover:text-cream">
          <ArrowLeft size={14} /> Back to orders
        </Link>
        <p className="mt-8 text-cream/60">Order not found.</p>
      </div>
    );
  }

  return (
    <div>
      <Link href="/admin/orders" className="inline-flex items-center gap-1.5 font-mono text-xs uppercase tracking-[0.12em] text-cream/60 hover:text-cream">
        <ArrowLeft size={14} /> Back to orders
      </Link>

      <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <span className="font-mono text-xs uppercase tracking-[0.2em] text-brass-light">Order #{order.id.slice(0, 8)}</span>
          <h1 className="mt-2 font-display text-3xl italic text-cream">{order.shipping_name || order.email}</h1>
        </div>
        <StatusPill status={order.status} />
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <div className="card-surface p-7">
          <h2 className="font-display text-lg text-ink">Update status</h2>
          <p className="mt-1 text-xs text-ink/50">Every change is logged and shown to the customer on their tracking page.</p>
          <AdminOrderStatusForm orderId={order.id} currentStatus={order.status} />

          <div className="mt-6 border-t border-ink/10 pt-6">
            <h3 className="font-mono text-xs uppercase tracking-[0.1em] text-ink/50">Status history</h3>
            {order.history.length === 0 ? (
              <p className="mt-2 text-sm text-ink/50">No status changes logged yet.</p>
            ) : (
              <ul className="mt-3 space-y-2">
                {order.history.map((h, i) => (
                  <li key={i} className="flex items-center justify-between text-sm">
                    <span className="text-ink/70">{h.status}{h.note ? ` — ${h.note}` : ''}</span>
                    <span className="font-mono text-xs text-ink/40">{formatDateTime(h.created_at)}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <div className="card-surface p-7">
          <h2 className="font-display text-lg text-ink">Customer view</h2>
          <p className="mt-1 text-xs text-ink/50">This is what the tracking timeline looks like on their account.</p>
          <div className="mt-6">
            <OrderTracker status={order.status} history={order.history} />
          </div>
        </div>
      </div>

      <div className="card-surface mt-6 p-7">
        <h2 className="font-display text-lg text-ink">Items</h2>
        <div className="mt-4 divide-y divide-ink/10">
          {order.items.map((item, i) => (
            <div key={i} className="flex items-center justify-between py-3 text-sm">
              <span className="text-ink/70">{item.name} ×{item.qty}</span>
              <span className="font-mono text-ink">${Number(item.price * item.qty).toFixed(2)}</span>
            </div>
          ))}
        </div>
        <div className="mt-4 flex items-center justify-between border-t border-ink/10 pt-4">
          <span className="font-display text-base text-ink">Total</span>
          <span className="font-mono text-base text-ink">${Number(order.total).toFixed(2)}</span>
        </div>
      </div>
    </div>
  );
}
