import { Suspense } from 'react';
import { TrendingUp, ShoppingBag, DollarSign, Users } from 'lucide-react';
import { resolveDateRange, getAnalyticsSummary } from '@/lib/analytics';
import AnimatedStat from '@/components/AnimatedStat';
import DateRangeFilter from '@/components/dashboard/DateRangeFilter';
import RevenueChart from '@/components/dashboard/charts/RevenueChart';
import CategorySalesChart from '@/components/dashboard/charts/CategorySalesChart';
import StatusDonutChart from '@/components/dashboard/charts/StatusDonutChart';

async function AnalyticsContent({ searchParams }) {
  const preset = searchParams?.preset || 'last30';
  const range = resolveDateRange({ preset, from: searchParams?.from, to: searchParams?.to });
  const data = await getAnalyticsSummary(range);

  const cards = [
    { label: 'Revenue', value: `$${data.totals.totalRevenue.toFixed(2)}`, icon: DollarSign },
    { label: 'Orders', value: data.totals.totalOrders, icon: ShoppingBag },
    { label: 'Avg. order value', value: `$${data.totals.avgOrderValue.toFixed(2)}`, icon: TrendingUp },
    { label: 'New customers', value: data.totals.totalNewCustomers, icon: Users },
  ];

  return (
    <div>
      <div className="mt-7">
        <DateRangeFilter activePreset={preset} />
      </div>
      <p className="mt-3 font-mono text-xs uppercase tracking-[0.1em] text-cream/40">{range.label}</p>

      <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {cards.map(({ label, value, icon: Icon }) => (
          <div key={label} className="admin-stat-card">
            <Icon size={18} className="text-brass-light" />
            <div className="mt-4 font-display text-2xl text-cream"><AnimatedStat value={String(value)} /></div>
            <div className="mt-1 font-mono text-[11px] uppercase tracking-[0.1em] text-cream/45">{label}</div>
          </div>
        ))}
      </div>

      <div className="card-surface mt-6 p-7">
        <h2 className="font-display text-lg text-ink">Revenue over time</h2>
        <div className="mt-4">
          <RevenueChart data={data.revenueOverTime} />
        </div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <div className="card-surface p-7">
          <h2 className="font-display text-lg text-ink">Sales by category</h2>
          <div className="mt-4">
            <CategorySalesChart data={data.salesByCategory} />
          </div>
        </div>
        <div className="card-surface p-7">
          <h2 className="font-display text-lg text-ink">Order status distribution</h2>
          <div className="mt-4">
            <StatusDonutChart data={data.statusDistribution} />
          </div>
        </div>
      </div>

      <div className="card-surface mt-6 p-7">
        <h2 className="font-display text-lg text-ink">Best-selling products</h2>
        {data.bestSellers.length === 0 ? (
          <p className="mt-4 text-sm text-ink/60">No sales in this range yet.</p>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th className="text-right">Units sold</th>
                  <th className="text-right">Revenue</th>
                </tr>
              </thead>
              <tbody>
                {data.bestSellers.map((p) => (
                  <tr key={p.slug}>
                    <td>{p.name}</td>
                    <td className="text-right font-mono">{p.units_sold}</td>
                    <td className="text-right font-mono">${Number(p.revenue).toFixed(2)}</td>
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

export default function DashboardAnalyticsPage({ searchParams }) {
  return (
    <div>
      <span className="font-mono text-xs uppercase tracking-[0.2em] text-brass-light">Reports</span>
      <h1 className="mt-2 font-display text-3xl italic text-cream">Analytics.</h1>
      <p className="mt-2 text-sm text-cream/60">Revenue, orders, and what's actually selling — filter by any date range.</p>
      <Suspense fallback={<p className="mt-8 text-sm text-cream/50">Loading analytics…</p>}>
        <AnalyticsContent searchParams={searchParams} />
      </Suspense>
    </div>
  );
}
