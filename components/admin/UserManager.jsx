'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Trash2, UserPlus, Ban, CheckCircle2 } from 'lucide-react';
import { ROLES, ROLE_LABELS } from '@/lib/roles';

export default function UserManager({ users, currentUserId }) {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('order_manager');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function handleInvite(e) {
    e.preventDefault();
    if (!email.trim()) return;
    setSaving(true);
    setError('');
    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), role }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message || 'Failed to promote user');
      setEmail('');
      router.refresh();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleRoleChange(userId, newRole) {
    await fetch(`/api/admin/users/${userId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role: newRole }),
    });
    router.refresh();
  }

  async function handleToggleDisabled(user) {
    await fetch(`/api/admin/users/${user.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ disabled: !user.disabled }),
    });
    router.refresh();
  }

  async function handleRemove(userId) {
    await fetch(`/api/admin/users/${userId}`, { method: 'DELETE' });
    router.refresh();
  }

  return (
    <div>
      <form onSubmit={handleInvite} className="flex flex-wrap gap-3">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Existing customer's email address"
          className="input flex-[2]"
        />
        <select value={role} onChange={(e) => setRole(e.target.value)} className="input flex-1">
          {ROLES.filter((r) => r !== 'super_admin').map((r) => (
            <option key={r} value={r}>
              {ROLE_LABELS[r]}
            </option>
          ))}
        </select>
        <button type="submit" disabled={saving} className="btn-dark shrink-0">
          <UserPlus size={15} className="mr-1.5" /> Grant access
        </button>
      </form>
      <p className="mt-2 text-xs text-ink/50">
        The person must already have a Field & Co account (sign them up first) — this grants an existing account admin
        access, it doesn't create a new one.
      </p>
      {error && <p className="mt-2 text-xs text-ember">{error}</p>}

      <div className="mt-7 overflow-x-auto">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Role</th>
              <th>Status</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id}>
                <td>
                  {u.first_name} {u.last_name}
                  {u.id === currentUserId && <span className="ml-2 font-mono text-[10px] uppercase text-brass">You</span>}
                </td>
                <td className="text-ink/60">{u.email}</td>
                <td>
                  <select
                    defaultValue={u.role || 'admin'}
                    onChange={(e) => handleRoleChange(u.id, e.target.value)}
                    disabled={u.id === currentUserId}
                    className="input py-1 text-xs"
                  >
                    {ROLES.map((r) => (
                      <option key={r} value={r}>
                        {ROLE_LABELS[r]}
                      </option>
                    ))}
                  </select>
                </td>
                <td>
                  <span className={u.disabled ? 'status-pill border-ember text-ember' : 'status-pill border-forest text-forest'}>
                    {u.disabled ? 'disabled' : 'active'}
                  </span>
                </td>
                <td className="text-right">
                  <div className="flex justify-end gap-3">
                    <button
                      onClick={() => handleToggleDisabled(u)}
                      disabled={u.id === currentUserId}
                      aria-label={u.disabled ? 'Enable user' : 'Disable user'}
                      className="text-ink/40 hover:text-forest disabled:opacity-30"
                    >
                      {u.disabled ? <CheckCircle2 size={15} /> : <Ban size={15} />}
                    </button>
                    <button
                      onClick={() => handleRemove(u.id)}
                      disabled={u.id === currentUserId}
                      aria-label="Remove admin access"
                      className="text-ink/40 hover:text-ember disabled:opacity-30"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
