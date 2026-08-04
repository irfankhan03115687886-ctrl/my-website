import { NextResponse } from 'next/server';
import { requirePermission } from '@/lib/admin';
import { setContactMessageRead, deleteContactMessage } from '@/lib/contactMessages';
import { logActivity } from '@/lib/activityLog';

export async function PATCH(request, { params }) {
  const session = await requirePermission('contact_messages');
  if (!session) return NextResponse.json({ message: 'Forbidden' }, { status: 403 });

  try {
    const { isRead } = await request.json();
    const updated = await setContactMessageRead(params.id, Boolean(isRead));
    if (!updated) return NextResponse.json({ message: 'Message not found' }, { status: 404 });

    await logActivity({
      adminEmail: session.email,
      action: isRead ? 'contact_message.marked_read' : 'contact_message.marked_unread',
      entity: 'contact_message',
      entityId: params.id,
    });

    return NextResponse.json({ message: updated });
  } catch (err) {
    console.error('[admin contact message update]', err);
    return NextResponse.json({ message: 'Could not update this message.' }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  const session = await requirePermission('contact_messages');
  if (!session) return NextResponse.json({ message: 'Forbidden' }, { status: 403 });

  try {
    await deleteContactMessage(params.id);
    await logActivity({
      adminEmail: session.email,
      action: 'contact_message.deleted',
      entity: 'contact_message',
      entityId: params.id,
    });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[admin contact message delete]', err);
    return NextResponse.json({ message: 'Could not delete this message.' }, { status: 500 });
  }
}
