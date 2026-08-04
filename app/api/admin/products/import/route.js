import { NextResponse } from 'next/server';
import Papa from 'papaparse';
import { requirePermission } from '@/lib/admin';
import { importProductsFromRows, previewImportRows } from '@/lib/adminProducts';
import { logActivity } from '@/lib/activityLog';

export async function POST(request) {
  const session = await requirePermission('products');
  if (!session) return NextResponse.json({ message: 'You do not have permission to manage products.' }, { status: 403 });

  try {
    const formData = await request.formData();
    const file = formData.get('file');
    if (!file || typeof file === 'string') {
      return NextResponse.json({ message: 'No CSV file uploaded.' }, { status: 400 });
    }

    const text = await file.text();
    const parsed = Papa.parse(text, { header: true, skipEmptyLines: true, transformHeader: (h) => h.trim() });

    if (parsed.errors?.length) {
      return NextResponse.json({ message: `Could not parse CSV: ${parsed.errors[0].message}` }, { status: 400 });
    }
    if (!parsed.data?.length) {
      return NextResponse.json({ message: 'That CSV has no rows.' }, { status: 400 });
    }

    // Preview mode: validate everything (including in-file duplicate
    // slugs/SKUs and conflicts with existing products) without writing
    // anything to the database, so the admin can review before committing.
    if (formData.get('dryRun') === 'true') {
      const preview = await previewImportRows(parsed.data);
      return NextResponse.json({ ok: true, preview });
    }

    const report = await importProductsFromRows(parsed.data);

    await logActivity({
      adminId: session.id,
      adminEmail: session.email,
      action: 'product.imported',
      entity: 'product',
      metadata: { created: report.created, updated: report.updated, errorCount: report.errors.length },
    });

    return NextResponse.json({ ok: true, report });
  } catch (err) {
    console.error('[admin products import]', err);
    return NextResponse.json({ message: 'Could not import products. Check DATABASE_URL is set.' }, { status: 500 });
  }
}
