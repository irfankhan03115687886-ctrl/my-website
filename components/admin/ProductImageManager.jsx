'use client';

import { useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Star, Trash2, ArrowLeft, ArrowRight, Upload, X } from 'lucide-react';
import clsx from 'clsx';

const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/avif'];
const MAX_BYTES = 5 * 1024 * 1024;

// Uploads one file via XHR (not fetch) so we get real upload-progress
// events to drive the progress bar — fetch has no upload progress API.
function uploadWithProgress(url, file, onProgress) {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    const formData = new FormData();
    formData.append('file', file);

    xhr.upload.addEventListener('progress', (e) => {
      if (e.lengthComputable) onProgress(Math.round((e.loaded / e.total) * 100));
    });
    xhr.addEventListener('load', () => {
      try {
        const data = JSON.parse(xhr.responseText || '{}');
        if (xhr.status >= 200 && xhr.status < 300) resolve(data);
        else reject(new Error(data.message || `Upload failed (${xhr.status})`));
      } catch {
        reject(new Error('Upload failed — unexpected response.'));
      }
    });
    xhr.addEventListener('error', () => reject(new Error('Upload failed — network error.')));

    xhr.open('POST', url);
    xhr.send(formData);
  });
}

export default function ProductImageManager({ slug, images }) {
  const router = useRouter();
  const fileInputRef = useRef(null);
  const [pending, setPending] = useState([]); // [{ id, file, previewUrl, progress, error }]
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState('');

  function validateFile(file) {
    if (!ACCEPTED_TYPES.includes(file.type)) return 'Only JPEG, PNG, WebP, or AVIF images are allowed.';
    if (file.size > MAX_BYTES) return 'Image must be under 5MB.';
    return null;
  }

  async function uploadFiles(files) {
    setError('');
    const validFiles = [];
    for (const file of files) {
      const validationError = validateFile(file);
      if (validationError) {
        setError(validationError);
        continue;
      }
      validFiles.push(file);
    }
    if (validFiles.length === 0) return;

    const items = validFiles.map((file) => ({
      id: `${file.name}-${file.size}-${Date.now()}-${Math.random()}`,
      file,
      previewUrl: URL.createObjectURL(file),
      progress: 0,
      error: null,
    }));
    setPending((prev) => [...prev, ...items]);

    await Promise.all(
      items.map(async (item) => {
        try {
          await uploadWithProgress(`/api/admin/products/${slug}/images`, item.file, (progress) => {
            setPending((prev) => prev.map((p) => (p.id === item.id ? { ...p, progress } : p)));
          });
          setPending((prev) => prev.filter((p) => p.id !== item.id));
          URL.revokeObjectURL(item.previewUrl);
        } catch (err) {
          setPending((prev) => prev.map((p) => (p.id === item.id ? { ...p, error: err.message } : p)));
        }
      })
    );
    router.refresh();
  }

  function handleFileInput(e) {
    const files = Array.from(e.target.files || []);
    uploadFiles(files);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  const handleDrop = useCallback(
    (e) => {
      e.preventDefault();
      setDragActive(false);
      const files = Array.from(e.dataTransfer.files || []);
      uploadFiles(files);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [slug]
  );

  function dismissFailedUpload(id) {
    setPending((prev) => prev.filter((p) => p.id !== id));
  }

  async function handleAction(imageId, body) {
    await fetch(`/api/admin/products/${slug}/images/${imageId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    router.refresh();
  }

  async function handleDelete(imageId) {
    if (!confirm('Delete this image? This cannot be undone.')) return;
    await fetch(`/api/admin/products/${slug}/images/${imageId}`, { method: 'DELETE' });
    router.refresh();
  }

  return (
    <div>
      <label
        onDragOver={(e) => {
          e.preventDefault();
          setDragActive(true);
        }}
        onDragLeave={() => setDragActive(false)}
        onDrop={handleDrop}
        className={clsx(
          'flex w-full cursor-pointer flex-col items-center justify-center gap-2 rounded-md border border-dashed px-4 py-8 text-center text-sm transition-colors',
          dragActive ? 'border-brass bg-brass/5 text-ink' : 'border-brass/30 text-ink/60 hover:border-brass/60 hover:text-ink'
        )}
      >
        <Upload size={20} />
        <span>
          Drag and drop images here, or <span className="underline">click to browse</span>
        </span>
        <span className="text-xs text-ink/40">JPEG, PNG, WebP, or AVIF — max 5MB each, multiple files supported</span>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/avif"
          multiple
          onChange={handleFileInput}
          className="hidden"
        />
      </label>
      {error && <p className="mt-2 text-xs text-ember">{error}</p>}

      {(pending.length > 0 || images.length > 0) && (
        <div className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-4">
          {pending.map((item) => (
            <div key={item.id} className="overflow-hidden rounded-md border border-ink/10">
              <div className="relative aspect-square bg-ink/5">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={item.previewUrl} alt="" className="h-full w-full object-cover opacity-70" />
                {!item.error ? (
                  <div className="absolute inset-x-0 bottom-0 bg-ink/70 px-2 py-1.5">
                    <div className="h-1 overflow-hidden rounded-full bg-cream/20">
                      <div className="h-full bg-brass transition-all duration-200" style={{ width: `${item.progress}%` }} />
                    </div>
                    <p className="mt-1 font-mono text-[9px] uppercase tracking-wide text-cream/80">Uploading {item.progress}%</p>
                  </div>
                ) : (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-1.5 bg-ink/85 p-2 text-center">
                    <p className="font-mono text-[9px] uppercase tracking-wide text-ember">{item.error}</p>
                    <button onClick={() => dismissFailedUpload(item.id)} className="rounded-full bg-cream/10 p-1 text-cream hover:bg-cream/20">
                      <X size={12} />
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}

          {images.map((img, i) => (
            <div key={img.id} className="overflow-hidden rounded-md border border-ink/10">
              <div className="relative aspect-square bg-ink/5">
                <Image src={img.url} alt={img.alt_text || ''} fill className="object-cover" />
                {img.is_primary && (
                  <span className="absolute left-1.5 top-1.5 rounded-full bg-brass px-2 py-0.5 font-mono text-[9px] uppercase text-ink">
                    Primary
                  </span>
                )}
              </div>
              <div className="flex items-center justify-between px-2 py-1.5">
                <div className="flex gap-1.5">
                  <button
                    onClick={() => handleAction(img.id, { action: 'reorder', direction: 'up' })}
                    disabled={i === 0}
                    aria-label="Move earlier"
                    className="text-ink/30 hover:text-ink disabled:opacity-20"
                  >
                    <ArrowLeft size={13} />
                  </button>
                  <button
                    onClick={() => handleAction(img.id, { action: 'reorder', direction: 'down' })}
                    disabled={i === images.length - 1}
                    aria-label="Move later"
                    className="text-ink/30 hover:text-ink disabled:opacity-20"
                  >
                    <ArrowRight size={13} />
                  </button>
                </div>
                <div className="flex gap-1.5">
                  <button
                    onClick={() => handleAction(img.id, { action: 'setPrimary' })}
                    aria-label="Set as primary"
                    className={clsx('hover:text-brass', img.is_primary ? 'text-brass' : 'text-ink/30')}
                  >
                    <Star size={13} fill={img.is_primary ? 'currentColor' : 'none'} />
                  </button>
                  <button onClick={() => handleDelete(img.id)} aria-label="Delete image" className="text-ink/30 hover:text-ember">
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {pending.length === 0 && images.length === 0 && (
        <p className="mt-4 text-sm text-ink/50">No images yet — the product will show a placeholder until you add one.</p>
      )}
    </div>
  );
}
