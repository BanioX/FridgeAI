import { CommandError, type InventoryItemView, type StorageLocation } from '@fridgeai/core';
import { useCallback, useEffect, useState, type ReactNode } from 'react';
import { useAppData } from '../../app/AppData';
import { messages } from '../../app/messages.de-CH';

/** The toast stays this long, like the swipe toast. */
const TOAST_MS = 5000;

/**
 * Moves the chosen items one after the other with `inventory.move` (which re-estimates the expiry
 * date, e.g. when freezing). An item that does not belong there (milk in the Vorrat) stays and is
 * named; the others still move. `toast` is the status line afterwards; it sits where the swipe
 * toast does. `move` resolves to `false` unless all moved, so the caller keeps the selection.
 */
export function useMoveSelected(): {
  busy: boolean;
  move: (items: readonly InventoryItemView[], to: StorageLocation) => Promise<boolean>;
  toast: ReactNode;
} {
  const { householdId, ids, inventory } = useAppData();
  const [busy, setBusy] = useState(false);
  const [text, setText] = useState<string | null>(null);

  useEffect(() => {
    if (text === null) {
      return undefined;
    }
    const timer = window.setTimeout(() => {
      setText(null);
    }, TOAST_MS);
    return () => {
      window.clearTimeout(timer);
    };
  }, [text]);

  const move = useCallback(
    async (items: readonly InventoryItemView[], to: StorageLocation) => {
      const t = messages.inventory.select;
      setBusy(true);
      const moved: InventoryItemView[] = [];
      const unfit: InventoryItemView[] = [];
      try {
        for (const item of items) {
          try {
            await inventory['inventory.move']({
              commandId: ids.next(),
              householdId,
              itemId: item.id,
              to,
            });
            moved.push(item);
          } catch (error) {
            if (!(error instanceof CommandError) || error.code !== 'unsuitable_location') {
              throw error;
            }
            unfit.push(item);
          }
        }
        const [only] = moved;
        const done =
          moved.length === 0
            ? ''
            : moved.length === 1 && only !== undefined
              ? t.movedOne(only.name, t.in[to])
              : t.movedMany(moved.length, t.in[to]);
        const stays =
          unfit.length === 0
            ? ''
            : t.unfit(
                unfit.map((item) => item.name),
                t.in[to],
              );
        setText([done, stays].filter((part) => part !== '').join(' '));
        return unfit.length === 0;
      } catch {
        setText(t.failed);
        return false;
      } finally {
        setBusy(false);
      }
    },
    [householdId, ids, inventory],
  );

  return {
    busy,
    move,
    // The live region stays mounted and only its content changes, so screen readers announce it.
    toast: (
      <div className="pointer-events-none fixed inset-x-0 bottom-[calc(4.75rem+env(safe-area-inset-bottom))] z-20 mx-auto max-w-xl px-4">
        <div
          role="status"
          className="pointer-events-auto rounded-2xl bg-onyx px-4 py-3 font-semibold text-white shadow-card empty:hidden"
        >
          {text}
        </div>
      </div>
    ),
  };
}
