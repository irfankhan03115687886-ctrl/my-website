import ChangePasswordForm from '@/components/account/ChangePasswordForm';

export default function ChangePasswordPage() {
  return (
    <div>
      <span className="font-mono text-xs uppercase tracking-[0.2em] text-brass-light">My account</span>
      <h1 className="mt-2 font-display text-3xl italic text-cream">Change password.</h1>

      <div className="card-surface mt-7 max-w-2xl p-7">
        <ChangePasswordForm />
      </div>
    </div>
  );
}
