'use client';

import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

function formatDate(d) {
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export default function RevenueChart({ data }) {
  if (!data || data.length === 0) {
    return <p className="py-16 text-center text-sm text-ink/50">No revenue in this range yet.</p>;
  }

  return (
    <ResponsiveContainer width="100%" height={280}>
      <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="revenueFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#15654E" stopOpacity={0.35} />
            <stop offset="100%" stopColor="#15654E" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(17,17,17,0.08)" vertical={false} />
        <XAxis
          dataKey="date"
          tickFormatter={formatDate}
          tick={{ fontSize: 11, fill: 'rgba(17,17,17,0.5)' }}
          axisLine={{ stroke: 'rgba(17,17,17,0.1)' }}
          tickLine={false}
        />
        <YAxis
          tickFormatter={(v) => `$${v}`}
          tick={{ fontSize: 11, fill: 'rgba(17,17,17,0.5)' }}
          axisLine={false}
          tickLine={false}
          width={56}
        />
        <Tooltip
          formatter={(value, name) => [name === 'revenue' ? `$${Number(value).toFixed(2)}` : value, name === 'revenue' ? 'Revenue' : 'Orders']}
          labelFormatter={formatDate}
          contentStyle={{ borderRadius: 6, border: '2px solid rgba(168,130,63,0.3)', fontSize: 12 }}
        />
        <Area type="monotone" dataKey="revenue" stroke="#15654E" strokeWidth={2} fill="url(#revenueFill)" />
      </AreaChart>
    </ResponsiveContainer>
  );
}
