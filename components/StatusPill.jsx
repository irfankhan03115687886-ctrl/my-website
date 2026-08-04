const STYLES = {
  pending: 'border-brass/40 text-brass-light',
  paid: 'border-forest text-forest',
  processing: 'border-forest text-forest',
  shipped: 'border-forest text-forest',
  delivered: 'border-forest bg-forest/10 text-forest',
  failed: 'border-ember text-ember',
  refunded: 'border-ember text-ember',
};

export default function StatusPill({ status }) {
  return <span className={`status-pill ${STYLES[status] || 'border-ink/20 text-ink/60'}`}>{status}</span>;
}
