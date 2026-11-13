import {
  fallbackCategory,
  matchCategoryByName,
  type LocalDate,
  type ParsedReceiptLine,
  type Rappen,
  type StorageLocation,
} from '@fridgeai/core';
import { suggestedExpiry } from '../inventory/add-item';
import { isFood, paid, type LineOverride, type Review } from './ReceiptReview';

/** One receipt of the review page, as far as the cards need it. */
export interface CardSection {
  key: string;
  review: Review;
  /** «Diese Quittung nicht übernehmen»: its lines get no card. */
  excluded: boolean;
}

/** One card: a food line of one receipt. */
export interface Card {
  sectionKey: string;
  index: number;
}

/** The places offered as chips, in this order (Notvorrat only when a line is already there). */
export const PLACES: readonly StorageLocation[] = ['fridge', 'pantry', 'freezer'];

/** The food lines of all included receipts, receipt by receipt, in printed order. */
export function buildCards(sections: readonly CardSection[]): Card[] {
  return sections
    .filter((section) => !section.excluded)
    .flatMap((section) =>
      section.review.receipt.lines.flatMap((line, index) =>
        isFood(line) ? [{ sectionKey: section.key, index }] : [],
      ),
    );
}

/** Same lookup as the import: the category by name, else the general one. */
const categoryOf = (line: ParsedReceiptLine) =>
  matchCategoryByName(line.name) ?? fallbackCategory();

/** The line's place: the person's choice, else the category's default as the import used it. */
export function locationOf(review: Review, index: number): StorageLocation {
  const line = review.receipt.lines[index];
  return (
    review.overrides?.get(index)?.location ??
    (line === undefined ? fallbackCategory() : categoryOf(line)).defaultLocation
  );
}

/** The date the person picked, if any; without one the import estimates it. */
export const chosenExpiry = (review: Review, index: number): LocalDate | undefined =>
  review.overrides?.get(index)?.expiresOn;

/** The date the card shows: the person's choice, else the estimate the import would store. */
export function expiryOf(review: Review, index: number, today: LocalDate): LocalDate {
  const line = review.receipt.lines[index];
  return (
    chosenExpiry(review, index) ??
    suggestedExpiry(
      line === undefined ? fallbackCategory() : categoryOf(line),
      locationOf(review, index),
      today,
    )
  );
}

/** The typical shelf life of the line's category, for the date field's quick choices. */
export function categoryFor(review: Review, index: number) {
  const line = review.receipt.lines[index];
  return line === undefined ? fallbackCategory() : categoryOf(line);
}

function withOverride(review: Review, index: number, next: LineOverride | undefined): Review {
  const overrides = new Map(review.overrides);
  if (next === undefined || Object.keys(next).length === 0) {
    overrides.delete(index);
  } else {
    overrides.set(index, next);
  }
  return { ...review, overrides };
}

/** A new place; a date picked for the old place no longer fits, the estimate takes over. */
export function withLocation(review: Review, index: number, location: StorageLocation): Review {
  return withOverride(review, index, { location });
}

export function withExpiry(review: Review, index: number, expiresOn: LocalDate | null): Review {
  const location = review.overrides?.get(index)?.location;
  return withOverride(review, index, {
    ...(location === undefined ? {} : { location }),
    ...(expiresOn === null ? {} : { expiresOn }),
  });
}

/** «Übernehmen» ticks the line, «Nicht in den Vorrat» unticks it: the list shows the same. */
export function withDecision(review: Review, index: number, take: boolean): Review {
  const chosen = new Set(review.chosen);
  if (take) {
    chosen.add(index);
  } else {
    chosen.delete(index);
  }
  return { ...review, chosen };
}

/** How many cards ended in the stock and how many were left out. */
export function summarize(
  sections: readonly CardSection[],
  cards: readonly Card[],
): { taken: number; left: number } {
  const byKey = new Map(sections.map((section) => [section.key, section.review]));
  const taken = cards.filter((card) => byKey.get(card.sectionKey)?.chosen.has(card.index)).length;
  return { taken, left: cards.length - taken };
}

/** One row of the overview after the last card; `position` leads back to its card. */
export interface SummaryRow {
  position: number;
  name: string;
  taken: boolean;
  location: StorageLocation;
  expiresOn: LocalDate;
  paidRappen: Rappen;
}

/** What goes where and until when, the kept lines first, in the order of the cards. */
export function summaryRows(
  sections: readonly CardSection[],
  cards: readonly Card[],
  today: LocalDate,
): SummaryRow[] {
  const byKey = new Map(sections.map((section) => [section.key, section.review]));
  const rows = cards.flatMap((card, position) => {
    const review = byKey.get(card.sectionKey);
    const line = review?.receipt.lines[card.index];
    if (review === undefined || line === undefined) {
      return [];
    }
    return [
      {
        position,
        name: line.name,
        taken: review.chosen.has(card.index),
        location: locationOf(review, card.index),
        expiresOn: expiryOf(review, card.index, today),
        paidRappen: paid(line),
      },
    ];
  });
  return [...rows.filter((row) => row.taken), ...rows.filter((row) => !row.taken)];
}
