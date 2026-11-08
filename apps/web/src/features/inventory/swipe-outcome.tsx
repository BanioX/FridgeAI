import type { Id, InventoryItemView } from '@fridgeai/core';
import { Undo2 } from 'lucide-react';
import { useCallback, useEffect, useState, type ReactNode } from 'react';
import { useAppData } from '../../app/AppData';
import { messages } from '../../app/messages.de-CH';
import { formatQuantity } from '../../ui/quantity-text';
import type { SwipeSide } from '../../ui/SwipeAction';
import { swipePortion } from './swipe-portion';

/** The toast stays this long; a new swipe replaces it earlier. */
const TOAST_MS = 5000;
const SEEN_KEY = 'fridgeai:swipe-tip-seen';

/** Id of the visually hidden hint that rows point to with `aria-describedby`. */
export const SWIPE_HINT_ID = 'swipe-outcome-hint';

/** What a swipe records: to the left «Verwertet», to the right «Entsorgt». */
type SwipeOutcome = 'eaten' | 'wasted';

function readSeen(): boolean {
  try {
    return window.localStorage.getItem(SEEN_KEY) === '1';
  } catch {
    return false;
  }
}

function writeSeen(): void {
  try {
    window.localStorage.setItem(SEEN_KEY, '1');
  } catch {
    // Private mode or blocked storage: the tip just shows again.
  }
}

interface Toast {
  key: number;
  text: string;
  /** `null` for an error message: nothing to undo. */
  eventId: Id | null;
}

/**
 * Swipe an item like Spotify (Alban, 8.11.2026): to the left it is «Verwertet» (eaten, cooked,
 * used up), to the right «Entsorgt». Each swipe takes one portion (`swipePortion`: a piece, a
 * portion or the rest), records it with `inventory.recordOutcome` and offers undo in a short
 * toast. `sides(item)` goes straight into `SwipeAction`; `tip` is the one-line hint above a list
 * until a visit after the first swipe.
 */
export function useSwipeOutcome(): {
  sides: (item: InventoryItemView) => { end: SwipeSide; start: SwipeSide };
  tip: ReactNode;
  toast: ReactNode;
} {
  const { householdId, ids, inventory } = useAppData();
  const [toast, setToast] = useState<Toast | null>(null);
  // Read once per visit: the tip stays until the page is opened again, so the list does not jump
  // up under the finger right after the first swipe.
  const [seen] = useState(readSeen);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (toast === null) {
      return undefined;
    }
    const timer = window.setTimeout(() => {
      setToast(null);
    }, TOAST_MS);
    return () => {
      window.clearTimeout(timer);
    };
  }, [toast]);

  const record = useCallback(
    (item: InventoryItemView, outcome: SwipeOutcome) => {
      const portion = swipePortion(item);
      void (async () => {
        try {
          const result = await inventory['inventory.recordOutcome']({
            commandId: ids.next(),
            householdId,
            itemId: item.id,
            outcome,
            quantity: portion.quantity,
          });
          writeSeen();
          const text =
            portion.kind === 'piece'
              ? messages.swipe.pieces(portion.quantity, item.name, outcome)
              : messages.swipe.amount(
                  item.name,
                  formatQuantity(portion.quantity, item.unit),
                  outcome,
                );
          setToast({ key: Date.now(), text, eventId: result.eventId });
        } catch {
          setToast({ key: Date.now(), text: messages.swipe.failed, eventId: null });
        }
      })();
    },
    [householdId, ids, inventory],
  );

  const sides = useCallback(
    (item: InventoryItemView) => {
      const detail = messages.swipe[swipePortion(item).kind];
      return {
        end: {
          label: messages.swipe.outcomes.eaten,
          detail,
          onCommit: () => {
            record(item, 'eaten');
          },
        },
        start: {
          label: messages.swipe.outcomes.wasted,
          detail,
          onCommit: () => {
            record(item, 'wasted');
          },
        },
      };
    },
    [record],
  );

  const undo = async (eventId: Id) => {
    if (busy) {
      return;
    }
    setBusy(true);
    try {
      await inventory['inventory.undoOutcome']({
        commandId: ids.next(),
        householdId,
        eventId,
      });
      setToast(null);
    } catch {
      setToast({ key: Date.now(), text: messages.inventory.undoFailed, eventId: null });
    } finally {
      setBusy(false);
    }
  };

  const undoId = toast?.eventId ?? null;
  return {
    sides,
    tip: (
      <>
        <p id={SWIPE_HINT_ID} className="sr-only">
          {messages.swipe.hint}
        </p>
        {seen ? null : <p className="text-sm text-ink-muted">{messages.swipe.tip}</p>}
      </>
    ),
    // The live region stays mounted and only its content changes, so screen readers announce it.
    toast: (
      <div className="pointer-events-none fixed inset-x-0 bottom-[calc(4.75rem+env(safe-area-inset-bottom))] z-20 mx-auto max-w-xl px-4">
        <div
          role="status"
          className="pointer-events-auto flex items-center justify-between gap-2 rounded-2xl bg-onyx py-2 pr-2 pl-4 text-white shadow-card empty:hidden"
        >
          {toast === null ? null : (
            <>
              <p className="font-semibold">{toast.text}</p>
              {undoId === null ? null : (
                <button
                  type="button"
                  disabled={busy}
                  className="inline-flex min-h-11 shrink-0 items-center gap-2 rounded-xl px-3 font-semibold text-white transition-colors hover:bg-white/10 disabled:opacity-50"
                  onClick={() => {
                    void undo(undoId);
                  }}
                >
                  <Undo2 size={20} aria-hidden="true" />
                  {messages.inventory.undo}
                </button>
              )}
            </>
          )}
        </div>
      </div>
    ),
  };
}
