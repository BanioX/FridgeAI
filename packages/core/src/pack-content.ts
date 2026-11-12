const round = (value: number) => Math.round(value * 1000) / 1000;

/**
 * The pack size an amount of pieces stands for, from the pack sizes of its category (ADR-0066):
 * 10 slices with packs of 8, 10 or 12 are one pack of 10, 20 are two packs of 10, 16 two of 8.
 * The first size that divides the amount wins; no fit means every piece is its own pack.
 */
export function piecesPerPackFor(
  quantity: number,
  packs: readonly number[] | undefined,
): number | undefined {
  if (packs === undefined || !Number.isInteger(quantity) || quantity < 2) {
    return undefined;
  }
  return packs.find((size) => quantity % size === 0);
}

export interface PackContent {
  /** Unopened packs. */
  full: number;
  /** Pieces left in the opened pack; 0 when every pack is still whole. */
  open: number;
  perPack: number;
}

/**
 * How the pieces of an item split into packs: 17 slices in packs of 10 are one whole pack and 7
 * in the opened one. Undefined when every piece is its own pack.
 */
export function packContent(item: {
  quantity: number;
  piecesPerPack?: number | undefined;
}): PackContent | undefined {
  const perPack = item.piecesPerPack;
  if (perPack === undefined) {
    return undefined;
  }
  const full = Math.floor(round(item.quantity / perPack));
  return { full, open: round(item.quantity - full * perPack), perPack };
}

/** What a swipe takes from an item counted in packs: the opened pack's rest, or one whole pack. */
export function packTake(content: PackContent): { quantity: number; whole: boolean } {
  return content.open > 0
    ? { quantity: content.open, whole: false }
    : { quantity: content.perPack, whole: true };
}
