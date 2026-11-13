import { Maximize2, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { messages } from '../app/messages.de-CH';

const t = messages.photoViewer;

/**
 * A photo over the whole screen (ADR-0082): black ground, the photo centred and whole, the name
 * on top and «Schliessen» in reach of the thumb. Escape, «Schliessen» or a tap beside the photo
 * close it.
 */
export function PhotoViewer({
  src,
  title,
  onClose,
}: {
  src: string;
  title: string;
  onClose: () => void;
}) {
  const close = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    close.current?.focus();
    // Capture, so a sheet underneath does not close on the same Escape.
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.stopPropagation();
        onClose();
      }
    };
    window.addEventListener('keydown', onKey, true);
    return () => {
      window.removeEventListener('keydown', onKey, true);
    };
  }, [onClose]);

  // On the body: a page that makes its own stacking context must not keep the tab bar on top.
  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label={title}
      className="fixed inset-0 z-50 flex flex-col bg-black pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)] text-white"
      onClick={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <div className="flex items-center justify-between gap-3 px-4 py-2">
        <p className="min-w-0 truncate font-semibold">{title}</p>
        <button
          ref={close}
          type="button"
          onClick={onClose}
          className="inline-flex size-11 shrink-0 items-center justify-center rounded-full bg-white/15 hover:bg-white/25"
        >
          <X size={22} aria-hidden="true" />
          <span className="sr-only">{t.close}</span>
        </button>
      </div>
      <div
        className="flex min-h-0 flex-1 items-center justify-center p-3"
        onClick={(event) => {
          if (event.target === event.currentTarget) {
            onClose();
          }
        }}
      >
        <img src={src} alt={title} className="max-h-full max-w-full rounded-xl object-contain" />
      </div>
    </div>,
    document.body,
  );
}

/**
 * A photo that shows it can grow: a tap opens it over the whole screen. The small corner badge
 * says so, because a long press (the browser's own preview) is found by nobody.
 */
export function ZoomablePhoto({
  src,
  title,
  className = '',
}: {
  src: string;
  title: string;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const opener = useRef<HTMLButtonElement>(null);
  return (
    <>
      <button
        ref={opener}
        type="button"
        onClick={() => {
          setOpen(true);
        }}
        className={`group relative block w-full overflow-hidden rounded-2xl border border-line bg-surface-muted focus-visible:outline-2 focus-visible:outline-offset-2 ${className}`}
      >
        <img src={src} alt="" className="size-full object-cover" />
        <span
          aria-hidden="true"
          className="absolute right-2 bottom-2 inline-flex size-9 items-center justify-center rounded-full bg-black/55 text-white"
        >
          <Maximize2 size={18} />
        </span>
        <span className="sr-only">{t.open(title)}</span>
      </button>
      {open ? (
        <PhotoViewer
          src={src}
          title={title}
          onClose={() => {
            setOpen(false);
            // Back to the photo, so the keyboard and the screen reader stay in place.
            opener.current?.focus();
          }}
        />
      ) : null}
    </>
  );
}
