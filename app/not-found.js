import Link from 'next/link';
import { Compass } from 'lucide-react';

export default function NotFound() {
  return (
    <section className="flex min-h-[70vh] flex-col items-center justify-center bg-ink px-5 text-center sm:px-8">
      <Compass size={32} className="text-brass-light" strokeWidth={1.5} />
      <span className="mt-5 font-mono text-xs uppercase tracking-[0.2em] text-brass-light">404</span>
      <h1 className="mt-3 font-display text-4xl italic text-cream">Off the marked trail.</h1>
      <p className="mt-3 max-w-sm text-sm leading-relaxed text-cream/60">
        The page you're looking for doesn't exist — it may have moved, or the link might be off.
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-4">
        <Link href="/" className="btn-primary">
          Back home
        </Link>
        <Link href="/products" className="btn-outline">
          Shop all products
        </Link>
      </div>
    </section>
  );
}
