import { Camera } from 'lucide-react';
import { useId, useState, type ChangeEvent } from 'react';
import { messages } from '../../app/messages.de-CH';
import { downscalePhoto, PhotoError } from './photo';

/**
 * «Foto aufnehmen»: a button-looking label around a file input. The camera opens only after the
 * tap (`capture`); if it is denied or missing, the browser offers the photo picker instead. The
 * photo is shrunk on the device and handed on as data URL; nothing is sent anywhere (ADR-0056).
 */
export function PhotoPicker({
  label,
  onPhoto,
  disabled = false,
}: {
  label: string;
  onPhoto: (dataUrl: string) => void;
  disabled?: boolean;
}) {
  const id = useId();
  const [error, setError] = useState('');

  async function choose(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (file === undefined) {
      return;
    }
    setError('');
    try {
      onPhoto(await downscalePhoto(file));
    } catch (failure) {
      setError(
        messages.spots.photoErrors[failure instanceof PhotoError ? failure.code : 'unreadable'],
      );
    }
  }

  return (
    <div>
      <label
        htmlFor={id}
        className={`inline-flex min-h-12 w-full cursor-pointer items-center justify-center gap-2 rounded-xl border border-line bg-surface px-5 font-semibold text-ink transition-colors focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-basil-600 hover:bg-surface-muted ${
          disabled ? 'pointer-events-none opacity-50' : ''
        }`}
      >
        <Camera size={20} aria-hidden="true" />
        {label}
        <input
          id={id}
          type="file"
          accept="image/*"
          capture="environment"
          disabled={disabled}
          className="sr-only"
          onChange={(event) => {
            void choose(event);
          }}
        />
      </label>
      <p role="alert" className="mt-1 text-sm text-today empty:hidden">
        {error}
      </p>
    </div>
  );
}
