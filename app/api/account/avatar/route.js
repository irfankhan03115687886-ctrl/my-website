import { NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import { getSession } from '@/lib/auth';
import { query } from '@/lib/db';
import { storeUploadedFile } from '@/lib/storage';

const MAX_BYTES = 3 * 1024 * 1024; // 3MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

export async function POST(request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ message: 'Sign in required' }, { status: 401 });

  try {
    const formData = await request.formData();
    const file = formData.get('file');
    if (!file || typeof file === 'string') {
      return NextResponse.json({ message: 'No file uploaded' }, { status: 400 });
    }
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json({ message: 'Only JPEG, PNG, or WebP images are allowed.' }, { status: 400 });
    }
    if (file.size > MAX_BYTES) {
      return NextResponse.json({ message: 'Image must be under 3MB.' }, { status: 400 });
    }

    const bytes = Buffer.from(await file.arrayBuffer());
    const ext = file.type.split('/')[1];
    const filename = `${randomUUID()}.${ext}`;
    const url = await storeUploadedFile(bytes, filename, 'avatars');

    await query('update users set avatar_url = $2 where id = $1', [session.id, url]);

    return NextResponse.json({ ok: true, url });
  } catch (err) {
    console.error('[avatar upload]', err);
    return NextResponse.json({ message: 'Could not upload image.' }, { status: 500 });
  }
}
