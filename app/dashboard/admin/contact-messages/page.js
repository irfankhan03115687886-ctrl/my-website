import ContactMessagesManager from '@/components/admin/ContactMessagesManager';
import { getContactMessages } from '@/lib/contactMessages';

export default async function DashboardContactMessagesPage() {
  const messages = await getContactMessages();

  return (
    <div>
      <span className="font-mono text-xs uppercase tracking-[0.2em] text-brass-light">Support</span>
      <h1 className="mt-2 font-display text-3xl italic text-cream">Contact Messages.</h1>
      <p className="mt-2 max-w-xl text-sm text-cream/60">
        Everything submitted through the storefront's Contact form lands here.
      </p>

      <div className="card-surface mt-7 p-7">
        <ContactMessagesManager initialMessages={messages} />
      </div>
    </div>
  );
}
