import { listCustomers } from '@/lib/customers';
import CustomerTable from '@/components/dashboard/CustomerTable';

export default async function DashboardCustomersPage() {
  let customers = [];
  try {
    customers = await listCustomers();
  } catch {
    customers = [];
  }

  return (
    <div>
      <span className="font-mono text-xs uppercase tracking-[0.2em] text-brass-light">People</span>
      <h1 className="mt-2 font-display text-3xl italic text-cream">Customers.</h1>
      <p className="mt-2 max-w-xl text-sm text-cream/60">
        Everyone who's signed up to shop — order count and lifetime spend at a glance. Disabling an account blocks them
        from signing in without deleting their order history.
      </p>

      <div className="card-surface mt-7 p-7">
        <CustomerTable customers={customers} />
      </div>
    </div>
  );
}
