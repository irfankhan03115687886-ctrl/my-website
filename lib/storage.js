// lib/storage.js
//
// Image storage, production-ready. Local disk writes (public/uploads/...)
// only work when the app runs on a server with a persistent, writable
// filesystem — they silently fail or don't persist on serverless hosts
// like Vercel, where the filesystem is read-only/ephemeral at runtime.
//
// This module uploads to S3-compatible object storage instead, whenever
// it's configured — and that covers far more than just AWS: Cloudflare
// R2, DigitalOcean Spaces, Backblaze B2, MinIO, and Supabase Storage all
// speak the same S3 API, so this one integration works with whichever of
// those you already have an account with. If no storage env vars are
// set, it transparently falls back to local disk — so local dev with
// `npm run dev` keeps working with zero config, exactly as before.
//
// ---------------------------------------------------------------------
// Setup (pick ONE — whichever object storage you already have):
//
//   AWS S3:
//     S3_BUCKET=your-bucket-name
//     S3_REGION=us-east-1
//     S3_ACCESS_KEY_ID=...
//     S3_SECRET_ACCESS_KEY=...
//     (S3_PUBLIC_URL_BASE is optional — auto-derived for AWS)
//
//   Cloudflare R2:
//     S3_BUCKET=your-bucket-name
//     S3_REGION=auto
//     S3_ACCESS_KEY_ID=...
//     S3_SECRET_ACCESS_KEY=...
//     S3_ENDPOINT=https://<account-id>.r2.cloudflarestorage.com
//     S3_PUBLIC_URL_BASE=https://<your-r2-public-bucket-domain>
//
//   DigitalOcean Spaces / Backblaze B2 / MinIO: same shape as R2 — set
//   S3_ENDPOINT to that provider's endpoint and S3_PUBLIC_URL_BASE to
//   wherever the bucket is served from publicly.
//
// The bucket (or the object prefix you upload to) needs to be
// configured for public read access — these are product photos meant
// to show up on the storefront, not private files.
// ---------------------------------------------------------------------

import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { writeFile, mkdir, unlink } from 'fs/promises';
import path from 'path';

const BUCKET = process.env.S3_BUCKET;
const REGION = process.env.S3_REGION || 'auto';
const ACCESS_KEY_ID = process.env.S3_ACCESS_KEY_ID;
const SECRET_ACCESS_KEY = process.env.S3_SECRET_ACCESS_KEY;
const ENDPOINT = process.env.S3_ENDPOINT; // omit for real AWS S3, required for R2/Spaces/B2/MinIO
const PUBLIC_URL_BASE = process.env.S3_PUBLIC_URL_BASE; // e.g. https://cdn.yourdomain.com

export const isCloudStorageConfigured = Boolean(BUCKET && ACCESS_KEY_ID && SECRET_ACCESS_KEY);

let cachedClient = null;
function getClient() {
  if (!cachedClient) {
    cachedClient = new S3Client({
      region: REGION,
      endpoint: ENDPOINT || undefined,
      forcePathStyle: Boolean(ENDPOINT), // most non-AWS S3-compatible providers need path-style URLs
      credentials: { accessKeyId: ACCESS_KEY_ID, secretAccessKey: SECRET_ACCESS_KEY },
    });
  }
  return cachedClient;
}

function publicUrlFor(key) {
  if (PUBLIC_URL_BASE) return `${PUBLIC_URL_BASE.replace(/\/$/, '')}/${key}`;
  if (ENDPOINT) return `${ENDPOINT.replace(/\/$/, '')}/${BUCKET}/${key}`;
  // Real AWS S3 default virtual-hosted-style URL.
  return `https://${BUCKET}.s3.${REGION}.amazonaws.com/${key}`;
}

/**
 * Stores an uploaded file (as bytes) and returns its public URL.
 * Uses S3-compatible storage if configured, otherwise local disk.
 * `folder` groups uploads by purpose (e.g. 'products', 'avatars', 'hero').
 */
export async function storeUploadedFile(bytes, filename, folder = 'products') {
  const key = `${folder}/${filename}`;

  if (isCloudStorageConfigured) {
    const contentType = filename.endsWith('.png')
      ? 'image/png'
      : filename.endsWith('.webp')
      ? 'image/webp'
      : filename.endsWith('.avif')
      ? 'image/avif'
      : 'image/jpeg';

    await getClient().send(
      new PutObjectCommand({
        Bucket: BUCKET,
        Key: key,
        Body: bytes,
        ContentType: contentType,
        CacheControl: 'public, max-age=31536000, immutable',
      })
    );
    return publicUrlFor(key);
  }

  // Local disk fallback — fine for local dev or a traditional VPS with a
  // persistent filesystem; NOT durable on serverless hosts (Vercel etc).
  const uploadDir = path.join(process.cwd(), 'public', 'uploads', folder);
  await mkdir(uploadDir, { recursive: true });
  await writeFile(path.join(uploadDir, filename), bytes);
  return `/uploads/${folder}/${filename}`;
}

/**
 * Deletes a previously-stored file, given the public URL that
 * storeUploadedFile returned for it. Best-effort — a delete failure here
 * shouldn't block removing the database row, so callers should not let
 * this throw stop the rest of the deletion.
 */
export async function deleteStoredFile(url) {
  try {
    if (isCloudStorageConfigured && (url.includes('/products/') || url.includes('/avatars/') || url.includes('/hero/'))) {
      const folder = ['products', 'avatars', 'hero'].find((f) => url.includes(`/${f}/`));
      const key = `${folder}/${url.split(`/${folder}/`).pop()}`;
      await getClient().send(new DeleteObjectCommand({ Bucket: BUCKET, Key: key }));
    } else if (url.startsWith('/uploads/')) {
      const filePath = path.join(process.cwd(), 'public', url);
      await unlink(filePath);
    }
  } catch (err) {
    console.error('[storage] could not delete file (continuing anyway):', err.message);
  }
}
