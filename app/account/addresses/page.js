import { getSession } from '@/lib/auth';
import { listAddresses } from '@/lib/addresses';
import AddressManager from '@/components/account/AddressManager';

export default async function AddressesPage() {
  const session = await getSession();
  let addresses = [];
  try {
    addresses = await listAddresses(session.id);
  } catch {
    addresses = [];
  }

  return (
    <div>
      <span className="font-mono text-xs uppercase tracking-[0.2em] text-brass-light">My account</span>
      <h1 className="mt-2 font-display text-3xl italic text-cream">Addresses.</h1>
      <p className="mt-2 text-sm text-cream/60">Save addresses so checkout only takes a few seconds.</p>

      <div className="card-surface mt-7 p-7">
        <AddressManager addresses={addresses} />
      </div>
    </div>
  );
}
