import { categoryById } from './catalog/match';
import { toLocalDate } from './dates';
import type { IsoDateTime, LocalDate, StorageLocation } from './model/primitives';

/**
 * Calm state badges of an item (Alban, 11.11.2026). Kinds `made`, `leftover` and `ready` follow
 * with the features that set them; the union grows, nothing else changes.
 */
export type ItemBadge =
  | { kind: 'frozen'; on: LocalDate }
  | { kind: 'thawed'; on: LocalDate }
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
  openedOn?: LocalDate | undefined;
}

/**
 * The badges of an item in display order: Eingefroren or Aufgetaut, then Von der Theke or Geöffnet.
 *
 * - Eingefroren reads the location, not only `frozenOn` (it can stay set after an undo).
 * - Aufgetaut: `thawedOn` set and the item is out of the freezer.
 * - Von der Theke is not stored on its own (ADR-0038): a pack of a category sold loose that was
 *   opened on the day it came home. It replaces Geöffnet, which it implies.
 * - A day after `today` (clock skew, imported data) shows no badge.
 */
export function itemBadges(item: BadgeSource, today: LocalDate): ItemBadge[] {
  const badges: ItemBadge[] = [];
  const { frozenOn, thawedOn, openedOn } = item;
  if (item.location === 'freezer' && frozenOn !== undefined && frozenOn <= today) {
    badges.push({ kind: 'frozen', on: frozenOn });
  }
  if (item.location !== 'freezer' && thawedOn !== undefined && thawedOn <= today) {
    badges.push({ kind: 'thawed', on: thawedOn });
  }
  if (openedOn !== undefined && openedOn <= today) {
    const loose =
      categoryById(item.categoryId)?.soldLoose === true &&
      openedOn === toLocalDate(item.purchasedAt);
    badges.push(loose ? { kind: 'loose' } : { kind: 'opened', on: openedOn });
  }
  return badges;
}
