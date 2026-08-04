import { NextResponse } from 'next/server';
import { getSuperAdminSession } from '@/lib/admin';
import { createBrand } from '@/lib/brands';
import { logActivity } from '@/lib/activityLog';
import { isSafeImageUrl } from '@/lib/validateImageUrl';

export async function POST(request) {
  const { session, deniedReason } = await getSuperAdminSession();
  if (deniedReason) return NextResponse.json({ message: 'Super Admin access required.' }, { status: 403 });

  try {
    const { name, logoUrl } = await request.json();
    if (!name?.trim()) {
      return NextResponse.json({ message: 'Brand name is required.' }, { status: 400 });
    }
    if (!isSafeImageUrl(logoUrl)) {
      return NextResponse.json({ message: 'That logo URL is not allowed.' }, { status: 400 });
    }
    const brand = await createBrand({ name: name.trim(), logoUrl });
    await logActivity({
      adminId: session.id,
      adminEmail: session.email,
      action: 'brand.created',
      entity: 'brand',
      entityId: brand.id,
      metadata: { name: brand.name },
    });
    return NextResponse.json({ ok: true, brand });
  } catch (err) {
    console.error('[dashboard brands create]', err);
    if (String(err.message || '').includes('duplicate key')) {
      return NextResponse.json({ message: 'A brand with that name already exists.' }, { status: 409 });
    }
    return NextResponse.json({ message: 'Could not create brand. Check DATABASE_URL is set.' }, { status: 500 });
  }
}
