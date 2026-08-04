import { NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import sharp from 'sharp';
import { requirePermission } from '@/lib/admin';
import { addProductImage, getProductIdBySlug } from '@/lib/adminProducts';
import { logActivity } from '@/lib/activityLog';
import { storeUploadedFile } from '@/lib/storage';

// Image storage — uses S3-compatible object storage when configured
// (see lib/storage.js for setup), otherwise local disk for zero-config
// local development. Local disk is NOT durable on serverless hosts (e.g.
// Vercel's filesystem is read-only/ephemeral in production) — set the
// S3_* env vars documented in lib/storage.js before deploying there.
const MAX_BYTES = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/avif'];

export async function POST(request, { params }) {
  const session = await requirePermission('products');
  if (!session) return NextResponse.json({ message: 'You do not have permission to manage products.' }, { status: 403 });

  const productId = await getProductIdBySlug(params.slug);
  if (!productId) return NextResponse.json({ message: 'Product not found.' }, { status: 404 });

  try {
    const formData = await request.formData();
    const file = formData.get('file');
    if (!file || typeof file === 'string') {
      return NextResponse.json({ message: 'No file uploaded' }, { status: 400 });
    }
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json({ message: 'Only JPEG, PNG, WebP, or AVIF images are allowed.' }, { status: 400 });
    }
    if (file.size > MAX_BYTES) {
      return NextResponse.json({ message: 'Image must be under 5MB.' }, { status: 400 });
    }

    const bytes = Buffer.from(await file.arrayBuffer());
    const ext = file.type.split('/')[1];
    const filename = `${randomUUID()}.${ext}`;

    // Resize down (never up) to a sane max width and re-encode at a
    // reasonable quality — keeps the original format, just keeps file
    // sizes reasonable for product photography uploaded straight from a
    // phone/camera. If sharp can't process a given file for any reason,
    // fall back to storing the original bytes untouched rather than
    // failing the whole upload.
    let outputBytes = bytes;
    try {
      const pipeline = sharp(bytes).resize({ width: 1600, withoutEnlargement: true });
      if (file.type === 'image/jpeg') outputBytes = await pipeline.jpeg({ quality: 82 }).toBuffer();
      else if (file.type === 'image/png') outputBytes = await pipeline.png({ compressionLevel: 8 }).toBuffer();
      else if (file.type === 'image/webp') outputBytes = await pipeline.webp({ quality: 82 }).toBuffer();
      else outputBytes = await pipeline.toBuffer();
    } catch (compressionErr) {
      console.error('[image compression] falling back to original file', compressionErr.message);
    }

    const url = await storeUploadedFile(outputBytes, filename);
    const image = await addProductImage(productId, { url, altText: formData.get('altText') || null });

    await logActivity({
      adminId: session.id,
      adminEmail: session.email,
      action: 'product.image_uploaded',
      entity: 'product',
      entityId: productId,
      metadata: { url },
    });

    return NextResponse.json({ ok: true, image });
  } catch (err) {
    console.error('[admin product image upload]', err);
    return NextResponse.json({ message: 'Could not upload image. Check DATABASE_URL is set.' }, { status: 500 });
  }
}
