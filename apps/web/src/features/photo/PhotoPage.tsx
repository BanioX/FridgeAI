import { Camera, ImageUp } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { useAppData } from '../../app/AppData';
import { messages } from '../../app/messages.de-CH';
import { BackLink } from '../../ui/BackLink';
import { CameraInput } from '../../ui/CameraInput';
import { Card } from '../../ui/Card';
import type { PhotoPrefill } from '../inventory/photo-prefill';
import { handOverReceiptPhotos } from '../receipts/receipt-handover';
import { handOverPhoto, takePhoto } from './photo-handover';
import { deviceReaders, readPhoto, type PhotoReaders } from './read-photo';

const t = messages.photo;
/** The contract takes this much text; a label's front comes first. */
const MAX_TEXT = 5000;

/**
 * «Foto aufnehmen» (ADR-0068): a pack or a receipt. The photo is read on the device; a receipt
 * goes to «Quittung hochladen» with its text, a pack to «Artikel erfassen» with what its label
 * says. Opened without a photo (reload, link), the page offers the camera itself.
 */
export function PhotoPage({ readers = deviceReaders }: { readers?: PhotoReaders }) {
  const { householdId, inventory } = useAppData();
  const navigate = useNavigate();
  const [preview, setPreview] = useState<string | null>(null);

  async function handle(file: File) {
    setPreview(URL.createObjectURL(file));
    const reading = await readPhoto(file, readers);
    if (reading.kind === 'receipt') {
      handOverReceiptPhotos([{ file, text: reading.text }]);
      void navigate('/add/receipt', { replace: true });
      return;
    }
    const label = await inventory['products.fromLabel']({
      householdId,
      text: reading.text.slice(0, MAX_TEXT),
    }).catch(() => ({ suggestions: [] }));
    const photo: PhotoPrefill = {
      label,
      ...(reading.code === undefined ? {} : { code: reading.code }),
      empty: reading.text.trim() === '',
    };
    void navigate('/inventory/new', { replace: true, state: { photo } });
  }

  // A photo from Start or «Erfassen» is read after the first paint; the camera already opened there.
  useEffect(() => {
    const file = takePhoto();
    if (file === null) {
      return;
    }
    const timer = setTimeout(() => void handle(file), 0);
    return () => {
      clearTimeout(timer);
      handOverPhoto(file);
    };
    // Only when the page opens; `handle` changes on every render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(
    () => () => {
      if (preview !== null) {
        URL.revokeObjectURL(preview);
      }
    },
    [preview],
  );

  const pick = (files: File[]) => {
    const [file] = files;
    if (file !== undefined) {
      void handle(file);
    }
  };

  return (
    <div className="space-y-6 pb-8">
      <div>
        <BackLink to="/add" label={messages.pages.add} />
        <h1 className="large-title">{t.title}</h1>
      </div>
      {preview === null ? (
        <Card className="space-y-3">
          <p className="text-ink-muted">{t.intro}</p>
          <CameraInput
            onPhotos={pick}
            className="flex min-h-12 items-center justify-center gap-2 rounded-xl bg-basil-700 px-5 font-semibold text-white transition-colors hover:bg-basil-800"
          >
            <Camera size={20} aria-hidden="true" />
            {t.take}
          </CameraInput>
          <label className="flex min-h-12 cursor-pointer items-center justify-center gap-2 rounded-xl border border-line bg-surface px-5 font-semibold text-basil-700 transition-colors hover:bg-basil-50 has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-basil-600">
            <ImageUp size={20} aria-hidden="true" />
            {t.choose}
            <input
              type="file"
              accept="image/*"
              className="sr-only"
              onChange={(event) => {
                const files = [...(event.target.files ?? [])];
                event.target.value = '';
                pick(files);
              }}
            />
          </label>
        </Card>
      ) : (
        <Card className="space-y-4">
          <img
            src={preview}
            alt={t.preview}
            className="mx-auto max-h-72 rounded-xl object-contain"
          />
          <p role="status" className="text-center font-semibold text-basil-800">
            {t.reading}
          </p>
        </Card>
      )}
    </div>
  );
}
