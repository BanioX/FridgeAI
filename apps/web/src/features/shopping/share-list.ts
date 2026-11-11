import type { Unit } from '@fridgeai/core';
import { formatQuantity } from '../../ui/quantity-text';

interface ListEntry {
  name: string;
  checked: boolean;
  quantity?: number | undefined;
  unit?: Unit | undefined;
}

/**
 * «Nachkaufen» as plain text for a chat or the notes app: the title, then one open entry
 * per line with its quantity. Checked entries stay out. Empty string if nothing is open.
 */
export function shoppingListText(title: string, entries: readonly ListEntry[]): string {
  const lines = entries
    .filter((entry) => !entry.checked)
    .map((entry) =>
      entry.quantity === undefined || entry.unit === undefined
        ? entry.name
        : `${formatQuantity(entry.quantity, entry.unit)} ${entry.name}`,
    );
  return lines.length === 0 ? '' : [title, ...lines].join('\n');
}

export type ShareOutcome = 'shared' | 'copied' | 'cancelled' | 'failed';

/** Web Share where the device has it, else the clipboard. Runs only on the person's tap. */
export async function shareText(text: string): Promise<ShareOutcome> {
  // Not every browser has share (desktop Firefox), even though the types say so.
  if (typeof (navigator as { share?: unknown }).share === 'function') {
    try {
      await navigator.share({ text });
      return 'shared';
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') {
        return 'cancelled';
      }
      // Any other failure: try the clipboard below.
    }
  }
  try {
    await navigator.clipboard.writeText(text);
    return 'copied';
  } catch {
    return 'failed';
  }
}
