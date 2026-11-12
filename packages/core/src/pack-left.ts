import type { Unit } from './model/primitives';

/** A pack with more pieces than this shows one closed arc instead of a segment per piece. */
export const PACK_SEGMENTS_MAX = 24;

export interface PackLeft {
  /** Pieces in the pack when it came home: what is left plus what already went. */
  start: number;
  /** Pieces still there, halves included (`9.5` after «Halb»). */
  left: number;
}

const round = (value: number) => Math.round(value * 1000) / 1000;

/**
 * How much of a pack of pieces is left, «7 von 10» (Alban, 12.11.2026: «Schmelzkäse hat eine
 * Packung 10 Scheiben»). The start is not stored: it is what is left plus what already went
 * (verwertet, entsorgt, verarbeitet), so it stays right after a correction of the quantity.
 * Only for pieces and packs of two or more; grams and millilitres say it in the quantity.
 */
export function packLeft(item: {
  quantity: number;
  unit: Unit;
  takenQuantity?: number | undefined;
}): PackLeft | undefined {
  if (item.unit !== 'pcs') {
    return undefined;
  }
  const start = round(item.quantity + (item.takenQuantity ?? 0));
  return start < 2 ? undefined : { start, left: round(item.quantity) };
}
