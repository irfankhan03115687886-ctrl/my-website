import { NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import { getSuperAdminSession } from '@/lib/admin';
import { storeUploadedFile } from '@/lib/storage';

const MAX_BYTES = 6 * 1024 * 1024; // 6MB — hero images run larger than product thumbnails
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/avif'];

export async function POST(request) {
  const { deniedReason } = await getSuperAdminSession();
  if (deniedReason) return NextResponse.json({ message: 'Super Admin access required.' }, { status: 403 });

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
      return NextResponse.json({ message: 'Image must be under 6MB.' }, { status: 400 });
    }

    const bytes = Buffer.from(await file.arrayBuffer());
    const ext = file.type.split('/')[1];
    const filename = `${randomUUID()}.${ext}`;
    const url = await storeUploadedFile(bytes, filename, 'hero');

    return NextResponse.json({ ok: true, url });
  } catch (err) {
    console.error('[dashboard hero image upload]', err);
    return NextResponse.json({ message: 'Could not upload image.' }, { status: 500 });
  }
}
