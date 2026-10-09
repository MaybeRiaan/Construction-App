import type { PhotoAsset, PhotoSource } from './photo';

/**
 * Web: a hidden file input. On phones `capture` opens the camera; on desktop
 * it is a file chooser. Must be called straight from a tap handler so the
 * browser allows the picker to open.
 */
export function pickPhoto(source: PhotoSource): Promise<PhotoAsset | null> {
  return new Promise((resolve, reject) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    if (source === 'camera') input.setAttribute('capture', 'environment');
    input.style.position = 'fixed';
    input.style.left = '-1000px';
    let settled = false;
    const done = (v: PhotoAsset | null, err?: unknown) => {
      if (settled) return;
      settled = true;
      input.remove();
      if (err) reject(err);
      else resolve(v);
    };
    input.addEventListener('change', async () => {
      const file = input.files?.[0];
      if (!file) return done(null);
      try {
        done(await process(file));
      } catch (e) {
        done(null, e);
      }
    });
    input.addEventListener('cancel', () => done(null));
    document.body.appendChild(input);
    input.click();
  });
}

async function loadImage(file: File): Promise<HTMLImageElement> {
  const url = URL.createObjectURL(file);
  const img = new Image();
  img.src = url;
  try {
    await img.decode();
  } catch {
    URL.revokeObjectURL(url);
    throw new Error('unreadable');
  }
  return img;
}

function draw(img: HTMLImageElement, max: number): HTMLCanvasElement {
  const scale = Math.min(1, max / Math.max(img.naturalWidth, img.naturalHeight));
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(img.naturalWidth * scale));
  canvas.height = Math.max(1, Math.round(img.naturalHeight * scale));
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('unreadable');
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  return canvas;
}

async function process(file: File): Promise<PhotoAsset> {
  const img = await loadImage(file);
  const thumb = draw(img, 320).toDataURL('image/jpeg', 0.62);
  const big = draw(img, 1024);
  const aiBlob = await new Promise<Blob | undefined>((res) => big.toBlob((b) => res(b ?? undefined), 'image/jpeg', 0.82));
  return { uri: img.src, thumb, width: img.naturalWidth, height: img.naturalHeight, aiBlob };
}
