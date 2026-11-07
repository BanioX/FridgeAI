import {
  addDays,
  displayQuantity,
  estimateExpiry,
  formatDecimal,
  portioningOf,
  type Category,
  type InputUnit,
  type LocalDate,
  type StorageLocation,
} from '@fridgeai/core';

/** Units offered in the add form, in this order. */
export const INPUT_UNITS: readonly InputUnit[] = ['pcs', 'g', 'kg', 'ml', 'dl', 'l'];

/** «1,5», «1.5» or «.5» → the number; empty, zero or anything else → null. */
export function parseAmount(text: string): number | null {
  const normalized = text.trim().replace(',', '.');
  if (!/^(\d+(\.\d*)?|\.\d+)$/.test(normalized)) {
    return null;
  }
  const value = Number(normalized);
  return value > 0 ? value : null;
}

/** 1.5 → «1.5» for the input field: Swiss decimal point, no thousands separator (ADR-0018). */
export const formatAmount = (amount: number): string =>
  formatDecimal(amount, { digits: 3, group: false });

/**
 * What the form pre-fills for a category: one piece for counted food, otherwise the typical pack
 * in a natural unit, rounded to a number people see on packs (1030 g milk → 1 l, 300 g → 300 g).
 */
export function suggestedAmount(category: Category): { amount: number; unit: InputUnit } {
  const { unit } = portioningOf(category);
  if (unit === 'pcs') {
    return { amount: 1, unit: 'pcs' };
  }
  const typical = category.avgWeightGrams ?? (unit === 'g' ? 500 : 1000);
  const step = typical < 1000 ? 50 : 100;
  const rounded = Math.max(step, Math.round(typical / step) * step);
  return displayQuantity(rounded, unit);
}

/** The estimated expiry date the form proposes until the person picks one. */
export function suggestedExpiry(
  category: Category,
  location: StorageLocation,
  today: LocalDate,
): LocalDate {
  return (
    estimateExpiry(category, location, today) ??
    estimateExpiry(category, category.defaultLocation, today) ??
    addDays(today, 7)
  );
}

/** «1 l», «500 g», «2,5 dl» or «2.5 dl» as printed on a pack → amount and unit; anything else → null. */
export function parsePackSize(text: string): { amount: number; unit: InputUnit } | null {
  const match = /^(\d+(?:[.,]\d+)?)\s*(g|kg|ml|cl|dl|l)$/i.exec(text.trim());
  const unit = INPUT_UNITS.find((option) => option === match?.[2]?.toLowerCase());
  const amount = match?.[1] === undefined ? null : parseAmount(match[1]);
  return amount === null || unit === undefined ? null : { amount, unit };
}

/**
 * What is set under «Mehr Angaben», joined for the disclosure button (e.g. «Tiefkühler, CHF 3.95»),
 * so nothing optional stays hidden silently. Empty parts are left out.
 */
export function moreSummary(parts: readonly (string | null | undefined)[]): string {
  return parts
    .filter((part): part is string => part !== undefined && part !== null && part !== '')
    .join(', ');
}
