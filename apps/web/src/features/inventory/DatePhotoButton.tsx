import {
  formatSwissDate,
  parseExpiryFromText,
  type ExpiryFromText,
  type LocalDate,
} from '@fridgeai/core';
import { Camera } from 'lucide-react';
import { useState } from 'react';
import { messages } from '../../app/messages.de-CH';

const t = messages.addItem.datePhoto;
const MAX_BYTES = 15 * 1024 * 1024;

interface DatePhotoButtonProps {
  today: LocalDate;
  /** The date that was read from the photo. */
  onRead: (result: ExpiryFromText) => void;
  /** What the person should hear; empty clears it. */
  onStatus: (text: string) => void;
}

/**
 * «Datum fotografieren» (ADR-0062): a photo of the printed date is read on the device, the picture
 * is neither stored nor sent anywhere. The camera opens only after the tap; the gallery works too.
 */
export function DatePhotoButton({ today, onRead, onStatus }: DatePhotoButtonProps) {
  const [busy, setBusy] = useState(false);

  async function read(file: File) {
    if (file.size > MAX_BYTES) {
      onStatus(t.failed);
      return;
    }
    setBusy(true);
    onStatus(t.reading);
    try {
      const { readImageText } = await import('../receipts/read-image');
      const found = parseExpiryFromText(await readImageText(file, { mode: 'sparse' }), today);
      if (found === null) {
        onStatus(t.notFound);
      } else {
        onRead(found);
        onStatus(t.found(formatSwissDate(found.date)));
      }
    } catch {
      onStatus(t.failed);
    } finally {
      setBusy(false);
    }
  }

  return (
    <label className="relative inline-flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-xl border border-line bg-surface px-4 text-sm font-semibold text-ink transition-colors hover:bg-surface-muted has-disabled:cursor-not-allowed has-disabled:opacity-50 has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-basil-600">
      <Camera size={20} aria-hidden="true" />
      {t.choose}
      <input
        type="file"
        accept="image/*"
        capture="environment"
        disabled={busy}
        className="sr-only"
        onChange={(event) => {
          const file = event.target.files?.[0];
          event.target.value = '';
          if (file !== undefined) {
            void read(file);
          }
        }}
      />
    </label>
  );
}
