'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Ban, CheckCircle2 } from 'lucide-react';
import { formatDate } from '@/lib/formatDate';

export default function CustomerTable({ customers }) {
  const router = useRouter();
  const [busyId, setBusyId] = useState(null);

  async function toggleDisabled(customer) {
    setBusyId(customer.id);
    try {
      await fetch(`/api/dashboard-admin/customers/${customer.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ disabled: !customer.disabled }),
      });
      router.refresh();
    } finally {
      setBusyId(null);
    }
  }

  if (customers.length === 0) {
    return <p className="text-sm text-ink/60">No customers have signed up yet.</p>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="admin-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Email</th>
            <th>Joined</th>
            <th>Orders</th>
            <th>Total spent</th>
            <th>Status</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {customers.map((c) => (
            <tr key={c.id}>
              <td>
                {c.first_name} {c.last_name}
              </td>
              <td className="text-ink/60">{c.email}</td>
              <td className="font-mono text-xs text-ink/50">{formatDate(c.created_at)}</td>
              <td className="font-mono">{c.order_count}</td>
              <td className="font-mono">${Number(c.total_spent).toFixed(2)}</td>
              <td>
                <span className={c.disabled ? 'status-pill border-ember text-ember' : 'status-pill border-forest text-forest'}>
                  {c.disabled ? 'disabled' : 'active'}
                </span>
              </td>
              <td className="text-right">
                <button
                  onClick={() => toggleDisabled(c)}
                  disabled={busyId === c.id}
                  className="inline-flex items-center gap-1.5 font-mono text-xs uppercase tracking-[0.1em] text-ink/50 hover:text-ink disabled:opacity-40"
                >
                  {c.disabled ? <CheckCircle2 size={13} /> : <Ban size={13} />}
                  {c.disabled ? 'Enable' : 'Disable'}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
