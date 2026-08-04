'use client';

import { useMemo, useState } from 'react';
import { Search, Mail, MailOpen, Trash2, ChevronLeft, ChevronRight, X } from 'lucide-react';
import clsx from 'clsx';
import { formatDateTime } from '@/lib/formatDate';

const PAGE_SIZE = 15;

export default function ContactMessagesManager({ initialMessages }) {
  const [messages, setMessages] = useState(initialMessages);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all'); // all | unread | read
  const [page, setPage] = useState(1);
  const [open, setOpen] = useState(null);
  const [busyId, setBusyId] = useState(null);
  const [error, setError] = useState('');

  const filtered = useMemo(() => {
    let list = messages;
    if (filter === 'unread') list = list.filter((m) => !m.is_read);
    if (filter === 'read') list = list.filter((m) => m.is_read);
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(
        (m) =>
          m.name.toLowerCase().includes(q) ||
          m.email.toLowerCase().includes(q) ||
          (m.subject || '').toLowerCase().includes(q) ||
          m.message.toLowerCase().includes(q)
      );
    }
    return list;
  }, [messages, search, filter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageItems = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const unreadCount = messages.filter((m) => !m.is_read).length;

  async function markRead(msg, isRead) {
    setBusyId(msg.id);
    setError('');
    try {
      const res = await fetch(`/api/admin/contact-messages/${msg.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isRead }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message || 'Could not update message');
      setMessages((prev) => prev.map((m) => (m.id === msg.id ? data.message : m)));
      if (open?.id === msg.id) setOpen(data.message);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusyId(null);
    }
  }

  async function handleDelete(msg) {
    if (!confirm(`Delete the message from ${msg.name}? This can't be undone.`)) return;
    setBusyId(msg.id);
    setError('');
    try {
      const res = await fetch(`/api/admin/contact-messages/${msg.id}`, { method: 'DELETE' });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message || 'Could not delete message');
      setMessages((prev) => prev.filter((m) => m.id !== msg.id));
      if (open?.id === msg.id) setOpen(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusyId(null);
    }
  }

  function openMessage(msg) {
    setOpen(msg);
    if (!msg.is_read) markRead(msg, true);
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink/30" />
            <input
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Search messages…"
              className="input w-64 pl-8"
            />
          </div>
          <select
            value={filter}
            onChange={(e) => {
              setFilter(e.target.value);
              setPage(1);
            }}
            className="input w-auto"
          >
            <option value="all">All ({messages.length})</option>
            <option value="unread">Unread ({unreadCount})</option>
            <option value="read">Read ({messages.length - unreadCount})</option>
          </select>
        </div>
        <span className="font-mono text-xs uppercase tracking-[0.1em] text-ink/40">
          {filtered.length} message{filtered.length === 1 ? '' : 's'}
        </span>
      </div>

      {error && <p className="mt-3 text-xs text-ember">{error}</p>}

      <div className="mt-5 overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-ink/10 font-mono text-[11px] uppercase tracking-[0.08em] text-ink/40">
              <th className="py-2 pr-3"></th>
              <th className="py-2 pr-3">From</th>
              <th className="py-2 pr-3">Subject</th>
              <th className="py-2 pr-3">Date</th>
              <th className="py-2 pr-3"></th>
            </tr>
          </thead>
          <tbody>
            {pageItems.map((msg) => (
              <tr
                key={msg.id}
                onClick={() => openMessage(msg)}
                className={clsx('cursor-pointer border-b border-ink/5 hover:bg-ink/[0.03]', !msg.is_read && 'bg-brass/5')}
              >
                <td className="py-3 pr-3">
                  {msg.is_read ? <MailOpen size={15} className="text-ink/30" /> : <Mail size={15} className="text-brass" />}
                </td>
                <td className="py-3 pr-3">
                  <div className={clsx('text-ink', !msg.is_read && 'font-semibold')}>{msg.name}</div>
                  <div className="text-xs text-ink/50">{msg.email}</div>
                </td>
                <td className="py-3 pr-3 max-w-xs truncate text-ink/70">{msg.subject || '—'}</td>
                <td className="py-3 pr-3 whitespace-nowrap font-mono text-xs text-ink/50">{formatDateTime(msg.created_at)}</td>
                <td className="py-3 pr-3 text-right">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(msg);
                    }}
                    disabled={busyId === msg.id}
                    aria-label="Delete message"
                    className="text-ink/30 hover:text-ember disabled:opacity-50"
                  >
                    <Trash2 size={15} />
                  </button>
                </td>
              </tr>
            ))}
            {pageItems.length === 0 && (
              <tr>
                <td colSpan={5} className="py-10 text-center text-sm text-ink/40">
                  No messages found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="mt-5 flex items-center justify-center gap-3">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="rounded-full border border-ink/15 p-1.5 disabled:opacity-30"
          >
            <ChevronLeft size={15} />
          </button>
          <span className="font-mono text-xs text-ink/50">
            Page {page} of {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="rounded-full border border-ink/15 p-1.5 disabled:opacity-30"
          >
            <ChevronRight size={15} />
          </button>
        </div>
      )}

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/60 px-5" onClick={() => setOpen(null)}>
          <div className="max-h-[80vh] w-full max-w-lg overflow-y-auto rounded-md bg-canvas-2 p-7" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="font-display text-xl italic text-ink">{open.subject || 'General inquiry'}</h3>
                <p className="mt-1 text-sm text-ink/60">
                  {open.name} · {open.email}
                </p>
                <p className="mt-0.5 font-mono text-xs text-ink/40">{formatDateTime(open.created_at)}</p>
              </div>
              <button onClick={() => setOpen(null)} className="text-ink/40 hover:text-ink">
                <X size={18} />
              </button>
            </div>
            <p className="mt-5 whitespace-pre-wrap text-sm leading-relaxed text-ink/80">{open.message}</p>
            <div className="mt-6 flex flex-wrap gap-3 border-t border-ink/10 pt-5">
              <button
                onClick={() => markRead(open, !open.is_read)}
                disabled={busyId === open.id}
                className="btn-outline-ink"
              >
                Mark as {open.is_read ? 'unread' : 'read'}
              </button>
              <a href={`mailto:${open.email}`} className="btn-dark">
                Reply by email
              </a>
              <button
                onClick={() => handleDelete(open)}
                disabled={busyId === open.id}
                className="font-mono text-xs uppercase tracking-[0.1em] text-ember underline"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
