import type { InventoryItemView } from '@fridgeai/core';
import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { useAppData } from '../../app/AppData';
import { messages } from '../../app/messages.de-CH';
import { applySpot, bulkText, stillClosed, type BulkChanges } from './bulk-edit';

/** The toast stays this long, like the move toast. */
const TOAST_MS = 5000;

/**
 * Changes the chosen items one after the other with the existing commands (O7): the date with
 * `inventory.updateItem` (the date kind stays), «Angebrochen» with `inventory.open` (only for
 * items still closed), «Gehört» with `inventory.updateItem`, «Platz» with `products.setSpot` once per product. A failure does not stop the others
 * and is named. `edit` resolves to `true` only when everything worked, so the caller ends select
 * mode; otherwise what failed stays selected.
 */
export function useEditSelected(): {
  busy: boolean;
  edit: (items: readonly InventoryItemView[], changes: BulkChanges) => Promise<boolean>;
  toast: ReactNode;
} {
  const { householdId, ids, inventory } = useAppData();
  const [busy, setBusy] = useState(false);
  const [text, setText] = useState<string | null>(null);
  const running = useRef(false);

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

  const edit = useCallback(
    async (items: readonly InventoryItemView[], changes: BulkChanges) => {
      if (running.current || items.length === 0) {
        return false;
      }
      running.current = true;
      setBusy(true);
      const changed = new Set<InventoryItemView>();
      const failed = new Set<InventoryItemView>();
      const attempt = async (item: InventoryItemView, run: () => Promise<unknown>) => {
        try {
          await run();
          changed.add(item);
        } catch {
          failed.add(item);
        }
      };
      const closed = changes.open === true ? stillClosed(items) : [];
      try {
        if (changes.expiresOn !== undefined || changes.owner !== undefined) {
          for (const item of items) {
            await attempt(item, () =>
              inventory['inventory.updateItem']({
                commandId: ids.next(),
                householdId,
                itemId: item.id,
                ...(changes.expiresOn === undefined
                  ? {}
                  : { expiresOn: changes.expiresOn, expiryKind: item.expiryKind }),
                ...(changes.owner === undefined ? {} : { owner: changes.owner }),
              }),
            );
          }
        }
        if (changes.spot !== undefined) {
          const { spot } = changes;
          const result = await applySpot(items, (productId) =>
            inventory['products.setSpot']({
              commandId: ids.next(),
              householdId,
              productId,
              spotId: spot,
            }),
          );
          result.changed.forEach((item) => changed.add(item));
          result.failed.forEach((item) => failed.add(item));
        }
        for (const item of closed) {
          await attempt(item, () =>
            inventory['inventory.open']({ commandId: ids.next(), householdId, itemId: item.id }),
          );
        }
        setText(
          bulkText(
            [...changed].map((item) => item.name),
            [...failed].map((item) => item.name),
            changes.open === true && closed.length === 0,
            messages.inventory.bulk,
          ),
        );
        return failed.size === 0;
      } finally {
        running.current = false;
        setBusy(false);
      }
    },
    [householdId, ids, inventory],
  );

  return {
    busy,
    edit,
    toast: (
      <div className="pointer-events-none fixed inset-x-0 bottom-[calc(4.75rem+env(safe-area-inset-bottom))] z-50 mx-auto max-w-xl px-4">
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
