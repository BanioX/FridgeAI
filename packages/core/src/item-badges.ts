import { categoryById } from './catalog/match';
import { toLocalDate } from './dates';
import { isReadyMade } from './ready-made';
import type { ItemOrigin } from './model/inventory';
import type { IsoDateTime, LocalDate, StorageLocation } from './model/primitives';

/**
 * Calm state badges of an item (Alban, 11.11.2026). `made` and `leftover` come from «Verarbeiten»
 * (ADR-0052, ADR-0051 Nachtrag).
 */
export type ItemBadge =
  | { kind: 'made' }
  | { kind: 'leftover' }
  | { kind: 'frozen'; on: LocalDate }
  | { kind: 'thawed'; on: LocalDate }
  | { kind: 'ready' }
  | { kind: 'opened'; on: LocalDate }
  | { kind: 'loose' };

export type ItemBadgeKind = ItemBadge['kind'];

/** What the badges need from an item (an `InventoryItem` or its view). */
export interface BadgeSource {
  location: StorageLocation;
  categoryId: string;
  purchasedAt: IsoDateTime;
  frozenOn?: LocalDate | undefined;
  thawedOn?: LocalDate | undefined;
  readyMade?: boolean | undefined;
  openedOn?: LocalDate | undefined;
  origin?: ItemOrigin | undefined;
}

/**
 * The badges of an item in display order: Selbst gemacht or Reste (where it comes from), then
 * Eingefroren or Aufgetaut, Fertigprodukt, then Von der Theke or Geöffnet.
 *
 * - Selbst gemacht / Reste read `origin` (ADR-0052); they come first so a row with the maximum of
 *   two badges still says what the item is.
 * - Eingefroren reads the location, not only `frozenOn` (it can stay set after an undo).
 * - Aufgetaut: `thawedOn` set and the item is out of the freezer.
 * - Von der Theke is not stored on its own (ADR-0038): a pack of a category sold loose that was
 *   opened on the day it came home. It replaces Geöffnet, which it implies.
 * - Fertigprodukt: the item says so, or its category is a ready one (ADR-0053).
 * - A day after `today` (clock skew, imported data) shows no badge.
 */
export function itemBadges(item: BadgeSource, today: LocalDate): ItemBadge[] {
  const badges: ItemBadge[] = [];
  const { frozenOn, thawedOn, openedOn } = item;
  if (item.origin === 'made') {
    badges.push({ kind: 'made' });
  } else if (item.origin === 'leftover') {
    badges.push({ kind: 'leftover' });
  }
  if (item.location === 'freezer' && frozenOn !== undefined && frozenOn <= today) {
    badges.push({ kind: 'frozen', on: frozenOn });
  }
  if (item.location !== 'freezer' && thawedOn !== undefined && thawedOn <= today) {
    badges.push({ kind: 'thawed', on: thawedOn });
  }
  if (isReadyMade(item)) {
    badges.push({ kind: 'ready' });
  }
  if (openedOn !== undefined && openedOn <= today) {
    const loose =
      categoryById(item.categoryId)?.soldLoose === true &&
      openedOn === toLocalDate(item.purchasedAt);
    badges.push(loose ? { kind: 'loose' } : { kind: 'opened', on: openedOn });
  }
  return badges;
}
