import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { getAdminSession } from '@/lib/admin';
import { can } from '@/lib/roles';
import RestrictedNotice from '@/components/admin/RestrictedNotice';
import ProductForm from '@/components/admin/ProductForm';

export default async function NewProductPage() {
  const session = await getAdminSession();
  if (!can(session?.role, 'products')) return <RestrictedNotice role={session?.role} resourceLabel="products" />;

  return (
    <div>
      <Link href="/admin/products" className="inline-flex items-center gap-1.5 font-mono text-xs uppercase tracking-[0.12em] text-cream/60 hover:text-cream">
        <ArrowLeft size={14} /> Back to products
      </Link>

      <h1 className="mt-6 font-display text-3xl italic text-cream">New product.</h1>
      <p className="mt-2 max-w-xl text-sm text-cream/60">
        Save it as a draft to keep working, or publish right away to put it live on the shop.
      </p>

      <div className="card-surface mt-7 max-w-3xl p-7">
        <ProductForm />
      </div>
    </div>
  );
}
