import Link from 'next/link';
import { CheckCircle2, XCircle } from 'lucide-react';
import { confirmEmailChange } from '@/lib/emailChange';

export default async function VerifyEmailPage({ searchParams }) {
  const token = searchParams?.token;
  let result = { ok: false, message: 'Missing verification token.' };

  if (token) {
    try {
      result = await confirmEmailChange(token);
    } catch (err) {
      console.error('[verify email]', err);
      result = { ok: false, message: 'Something went wrong verifying this link.' };
    }
  }

  return (
    <div className="mx-auto flex min-h-[60vh] max-w-md flex-col items-center justify-center text-center">
      {result.ok ? (
        <>
          <CheckCircle2 size={28} className="text-forest" />
          <h1 className="mt-4 font-display text-2xl italic text-cream">Email updated.</h1>
          <p className="mt-2 text-sm text-cream/60">Your account email is now {result.email}.</p>
        </>
      ) : (
        <>
          <XCircle size={28} className="text-ember" />
          <h1 className="mt-4 font-display text-2xl italic text-cream">Couldn't verify that link.</h1>
          <p className="mt-2 text-sm text-cream/60">{result.message}</p>
        </>
      )}
      <Link href="/account/profile" className="btn-primary mt-8">
        Back to profile
      </Link>
    </div>
  );
}
