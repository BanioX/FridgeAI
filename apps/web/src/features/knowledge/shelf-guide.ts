import {
  CATEGORIES,
  normalizeFoodText,
  perishabilityOf,
  shelfScore,
  type Category,
  type CategoryGroup,
  type Perishability,
  type StorageLocation,
} from '@fridgeai/core';

/** One line of «Haltbarkeit A–Z» (ADR-0041): what keeps how long, open and frozen. */
export interface GuideEntry {
  id: string;
  name: string;
  emoji: string;
  score: number;
  level: Perishability;
  /** Unopened at its best place (fridge or pantry; the freezer only for frozen food). */
  keeps: { days: number; at: StorageLocation } | null;
  openedDays?: number;
  freezerDays: number | null;
  tips: readonly string[];
}

export interface GuideGroup {
  group: CategoryGroup;
  entries: GuideEntry[];
}

/** The order of the groups: what spoils first comes first (Alban: «Kühlschrank zuerst»). */
const GROUP_ORDER: readonly CategoryGroup[] = [
  'dairy',
  'meat',
  'fish',
  'produce',
  'bakery',
  'prepared',
  'pantry',
  'drinks',
  'frozen',
  'reserve',
];

function keeps(category: Category): GuideEntry['keeps'] {
  const { fridge, pantry, freezer } = category.shelfLifeDays;
  const places: [StorageLocation, number | null][] = [
    ['fridge', fridge],
    ['pantry', pantry],
  ];
  const best = places
    .filter((place): place is [StorageLocation, number] => place[1] !== null)
    .sort((a, b) => b[1] - a[1])[0];
  if (best !== undefined) {
    return { days: best[1], at: best[0] };
  }
  return freezer === null ? null : { days: freezer, at: 'freezer' };
}

function entryOf(category: Category): GuideEntry {
  const score = shelfScore(category);
  const freezer = category.shelfLifeDays.freezer;
  const kept = keeps(category);
  return {
    id: category.id,
    name: category.name.de,
    emoji: category.emoji,
    score,
    level: perishabilityOf(score),
    keeps: kept,
    ...(category.afterOpeningDays === undefined ? {} : { openedDays: category.afterOpeningDays }),
    // Frozen food keeps in the freezer anyway; «einfrieren» is about fresh food.
    freezerDays: kept?.at === 'freezer' ? null : freezer,
    tips: category.tips.de,
  };
}

/** «Käse», «Kaese» and «Kase» all find «Hartkäse»: umlauts folded either way. */
const fold = (text: string) => normalizeFoodText(text).replace(/([aou])e/g, '$1');

/**
 * The food categories grouped and sorted by name, filtered by a search («joghurt», «Pesto»):
 * name and catalog keywords count, umlauts and case do not. Non-food is left out.
 */
export function shelfGuide(query = ''): GuideGroup[] {
  const needle = fold(query);
  const matches = (category: Category) =>
    needle === '' ||
    [category.name.de, ...category.keywords].some((word) => fold(word).includes(needle));
  return GROUP_ORDER.map((group) => ({
    group,
    entries: CATEGORIES.filter(
      (category) => category.group === group && category.isFood && matches(category),
    )
      .map(entryOf)
      .sort((a, b) => a.name.localeCompare(b.name, 'de-CH')),
  })).filter((group) => group.entries.length > 0);
}

/** «etwa 3 Tage», «etwa 2 Wochen», «etwa 6 Monate», «etwa 2 Jahre». */
export function describeDays(days: number): string {
  if (days < 14) {
    return days === 1 ? 'etwa 1 Tag' : `etwa ${String(days)} Tage`;
  }
  if (days < 60) {
    return `etwa ${String(Math.round(days / 7))} Wochen`;
  }
  if (days < 730) {
    return `etwa ${String(Math.round(days / 30))} Monate`;
  }
  return `etwa ${String(Math.round(days / 365))} Jahre`;
}
