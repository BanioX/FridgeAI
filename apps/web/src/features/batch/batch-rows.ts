import {
  fallbackCategory,
  matchCategoryByName,
  parseShoppingText,
  piecesPerPackFor,
  portioningOf,
  toBaseQuantity,
  type Container,
  type LocalDate,
  type StorageLocation,
  type Unit,
} from '@fridgeai/core';
import { suggestedAmount, suggestedExpiry } from '../inventory/add-item';

/** One article as the batch page shows it and `inventory.addItem` receives it (ADR-0072). */
export interface BatchRow {
  /** Stable while the text stays the same, used for React keys and for removing a row. */
  key: string;
  name: string;
  categoryId: string;
  location: StorageLocation;
  /** In the base unit of the contract (g, ml, pieces). */
  quantity: number;
  unit: Unit;
  container?: Container;
  piecesPerPack?: number;
  /** The estimate the handler will set; shown only, never sent. */
  expiresOn: LocalDate;
}

/**
 * Turns one sentence into the articles the single add form would create for each name: the same
 * category match, location, amount and estimated expiry date, no extra details. Pure text work.
 */
export function batchRows(text: string, today: LocalDate): BatchRow[] {
  return parseShoppingText(text).map((line) => {
    const known = matchCategoryByName(line.name);
    const category = known ?? fallbackCategory();
    // «Kühlschrank zuerst»: an unknown food goes to the fridge, like in the single form.
    const location = known?.defaultLocation ?? 'fridge';
    const portioning = portioningOf(category);
    const suggestion = suggestedAmount(category);
    const base =
      line.quantity !== undefined && line.unit !== undefined
        ? toBaseQuantity(line.quantity, line.unit)
        : toBaseQuantity(suggestion.amount, suggestion.unit);
    const perPack = base.unit === 'pcs' ? piecesPerPackFor(base.quantity, portioning) : undefined;
    const container = base.unit === 'pcs' ? portioning.container : undefined;
    return {
      key: `${line.name.toLocaleLowerCase('de-CH')}|${String(base.quantity)}|${base.unit}`,
      name: line.name,
      categoryId: category.id,
      location,
      quantity: base.quantity,
      unit: base.unit,
      ...(container === undefined ? {} : { container }),
      ...(perPack === undefined ? {} : { piecesPerPack: perPack }),
      expiresOn: suggestedExpiry(category, location, today),
    };
  });
}
