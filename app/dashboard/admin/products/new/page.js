import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import ProductForm from '@/components/admin/ProductForm';

export default async function DashboardNewProductPage() {
  return (
    <div>
      <Link href="/dashboard/admin/products" className="inline-flex items-center gap-1.5 font-mono text-xs uppercase tracking-[0.12em] text-cream/60 hover:text-cream">
        <ArrowLeft size={14} /> Back to products
      </Link>

      <h1 className="mt-6 font-display text-3xl italic text-cream">New product.</h1>
      <p className="mt-2 max-w-xl text-sm text-cream/60">
        Save it as a draft to keep working, or publish right away to put it live on the shop.
      </p>

      <div className="card-surface mt-7 max-w-3xl p-7">
        <ProductForm redirectBasePath="/dashboard/admin/products" />
      </div>
    </div>
  );
}
