import { categoryById, type InventoryItemView, type LocalDate } from '@fridgeai/core';

/** What expires before the person is back, split by what can be done about it. */
export interface VacationPlan {
  /** The category has a freezer shelf life: one tap puts it away for the holidays. */
  freeze: InventoryItemView[];
  /** Does not freeze: has to be used up before leaving. */
  useUp: InventoryItemView[];
}

/** Only these places count; the freezer and the Notvorrat keep for weeks and months. */
const WATCHED_LOCATIONS: ReadonlySet<string> = new Set(['fridge', 'pantry']);

/**
 * Ferien-Check (ADR-0069): the items of the fridge and the Vorrat whose date falls on or before
 * the return day (that day counts: it may be the last good one). Dates are `YYYY-MM-DD`, so they
 * compare as text. Items that are already expired still count, they need attention now. Each group
 * lists what runs out first on top.
 */
export function vacationPlan(items: readonly InventoryItemView[], back: LocalDate): VacationPlan {
  const due = items
    .filter((item) => WATCHED_LOCATIONS.has(item.location) && item.expiresOn <= back)
    .sort(
      (a, b) => a.expiresOn.localeCompare(b.expiresOn) || a.name.localeCompare(b.name, 'de-CH'),
    );
  const freezable = (item: InventoryItemView) =>
    (categoryById(item.categoryId)?.shelfLifeDays.freezer ?? null) !== null;
  return { freeze: due.filter(freezable), useUp: due.filter((item) => !freezable(item)) };
}
