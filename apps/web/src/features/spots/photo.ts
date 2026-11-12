/** Longest side of a spot photo, in pixels (ADR-0056). */
export const PHOTO_MAX_SIDE = 1280;
/** JPEG quality first tried; lower ones follow if the photo is still too large. */
export const PHOTO_QUALITIES = [0.72, 0.55, 0.4] as const;
/** What the contract accepts (`SPOT_PHOTO_MAX_CHARS` in core), kept here to stay below it. */
export const PHOTO_MAX_CHARS = 450_000;

export type PhotoErrorCode = 'not_image' | 'unreadable' | 'too_big';

export class PhotoError extends Error {
  readonly code: PhotoErrorCode;

  constructor(code: PhotoErrorCode) {
    super(code);
    this.name = 'PhotoError';
    this.code = code;
  }
}

/** The size a photo gets: its longest side at most `max`, same proportions, never enlarged. */
export function fitWithin(
  width: number,
  height: number,
  max = PHOTO_MAX_SIDE,
): { width: number; height: number } {
  const longest = Math.max(width, height);
  if (longest <= max) {
    return { width: Math.max(1, Math.round(width)), height: Math.max(1, Math.round(height)) };
  }
  const scale = max / longest;
  return {
    width: Math.max(1, Math.round(width * scale)),
    height: Math.max(1, Math.round(height * scale)),
  };
}

/**
 * Shrinks a picked or taken photo for storage on the device: JPEG, longest side 1280 px, quality
 * 0.72 (lower if it is still too large). Upright according to EXIF. The photo never leaves the
 * device. A file that is no image throws `PhotoError('not_image')`.
 */
export async function downscalePhoto(file: Blob): Promise<string> {
  if (!file.type.startsWith('image/')) {
    throw new PhotoError('not_image');
  }
  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' });
  } catch {
    throw new PhotoError('unreadable');
  }
  try {
    const size = fitWithin(bitmap.width, bitmap.height);
    const canvas = document.createElement('canvas');
    canvas.width = size.width;
    canvas.height = size.height;
    const context = canvas.getContext('2d');
    if (context === null) {
      throw new PhotoError('unreadable');
    }
    // JPEG has no transparency: a PNG with a see-through background would turn black.
    context.fillStyle = '#ffffff';
    context.fillRect(0, 0, size.width, size.height);
    context.imageSmoothingQuality = 'high';
    context.drawImage(bitmap, 0, 0, size.width, size.height);
    for (const quality of PHOTO_QUALITIES) {
      const dataUrl = canvas.toDataURL('image/jpeg', quality);
      if (dataUrl.startsWith('data:image/jpeg;base64,') && dataUrl.length <= PHOTO_MAX_CHARS) {
        return dataUrl;
      }
    }
    throw new PhotoError('too_big');
  } finally {
    bitmap.close();
  }
}
