'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function CategorySalesChart({ data }) {
  if (!data || data.length === 0) {
    return <p className="py-16 text-center text-sm text-ink/50">No sales in this range yet.</p>;
  }

  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={data} layout="vertical" margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(17,17,17,0.08)" horizontal={false} />
        <XAxis type="number" tickFormatter={(v) => `$${v}`} tick={{ fontSize: 11, fill: 'rgba(17,17,17,0.5)' }} axisLine={false} tickLine={false} />
        <YAxis
          type="category"
          dataKey="category"
          tick={{ fontSize: 11, fill: 'rgba(17,17,17,0.6)', textTransform: 'capitalize' }}
          axisLine={false}
          tickLine={false}
          width={100}
        />
        <Tooltip
          formatter={(value) => [`$${Number(value).toFixed(2)}`, 'Revenue']}
          contentStyle={{ borderRadius: 6, border: '2px solid rgba(168,130,63,0.3)', fontSize: 12 }}
        />
        <Bar dataKey="revenue" fill="#093A2B" radius={[0, 4, 4, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
