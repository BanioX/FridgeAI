import { Camera, ImageUp } from 'lucide-react';
import { useCallback, useEffect, useRef, useState, type ChangeEvent } from 'react';
import { messages } from '../../app/messages.de-CH';
import { Button } from '../../ui/Button';
import { loadCodeReader } from './barcode';

const t = messages.scanner;

type CameraState = 'idle' | 'starting' | 'scanning' | 'denied' | 'unavailable';

/** Milliseconds between two reads of the video: fast enough to feel instant, light on battery. */
const SCAN_INTERVAL_MS = 250;

/**
 * Barcode and QR scanner with all fallbacks (CLAUDE.md): the camera starts only after a tap, a
 * blocked or missing camera explains itself, a photo or the typed number always work. Photos are
 * read in memory and never stored.
 */
export function BarcodeScanner({ onCode }: { onCode: (raw: string) => void }) {
  const video = useRef<HTMLVideoElement>(null);
  const stream = useRef<MediaStream | null>(null);
  const timer = useRef<number | undefined>(undefined);
  const [state, setState] = useState<CameraState>('idle');
  const [manual, setManual] = useState('');
  const [message, setMessage] = useState('');

  const stop = useCallback(() => {
    window.clearTimeout(timer.current);
    for (const track of stream.current?.getTracks() ?? []) {
      track.stop();
    }
    stream.current = null;
  }, []);
  useEffect(() => stop, [stop]);

  const found = useCallback(
    (raw: string) => {
      stop();
      setState('idle');
      onCode(raw);
    },
    [onCode, stop],
  );

  async function start() {
    setMessage('');
    // Only exposed in secure contexts (https, localhost) and on devices with media support.
    if (!('mediaDevices' in navigator)) {
      setState('unavailable');
      return;
    }
    setState('starting');
    try {
      const media = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: 'environment' } },
        audio: false,
      });
      stream.current = media;
      const element = video.current;
      if (element === null) {
        stop();
        return;
      }
      element.srcObject = media;
      await element.play();
      setState('scanning');
      const reader = await loadCodeReader();
      const tick = async () => {
        if (stream.current === null) {
          return;
        }
        const [code] = await reader.detect(element).catch(() => []);
        if (code === undefined) {
          timer.current = window.setTimeout(() => void tick(), SCAN_INTERVAL_MS);
        } else {
          found(code.rawValue);
        }
      };
      void tick();
    } catch (error) {
      stop();
      const blocked =
        error instanceof DOMException &&
        (error.name === 'NotAllowedError' || error.name === 'SecurityError');
      setState(blocked ? 'denied' : 'unavailable');
    }
  }

  async function readPhoto(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (file === undefined) {
      return;
    }
    setMessage('');
    try {
      const bitmap = await createImageBitmap(file);
      const [code] = await (await loadCodeReader()).detect(bitmap);
      bitmap.close();
      if (code === undefined) {
        setMessage(t.noCode);
      } else {
        found(code.rawValue);
      }
    } catch {
      setMessage(t.noCode);
    }
  }

  function submitManual() {
    if (manual.trim() !== '') {
      found(manual.trim());
      setManual('');
    }
  }

  const live = state === 'starting' || state === 'scanning';

  return (
    <div className="space-y-3">
      <div className={live ? 'overflow-hidden rounded-2xl bg-ink' : 'hidden'}>
        <video ref={video} playsInline muted className="aspect-[4/3] w-full object-cover" />
      </div>
      {live ? (
        <>
          <p className="text-sm text-ink-muted">{state === 'starting' ? t.starting : t.hint}</p>
          <Button
            variant="secondary"
            fullWidth
            onClick={() => {
              stop();
              setState('idle');
            }}
          >
            {t.stop}
          </Button>
        </>
      ) : (
        <Button
          icon={Camera}
          fullWidth
          onClick={() => {
            void start();
          }}
        >
          {t.start}
        </Button>
      )}

      <p role="status" className="text-sm text-today">
        {state === 'denied' ? t.denied : state === 'unavailable' ? t.unavailable : message}
      </p>

      <label className="flex min-h-12 cursor-pointer items-center justify-center gap-2 rounded-xl border border-line bg-surface px-5 font-semibold text-ink has-focus-visible:outline-2 has-focus-visible:outline-basil-600">
        <ImageUp size={20} aria-hidden="true" />
        {t.photo}
        <input
          type="file"
          accept="image/*"
          capture="environment"
          className="sr-only"
          onChange={(event) => {
            void readPhoto(event);
          }}
        />
      </label>

      {/* No <form> here: the scanner sits inside the add form, and forms must not nest. */}
      <div className="flex items-end gap-2">
        <div className="min-w-0 flex-1 space-y-1">
          <label htmlFor="manual-code" className="block text-sm font-semibold">
            {t.manual}
          </label>
          <input
            id="manual-code"
            value={manual}
            onChange={(event) => {
              setManual(event.target.value);
            }}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                event.preventDefault();
                submitManual();
              }
            }}
            inputMode="numeric"
            enterKeyHint="done"
            autoComplete="off"
            className="min-h-12 w-full rounded-xl border border-line bg-surface px-4 text-lg tabular-nums outline-none focus:border-basil-600"
          />
        </div>
        <Button variant="secondary" onClick={submitManual}>
          {t.manualSubmit}
        </Button>
      </div>
    </div>
  );
}
