import { NextResponse } from 'next/server';
import { requirePermission } from '@/lib/admin';
import { getContactMessages } from '@/lib/contactMessages';

export async function GET() {
  const session = await requirePermission('contact_messages');
  if (!session) return NextResponse.json({ message: 'Forbidden' }, { status: 403 });

  try {
    const messages = await getContactMessages();
    return NextResponse.json({ messages });
  } catch (err) {
    console.error('[admin contact messages]', err);
    return NextResponse.json({ message: 'Could not load messages.' }, { status: 500 });
  }
}
