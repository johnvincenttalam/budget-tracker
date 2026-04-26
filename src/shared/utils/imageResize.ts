const MAX_INPUT_BYTES = 2 * 1024 * 1024; // 2MB
const MAX_OUTPUT_CHARS = 14 * 1024; // ~10KB binary after base64 expansion
const TARGET_SIZE = 64;

export type ResizeError =
  | 'too-large'
  | 'not-image'
  | 'load-failed'
  | 'encode-failed'
  | 'output-too-large';

export class ImageResizeError extends Error {
  code: ResizeError;
  constructor(code: ResizeError, message: string) {
    super(message);
    this.code = code;
  }
}

function readAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new ImageResizeError('load-failed', 'Could not read file'));
    reader.readAsDataURL(file);
  });
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new ImageResizeError('load-failed', 'Could not decode image'));
    img.src = src;
  });
}

/**
 * Resize an image File to a square WebP data URL suitable for inline storage.
 * Cover-fits (centered crop) so logos stay readable as squares.
 */
export async function resizeImageToWebP(file: File): Promise<string> {
  if (!file.type.startsWith('image/')) {
    throw new ImageResizeError('not-image', 'Pick an image file');
  }
  if (file.size > MAX_INPUT_BYTES) {
    throw new ImageResizeError('too-large', 'Image must be under 2MB');
  }

  const dataUrl = await readAsDataUrl(file);
  const img = await loadImage(dataUrl);

  const canvas = document.createElement('canvas');
  canvas.width = TARGET_SIZE;
  canvas.height = TARGET_SIZE;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new ImageResizeError('encode-failed', 'Canvas unavailable');
  }

  // Cover-fit centered crop
  const scale = Math.max(TARGET_SIZE / img.width, TARGET_SIZE / img.height);
  const drawW = img.width * scale;
  const drawH = img.height * scale;
  const dx = (TARGET_SIZE - drawW) / 2;
  const dy = (TARGET_SIZE - drawH) / 2;
  ctx.drawImage(img, dx, dy, drawW, drawH);

  // Try WebP at descending quality; some inputs (large color palettes) won't compress
  // small enough at the default. PNG fallback as last resort.
  for (const q of [0.85, 0.7, 0.55, 0.4]) {
    const out = canvas.toDataURL('image/webp', q);
    if (out.startsWith('data:image/webp') && out.length <= MAX_OUTPUT_CHARS) {
      return out;
    }
  }
  const png = canvas.toDataURL('image/png');
  if (png.length <= MAX_OUTPUT_CHARS) return png;

  throw new ImageResizeError('output-too-large', 'Could not compress image small enough');
}
