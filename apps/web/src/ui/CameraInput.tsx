import type { ReactNode } from 'react';

/**
 * «Foto aufnehmen»: opens the back camera straight away. The camera only starts on this tap; a
 * device without camera offers its file picker instead, so the way still leads somewhere.
 */
export function CameraInput({
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
