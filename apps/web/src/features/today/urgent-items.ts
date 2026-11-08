import type { ExpiryStatus, InventoryItemView } from '@fridgeai/core';

/** «Heute retten» on «Start» shows at most this many rows. */
export const URGENT_LIMIT = 5;

type ExpiringItem = InventoryItemView & { status: ExpiryStatus };

/**
 * What really needs attention: due today, soon (within the location's threshold) or past its date.
 * The Notvorrat (90-day threshold) only counts once it is due or past, never merely «soon».
 */
export function urgentItems(items: readonly ExpiringItem[]): ExpiringItem[] {
  return items
    .filter(({ status, location }) => {
      if (status.kind === 'fresh') {
        return false;
      }
      return location !== 'reserve' || status.kind !== 'soon';
    })
    .sort(
      (a, b) => a.expiresOn.localeCompare(b.expiresOn) || a.name.localeCompare(b.name, 'de-CH'),
    );
}
