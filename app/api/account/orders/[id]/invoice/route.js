import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { getOrderForUser } from '@/lib/orders';
import { getSiteSettings } from '@/lib/settings';
import { generateInvoicePdf } from '@/lib/invoice';

export async function GET(request, { params }) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ message: 'Sign in required' }, { status: 401 });
  }

  try {
    // getOrderForUser scopes the query to session.id — a customer can
    // never fetch another customer's invoice by guessing an order id.
    const order = await getOrderForUser(params.id, session.id);
    if (!order) {
      return NextResponse.json({ message: 'Order not found' }, { status: 404 });
    }

    const settings = await getSiteSettings();
    const pdfBuffer = await generateInvoicePdf({ ...order, email: session.email }, settings);

    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="invoice-${order.id.slice(0, 8)}.pdf"`,
      },
    });
  } catch (err) {
    console.error('[invoice download]', err);
    return NextResponse.json({ message: 'Could not generate invoice.' }, { status: 500 });
  }
}
