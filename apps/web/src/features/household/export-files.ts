import {
  formatChf,
  formatDecimal,
  formatSwissDate,
  toCsv,
  type InventoryItemView,
  type LocalDate,
} from '@fridgeai/core';
import { messages } from '../../app/messages.de-CH';

/** «rettich-2026-11-06.json»: the date tells exports apart. */
export const exportFileName = (today: LocalDate, extension: 'json' | 'csv') =>
  `rettich-${today}.${extension}`;

/** The inventory as a spreadsheet: one row per item, numbers without units or currency. */
export function inventoryCsv(items: readonly InventoryItemView[]): string {
  const t = messages;
  return toCsv(
    messages.household.csvHeader,
    items.map((item) => [
      item.name,
      formatDecimal(item.quantity, { digits: 3, group: false }),
      t.units[item.unit],
      t.locations[item.location],
      formatSwissDate(item.expiresOn),
      item.expiryKind === 'use_by' ? t.itemDetail.useBy : t.itemDetail.bestBefore,
      item.priceRappen === undefined ? undefined : formatChf(item.priceRappen, { currency: false }),
      item.brand,
      item.gtin,
    ]),
  );
}

/** Hands a file to the browser's download (no server involved). */
export function saveFile(name: string, type: string, content: string): void {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const link = document.createElement('a');
  link.href = url;
  link.download = name;
  document.body.append(link);
  link.click();
  link.remove();
  // Give the browser a moment to start the download before the URL goes away.
  setTimeout(() => {
    URL.revokeObjectURL(url);
  }, 1000);
}
