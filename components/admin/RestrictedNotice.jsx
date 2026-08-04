import { ShieldAlert } from 'lucide-react';
import { ROLE_LABELS } from '@/lib/roles';

export default function RestrictedNotice({ role, resourceLabel }) {
  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center text-center">
      <ShieldAlert size={28} className="text-brass-light" />
      <h1 className="mt-4 font-display text-2xl italic text-cream">Not part of your role.</h1>
      <p className="mt-2 max-w-sm text-sm text-cream/60">
        {role ? `The ${ROLE_LABELS[role] || role} role` : 'Your account'} doesn't include access to {resourceLabel}. Ask a
        Super Admin to update your role if you need it.
      </p>
    </div>
  );
}
