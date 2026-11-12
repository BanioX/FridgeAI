import type { ReactNode } from 'react';

/**
 * A receipt photo taken on Start travels to «Quittung hochladen» (Alban, 12.11.2026): the camera
 * opens on the tap on Start, and the receipt page reads the photo when it opens. It stays in memory
 * for that one step only; nothing is stored.
 */
let handedOver: readonly File[] = [];

export function handOverReceiptPhotos(files: readonly File[]): void {
  handedOver = files;
}

/** The photos taken on Start, once: a second call returns none. */
export function takeReceiptPhotos(): readonly File[] {
  const files = handedOver;
  handedOver = [];
  return files;
}

/**
 * «Foto aufnehmen»: opens the back camera straight away. The camera only starts on this tap; a
 * device without camera offers its file picker instead, so the way still leads somewhere.
 */
export function ReceiptPhotoInput({
  className,
  disabled = false,
  onPhotos,
  children,
}: {
  className: string;
  disabled?: boolean;
  onPhotos: (files: File[]) => void;
  children: ReactNode;
}) {
  return (
    <label
      className={`cursor-pointer has-disabled:cursor-not-allowed has-disabled:opacity-50 has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-basil-600 ${className}`}
    >
      {children}
      <input
        type="file"
        accept="image/*"
        capture="environment"
        disabled={disabled}
        className="sr-only"
        onChange={(event) => {
          const files = [...(event.target.files ?? [])];
          event.target.value = '';
          if (files.length > 0) {
            onPhotos(files);
          }
        }}
      />
    </label>
  );
}
