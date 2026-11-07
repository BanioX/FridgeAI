import type { Id, InventoryItemView } from '@fridgeai/core';
import { Undo2 } from 'lucide-react';
import { useCallback, useEffect, useState, type ReactNode } from 'react';
import { useAppData } from '../../app/AppData';
import { messages } from '../../app/messages.de-CH';
import { formatQuantity } from '../../ui/quantity-text';
import { swipePortion } from './swipe-portion';

/** The toast stays this long; a new swipe replaces it earlier. */
const TOAST_MS = 5000;
const SEEN_KEY = 'fridgeai:swipe-tip-seen';

/** Id of the visually hidden hint that rows point to with `aria-describedby`. */
export const SWIPE_HINT_ID = 'swipe-eat-hint';

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

/** Strip text for a row: «Gegessen» with «−1», «1 Portion» or «alles» below. */
export function swipeLabel(item: Pick<InventoryItemView, 'quantity' | 'unit'>): {
  label: string;
  detail: string;
} {
  return { label: messages.swipe.action, detail: messages.swipe[swipePortion(item).kind] };
}

/**
 * Swipe to eat one portion of an item: records it with `inventory.recordOutcome` and offers undo
 * in a short toast. `tip` is the one-line hint above a list until a visit after the first swipe.
 */
export function useSwipeEat(): {
  eat: (item: InventoryItemView) => void;
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

  const eat = useCallback(
    (item: InventoryItemView) => {
      const portion = swipePortion(item);
      void (async () => {
        try {
          const result = await inventory['inventory.recordOutcome']({
            commandId: ids.next(),
            householdId,
            itemId: item.id,
            outcome: 'eaten',
            quantity: portion.quantity,
          });
          writeSeen();
          const text =
            portion.kind === 'piece'
              ? messages.swipe.eatenPieces(portion.quantity, item.name)
              : messages.swipe.eatenAmount(item.name, formatQuantity(portion.quantity, item.unit));
          setToast({ key: Date.now(), text, eventId: result.eventId });
        } catch {
          setToast({ key: Date.now(), text: messages.swipe.failed, eventId: null });
        }
      })();
    },
    [householdId, ids, inventory],
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
    eat,
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
