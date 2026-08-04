'use client';

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const COLORS = {
  pending: '#15654E',
  paid: '#2b3a2e',
  processing: '#2b3a2e',
  shipped: '#3d5240',
  delivered: '#1d2a20',
  failed: '#8c4a2f',
  refunded: '#8c4a2f',
};

export default function StatusDonutChart({ data }) {
  if (!data || data.length === 0) {
    return <p className="py-16 text-center text-sm text-ink/50">No orders in this range yet.</p>;
  }

  return (
    <ResponsiveContainer width="100%" height={260}>
      <PieChart>
        <Pie data={data} dataKey="count" nameKey="status" innerRadius={55} outerRadius={90} paddingAngle={2}>
          {data.map((entry) => (
            <Cell key={entry.status} fill={COLORS[entry.status] || '#8a8a8a'} />
          ))}
        </Pie>
        <Tooltip contentStyle={{ borderRadius: 6, border: '2px solid rgba(168,130,63,0.3)', fontSize: 12 }} />
        <Legend
          iconType="circle"
          iconSize={8}
          formatter={(value) => <span style={{ fontSize: 11, textTransform: 'capitalize', color: 'rgba(17,17,17,0.6)' }}>{value}</span>}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}
