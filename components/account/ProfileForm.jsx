'use client';

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Camera } from 'lucide-react';

export default function ProfileForm({ user }) {
  const router = useRouter();
  const fileInputRef = useRef(null);
  const [form, setForm] = useState({ firstName: user.first_name, lastName: user.last_name, phone: user.phone || '' });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');
  const [avatarUrl, setAvatarUrl] = useState(user.avatar_url || '');
  const [uploading, setUploading] = useState(false);

  const [newEmail, setNewEmail] = useState('');
  const [emailPassword, setEmailPassword] = useState('');
  const [emailStatus, setEmailStatus] = useState('idle');
  const [emailMessage, setEmailMessage] = useState('');

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
    setSaved(false);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const res = await fetch('/api/account/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message || 'Failed to save');
      setSaved(true);
      router.refresh();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleAvatarUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch('/api/account/avatar', { method: 'POST', body: formData });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message || 'Upload failed');
      setAvatarUrl(data.url);
      router.refresh();
    } catch (err) {
      setError(err.message);
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }

  async function handleEmailChange(e) {
    e.preventDefault();
    if (!newEmail || !emailPassword) return;
    setEmailStatus('loading');
    try {
      const res = await fetch('/api/account/change-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newEmail, password: emailPassword }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message || 'Failed to request email change');
      setEmailMessage(data.message);
      setEmailStatus('done');
      setNewEmail('');
      setEmailPassword('');
    } catch (err) {
      setEmailMessage(err.message);
      setEmailStatus('error');
    }
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-5">
        <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-full bg-ink/10">
          {avatarUrl ? (
            <Image src={avatarUrl} alt="" fill className="object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center font-display text-2xl text-ink/40">
              {user.first_name?.[0]}
              {user.last_name?.[0]}
            </div>
          )}
        </div>
        <label className="flex cursor-pointer items-center gap-2 rounded-full border border-dashed border-brass/30 px-4 py-2 text-sm text-ink/60 hover:border-brass/60 hover:text-ink">
          <Camera size={15} />
          {uploading ? 'Uploading…' : 'Change photo'}
          <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp" onChange={handleAvatarUpload} className="hidden" />
        </label>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="font-mono text-[11px] uppercase tracking-[0.1em] text-ink/50">First name</span>
            <input required value={form.firstName} onChange={(e) => update('firstName', e.target.value)} className="input mt-1.5 w-full" />
          </label>
          <label className="block">
            <span className="font-mono text-[11px] uppercase tracking-[0.1em] text-ink/50">Last name</span>
            <input required value={form.lastName} onChange={(e) => update('lastName', e.target.value)} className="input mt-1.5 w-full" />
          </label>
          <label className="block sm:col-span-2">
            <span className="font-mono text-[11px] uppercase tracking-[0.1em] text-ink/50">Phone number</span>
            <input value={form.phone} onChange={(e) => update('phone', e.target.value)} className="input mt-1.5 w-full" />
          </label>
        </div>
        <div className="flex items-center gap-4">
          <button type="submit" disabled={saving} className="btn-dark">
            {saving ? 'Saving…' : 'Save changes'}
          </button>
          {saved && <span className="font-mono text-xs uppercase tracking-wide text-forest">Saved</span>}
          {error && <span className="text-xs text-ember">{error}</span>}
        </div>
      </form>

      <div className="border-t border-ink/10 pt-6">
        <h3 className="font-display text-base text-ink">Email address</h3>
        <p className="mt-1 text-sm text-ink/60">
          Currently: <strong className="text-ink">{user.email}</strong>
          {user.pending_email && <span className="text-brass"> (verification pending for {user.pending_email})</span>}
        </p>
        <form onSubmit={handleEmailChange} className="mt-3 flex flex-wrap gap-3">
          <input
            type="email"
            value={newEmail}
            onChange={(e) => setNewEmail(e.target.value)}
            placeholder="New email address"
            className="input flex-1"
          />
          <input
            type="password"
            required
            value={emailPassword}
            onChange={(e) => setEmailPassword(e.target.value)}
            placeholder="Current password"
            autoComplete="current-password"
            className="input flex-1"
          />
          <button type="submit" disabled={emailStatus === 'loading'} className="btn-outline-ink shrink-0">
            {emailStatus === 'loading' ? 'Sending…' : 'Request change'}
          </button>
        </form>
        {emailStatus === 'done' && <p className="mt-2 text-xs text-forest">{emailMessage}</p>}
        {emailStatus === 'error' && <p className="mt-2 text-xs text-ember">{emailMessage}</p>}
      </div>
    </div>
  );
}
