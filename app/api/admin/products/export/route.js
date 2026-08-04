import { NextResponse } from 'next/server';
import { requirePermission } from '@/lib/admin';
import { exportProductsCSV } from '@/lib/adminProducts';
import { logActivity } from '@/lib/activityLog';

export async function GET() {
  const session = await requirePermission('products');
  if (!session) return NextResponse.json({ message: 'You do not have permission to manage products.' }, { status: 403 });

  try {
    const csv = await exportProductsCSV();
    await logActivity({
      adminId: session.id,
      adminEmail: session.email,
      action: 'product.exported',
      entity: 'product',
    });
    return new NextResponse(csv, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="products-${new Date().toISOString().slice(0, 10)}.csv"`,
      },
    });
  } catch (err) {
    console.error('[admin products export]', err);
    return NextResponse.json({ message: 'Could not export products. Check DATABASE_URL is set.' }, { status: 500 });
  }
}
