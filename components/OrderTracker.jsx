import { ORDER_STEPS, stepIndexForStatus } from '@/lib/orderStatuses';
import { CheckCircle2, Circle, PackageX, RotateCcw } from 'lucide-react';
import clsx from 'clsx';
import { formatDateTime } from '@/lib/formatDate';

// Renders the fulfillment path as a beaded trail — on-brand with the
// site's brass/canvas aesthetic. `status` drives which steps are filled;
// `history` (rows from order_status_history) annotates each step with a
// timestamp/note when available.
export default function OrderTracker({ status, history = [] }) {
  if (status === 'failed' || status === 'refunded') {
    const Icon = status === 'failed' ? PackageX : RotateCcw;
    return (
      <div className="flex items-center gap-3 rounded-md border border-ember/40 bg-ember/10 px-5 py-4">
        <Icon size={20} className="text-ember" />
        <div>
          <p className="font-display text-base italic text-ink">
            {status === 'failed' ? 'Payment failed' : 'Order refunded'}
          </p>
          <p className="text-xs text-ink/60">
            {status === 'failed' ? 'This order was not completed.' : 'This order was refunded to the original payment method.'}
          </p>
        </div>
      </div>
    );
  }

  const activeIndex = stepIndexForStatus(status);
  const historyFor = (key) => history.find((h) => h.status === key);

  return (
    <div className="relative">
      <div className="absolute left-[15px] top-4 h-[calc(100%-32px)] w-0.5 bg-ink/10 sm:left-[15px]" aria-hidden="true" />
      <ol className="space-y-7">
        {ORDER_STEPS.map((step, i) => {
          const done = i <= activeIndex;
          const current = i === activeIndex;
          const entry = historyFor(step.key);
          return (
            <li key={step.key} className="relative flex gap-4">
              <span
                className={clsx(
                  'relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border bg-canvas-2',
                  done ? 'border-forest text-forest' : 'border-ink/15 text-ink/25',
                  current && 'shadow-[0_0_0_4px_rgb(var(--c-brass)/0.18)] border-brass text-brass'
                )}
              >
                {done ? <CheckCircle2 size={18} /> : <Circle size={18} />}
              </span>
              <div className={clsx('pb-1', !done && 'opacity-50')}>
                <p className={clsx('font-display text-base', current ? 'italic text-ink' : 'text-ink')}>{step.label}</p>
                {entry ? (
                  <p className="mt-0.5 font-mono text-[11px] uppercase tracking-wide text-ink/45">
                    {formatDateTime(entry.created_at)}
                    {entry.note ? ` · ${entry.note}` : ''}
                  </p>
                ) : current ? (
                  <p className="mt-0.5 font-mono text-[11px] uppercase tracking-wide text-brass">In progress</p>
                ) : null}
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
