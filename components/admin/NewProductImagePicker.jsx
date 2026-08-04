'use client';

import { useRef, useState, useCallback } from 'react';
import { ArrowLeft, ArrowRight, Star, Trash2, Upload } from 'lucide-react';
import clsx from 'clsx';

const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/avif'];
const MAX_BYTES = 5 * 1024 * 1024;

// Staged, local-only image picker for the Create Product page. Nothing is
// uploaded here — files just sit in memory with object-URL previews until
// the product is actually created, at which point ProductForm uploads
// them in order (see handleSubmit). The first image in the list is always
// the primary photo, same convention the backend already uses for the
// first image uploaded to a product (see lib/adminProducts.js
// addProductImage), so "move to first" doubles as "set as primary" —
// consistent with the reorder-based primary picker on the Edit page.
export default function NewProductImagePicker({ images, onChange }) {
  const fileInputRef = useRef(null);
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState('');

  function validateFile(file) {
    if (!ACCEPTED_TYPES.includes(file.type)) return 'Only JPEG, PNG, WebP, or AVIF images are allowed.';
    if (file.size > MAX_BYTES) return 'Image must be under 5MB.';
    return null;
  }

  function addFiles(fileList) {
    setError('');
    const files = Array.from(fileList || []);
    const accepted = [];
    for (const file of files) {
      const validationError = validateFile(file);
      if (validationError) {
        setError(validationError);
        continue;
      }
      accepted.push({
        id: `${file.name}-${file.size}-${Date.now()}-${Math.random()}`,
        file,
        previewUrl: URL.createObjectURL(file),
      });
    }
    if (accepted.length > 0) onChange([...images, ...accepted]);
  }

  function handleFileInput(e) {
    addFiles(e.target.files);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  const handleDrop = useCallback(
    (e) => {
      e.preventDefault();
      setDragActive(false);
      addFiles(e.dataTransfer.files);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [images]
  );

  function removeAt(index) {
    const item = images[index];
    if (item) URL.revokeObjectURL(item.previewUrl);
    onChange(images.filter((_, i) => i !== index));
  }

  function move(index, direction) {
    const swapWith = direction === 'up' ? index - 1 : index + 1;
    if (swapWith < 0 || swapWith >= images.length) return;
    const next = [...images];
    [next[index], next[swapWith]] = [next[swapWith], next[index]];
    onChange(next);
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

      {images.length > 0 && (
        <div className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-4">
          {images.map((img, i) => (
            <div key={img.id} className="overflow-hidden rounded-md border border-ink/10">
              <div className="relative aspect-square bg-ink/5">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={img.previewUrl} alt="" className="h-full w-full object-cover" />
                {i === 0 && (
                  <span className="absolute left-1.5 top-1.5 flex items-center gap-1 rounded-full bg-brass px-2 py-0.5 font-mono text-[9px] uppercase text-ink">
                    <Star size={9} fill="currentColor" /> Primary
                  </span>
                )}
              </div>
              <div className="flex items-center justify-between px-2 py-1.5">
                <div className="flex gap-1.5">
                  <button
                    type="button"
                    onClick={() => move(i, 'up')}
                    disabled={i === 0}
                    aria-label="Move earlier"
                    className="text-ink/30 hover:text-ink disabled:opacity-20"
                  >
                    <ArrowLeft size={13} />
                  </button>
                  <button
                    type="button"
                    onClick={() => move(i, 'down')}
                    disabled={i === images.length - 1}
                    aria-label="Move later"
                    className="text-ink/30 hover:text-ink disabled:opacity-20"
                  >
                    <ArrowRight size={13} />
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => removeAt(i)}
                  aria-label="Remove image"
                  className="text-ink/30 hover:text-ember"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {images.length === 0 && (
        <p className="mt-4 text-sm text-ink/50">
          No images yet — add at least one so the product doesn't show a placeholder. The first photo becomes the primary image;
          reorder with the arrows to change it.
        </p>
      )}
    </div>
  );
}
