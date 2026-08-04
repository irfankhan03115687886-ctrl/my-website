import { listPages } from '@/lib/pages';
import PageManager from '@/components/dashboard/PageManager';

export default async function DashboardPagesPage() {
  const pages = await listPages();

  return (
    <div>
      <span className="font-mono text-xs uppercase tracking-[0.2em] text-brass-light">Content</span>
      <h1 className="mt-2 font-display text-3xl italic text-cream">Other pages.</h1>
      <p className="mt-2 max-w-xl text-sm text-cream/60">
        Freeform pages like About, FAQ, or Shipping & Returns. Published pages are live at{' '}
        <code className="font-mono text-brass-light">/pages/[slug]</code>.
      </p>

      <div className="card-surface mt-7 p-7">
        <PageManager pages={pages} />
      </div>
    </div>
  );
}
