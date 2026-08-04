import Link from 'next/link';
import { ArrowLeft, Download } from 'lucide-react';
import { getSession } from '@/lib/auth';
import { getOrderForUser } from '@/lib/orders';
import OrderTracker from '@/components/OrderTracker';
import ReorderButton from '@/components/account/ReorderButton';
import { formatDate } from '@/lib/formatDate';

export default async function OrderTrackingPage({ params }) {
  const session = await getSession();

  let order = null;
  try {
    order = await getOrderForUser(params.id, session.id);
  } catch {
    order = null;
  }

  if (!order) {
    return (
      <div className="text-center">
        <h1 className="font-display text-2xl italic text-cream">Order not found.</h1>
        <p className="mt-3 text-sm text-cream/60">We couldn't find that order on your account.</p>
        <Link href="/account/orders" className="btn-outline mt-8 inline-flex">
          Back to orders
        </Link>
      </div>
    );
  }

  return (
    <div>
      <Link href="/account/orders" className="inline-flex items-center gap-1.5 font-mono text-xs uppercase tracking-[0.12em] text-cream/60 hover:text-cream">
        <ArrowLeft size={14} /> Back to orders
      </Link>

      <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <span className="font-mono text-xs uppercase tracking-[0.2em] text-brass-light">Order #{order.id.slice(0, 8)}</span>
          <h1 className="mt-2 font-display text-3xl italic text-cream">Track your order.</h1>
        </div>
        <span className="rounded-full border border-brass/40 px-4 py-1.5 font-mono text-xs uppercase tracking-[0.12em] text-brass-light">
          {order.status}
        </span>
      </div>

      <div className="card-surface mt-8 p-7">
        <h2 className="font-display text-lg text-ink">Fulfillment status</h2>
        <div className="mt-6">
          <OrderTracker status={order.status} history={order.history} />
        </div>
      </div>

      <div className="card-surface mt-6 p-7">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-display text-lg text-ink">Order summary</h2>
          <div className="flex flex-wrap gap-3">
            <a href={`/api/account/orders/${order.id}/invoice`} className="btn-outline-ink">
              <Download size={14} className="mr-1.5" /> Invoice (PDF)
            </a>
            <ReorderButton items={order.items} />
          </div>
        </div>
        <div className="mt-4 divide-y divide-ink/10">
          {order.items.map((item, i) => (
            <div key={i} className="flex items-center justify-between py-3">
              <span className="text-sm text-ink/70">{item.name} ×{item.qty}</span>
              <span className="font-mono text-sm text-ink">${Number(item.price * item.qty).toFixed(2)}</span>
            </div>
          ))}
        </div>
        <div className="mt-4 flex items-center justify-between border-t border-ink/10 pt-4">
          <span className="font-display text-base text-ink">Total</span>
          <span className="font-mono text-base text-ink">${Number(order.total).toFixed(2)}</span>
        </div>
        <p className="mt-4 font-mono text-xs uppercase tracking-wide text-ink/40">
          Placed {formatDate(order.created_at)}
          {order.shipping_name ? ` · Shipping to ${order.shipping_name}` : ''}
        </p>
      </div>
    </div>
  );
}
