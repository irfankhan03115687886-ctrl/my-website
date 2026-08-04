import { NextResponse } from 'next/server';
import { requirePermission } from '@/lib/admin';
import {
  bulkDelete,
  bulkSetStatus,
  bulkSetCategory,
  bulkSetBrand,
  bulkAdjustPrice,
  bulkAdjustStock,
} from '@/lib/adminProducts';
import { logActivity } from '@/lib/activityLog';

const VALID_ACTIONS = ['delete', 'status', 'category', 'brand', 'price', 'stock'];

export async function POST(request) {
  const session = await requirePermission('products');
  if (!session) return NextResponse.json({ message: 'You do not have permission to manage products.' }, { status: 403 });

  try {
    const body = await request.json();
    const { action, ids } = body;

    if (!Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ message: 'Select at least one product first.' }, { status: 400 });
    }
    if (!VALID_ACTIONS.includes(action)) {
      return NextResponse.json({ message: 'Unknown bulk action.' }, { status: 400 });
    }

    let count = 0;
    switch (action) {
      case 'delete':
        count = await bulkDelete(ids);
        break;
      case 'status':
        if (!['draft', 'published', 'archived'].includes(body.status)) {
          return NextResponse.json({ message: 'Invalid status.' }, { status: 400 });
        }
        count = await bulkSetStatus(ids, body.status);
        break;
      case 'category':
        count = await bulkSetCategory(ids, { category: body.category, subcategory: body.subcategory });
        break;
      case 'brand':
        count = await bulkSetBrand(ids, body.brand);
        break;
      case 'price':
        if (!body.value || Number(body.value) <= 0) {
          return NextResponse.json({ message: 'Enter a positive amount.' }, { status: 400 });
        }
        count = await bulkAdjustPrice(ids, { mode: body.mode, direction: body.direction, value: body.value });
        break;
      case 'stock':
        if (body.value === undefined || body.value === null || Number(body.value) < 0) {
          return NextResponse.json({ message: 'Enter a valid quantity.' }, { status: 400 });
        }
        count = await bulkAdjustStock(ids, { mode: body.mode, value: body.value });
        break;
    }

    await logActivity({
      adminId: session.id,
      adminEmail: session.email,
      action: `product.bulk_${action}`,
      entity: 'product',
      metadata: { ids, count, ...body },
    });

    return NextResponse.json({ ok: true, count });
  } catch (err) {
    console.error('[admin products bulk]', err);
    return NextResponse.json({ message: 'Could not complete the bulk action. Check DATABASE_URL is set.' }, { status: 500 });
  }
}
