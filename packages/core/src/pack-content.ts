import { packLeft, type PackLeft } from './pack-left';
import type { Unit } from './model/primitives';

const round = (value: number) => Math.round(value * 1000) / 1000;

/**
 * The pack size an amount of pieces stands for (ADR-0066), for food counted as a pack: 10 slices
 * with packs of 8, 10 or 12 are one pack of 10, 20 are two packs of 10, 16 two of 8. The first
 * size that divides the amount wins. Undefined when every piece stands for itself: no fit, or a
 * category like eggs or yoghurt, where each piece is taken alone.
 */
export function piecesPerPackFor(
  quantity: number,
  portioning: { packs?: readonly number[] | undefined; sharedPack?: boolean | undefined },
): number | undefined {
  if (portioning.sharedPack !== true || !Number.isInteger(quantity) || quantity < 2) {
    return undefined;
  }
  return portioning.packs?.find((size) => quantity % size === 0);
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

export interface CurrentPack {
  /** The pack in use: the opened one, or the next whole one. */
  pack: PackLeft;
  /** Whole packs waiting behind it. */
  behind: number;
}

/**
 * The pack the ring on the item page shows. Counted in packs (ADR-0066) it is the opened pack,
 * «7 von 10», with the whole packs behind it; otherwise everything that came home (ADR-0063).
 */
export function currentPack(item: {
  quantity: number;
  unit: Unit;
  takenQuantity?: number | undefined;
  piecesPerPack?: number | undefined;
}): CurrentPack | undefined {
  const content = packContent(item);
  if (content === undefined || item.unit !== 'pcs') {
    const pack = packLeft(item);
    return pack === undefined ? undefined : { pack, behind: 0 };
  }
  if (item.quantity <= 0) {
    return undefined;
  }
  return content.open > 0
    ? { pack: { start: content.perPack, left: content.open }, behind: content.full }
    : { pack: { start: content.perPack, left: content.perPack }, behind: content.full - 1 };
}
