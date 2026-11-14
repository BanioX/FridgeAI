import type { PackLeft } from '@fridgeai/core';
import { Check, Ellipsis, Trash2, Undo2 } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { messages } from '../../app/messages.de-CH';
import { Button } from '../../ui/Button';
import { PackRing } from '../../ui/PackRing';
import { formatPieces } from '../../ui/quantity-text';
import { createPortal } from 'react-dom';

/** How long a press must last to open the menu instead of taking one piece. */
const HOLD_MS = 450;

export type PackOutcome = 'eaten' | 'wasted';

/**
 * The ring of a pack you can use (Alban, 12.11.2026: «Es muss ein smartes Menü sein, wie antippen
 * oder rückgängig»): a tap takes one piece as verwertet, holding it (or the ⋯ button, for
 * keyboards and screen readers) opens a menu with verwertet, entsorgt and «Letzte rückgängig».
 * What just happened stays next to the ring with «Rückgängig» (ADR-0063 Nachtrag).
 */
export function PackControl({
  pack,
  behind = 0,
  busy,
  note,
  onTake,
  onUndo,
}: {
  pack: PackLeft;
  /** Whole packs waiting behind the one the ring shows (ADR-0066). */
  behind?: number;
  busy: boolean;
  /** What the last tap did, with an undo while it is the last action. */
  note: { text: string; undoable: boolean } | null;
  onTake: (outcome: PackOutcome) => void;
  onUndo: () => void;
}) {
  const t = messages.itemDetail;
  const left = formatPieces(pack.left);
  const start = formatPieces(pack.start);
  const [menu, setMenu] = useState(false);
  const timer = useRef<number | null>(null);
  const held = useRef(false);

  const stop = () => {
    if (timer.current !== null) {
      window.clearTimeout(timer.current);
      timer.current = null;
    }
  };
  useEffect(() => stop, []);
  useEffect(() => {
    if (!menu) {
      return;
    }
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setMenu(false);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('keydown', onKey);
    };
  }, [menu]);

  const choose = (action: () => void) => {
    setMenu(false);
    action();
  };

  return (
    <div className="mt-4 space-y-1 border-t border-line pt-4">
      <div className="flex items-center gap-3">
        <button
          type="button"
          disabled={busy}
          aria-label={t.packTap(left, start)}
          aria-haspopup="dialog"
          className="-m-1 shrink-0 select-none rounded-full p-1 [-webkit-touch-callout:none] hover:bg-surface-muted focus-visible:outline-2 focus-visible:outline-basil-600 active:scale-95 disabled:opacity-60"
          onPointerDown={() => {
            held.current = false;
            stop();
            timer.current = window.setTimeout(() => {
              held.current = true;
              setMenu(true);
            }, HOLD_MS);
          }}
          onPointerUp={stop}
          onPointerLeave={stop}
          onContextMenu={(event) => {
            // Long press on a phone and right click on a computer open the menu.
            event.preventDefault();
            stop();
            held.current = true;
            setMenu(true);
          }}
          onClick={() => {
            stop();
            if (held.current) {
              held.current = false;
              return;
            }
            onTake('eaten');
          }}
        >
          <PackRing pack={pack} label={t.packLabel(left, start)} />
        </button>
        <div className="min-w-0 flex-1">
          <p className="font-semibold">{t.packLeft(left, start)}</p>
          <p className="text-sm text-ink-muted">
            {behind > 0
              ? t.packBehind(behind)
              : pack.start > pack.left
                ? t.packTaken(formatPieces(pack.start - pack.left))
                : t.packFull}
          </p>
        </div>
        <button
          type="button"
          disabled={busy}
          aria-label={t.packMore}
          aria-haspopup="dialog"
          className="flex size-11 shrink-0 items-center justify-center rounded-full text-ink-muted hover:bg-surface-muted focus-visible:outline-2 focus-visible:outline-basil-600"
          onClick={() => {
            setMenu(true);
          }}
        >
          <Ellipsis size={20} aria-hidden="true" />
        </button>
      </div>
      {/* Always there, so a screen reader hears what a tap did; the page keeps its one status. */}
      <div className={note === null ? 'sr-only' : 'flex items-center gap-x-3 text-sm'}>
        <span aria-live="polite" className="font-semibold text-basil-800">
          {note?.text ?? ''}
        </span>
        {note?.undoable === true ? (
          <button
            type="button"
            disabled={busy}
            className="min-h-11 font-semibold text-basil-700 underline-offset-2 hover:underline"
            onClick={onUndo}
          >
            {t.undo}
          </button>
        ) : null}
      </div>
      <p className="text-xs text-ink-muted">{t.packHint}</p>
      {menu
        ? createPortal(
            <div
              className="sheet-backdrop"
              onClick={(event) => {
                if (event.target === event.currentTarget) {
                  setMenu(false);
                }
              }}
            >
              <div
                role="dialog"
                aria-modal="true"
                aria-labelledby="pack-menu-title"
                className="sheet-panel space-y-3"
              >
                <h2 id="pack-menu-title" className="font-display text-xl font-semibold">
                  {t.packLabel(left, start)}
                </h2>
                <Button
                  fullWidth
                  autoFocus
                  icon={Check}
                  onClick={() => {
                    choose(() => {
                      onTake('eaten');
                    });
                  }}
                >
                  {t.packEaten}
                </Button>
                <Button
                  variant="secondary"
                  fullWidth
                  icon={Trash2}
                  onClick={() => {
                    choose(() => {
                      onTake('wasted');
                    });
                  }}
                >
                  {t.packWasted}
                </Button>
                {note?.undoable === true ? (
                  <Button
                    variant="secondary"
                    fullWidth
                    icon={Undo2}
                    onClick={() => {
                      choose(onUndo);
                    }}
                  >
                    {t.packUndo}
                  </Button>
                ) : null}
                <Button
                  variant="ghost"
                  fullWidth
                  onClick={() => {
                    setMenu(false);
                  }}
                >
                  {t.packCancel}
                </Button>
              </div>
            </div>,
            document.body,
          )
        : null}
    </div>
  );
}
