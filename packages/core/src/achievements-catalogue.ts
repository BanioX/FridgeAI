/**
 * The achievement catalogue (docs/abzeichen.md): which achievements exist, to which family they
 * belong and where their tiers start. Names and texts live in the app's text catalogue; the
 * thresholds live here, because the computation and the contract need them.
 */
export const ACHIEVEMENT_FAMILIES = ['rescue', 'balance', 'cooking', 'stock'] as const;
export type AchievementFamily = (typeof ACHIEVEMENT_FAMILIES)[number];

interface AchievementSpec {
  readonly id: string;
  readonly family: AchievementFamily;
  /**
   * What each tier needs, in the unit of the achievement: pieces, Rappen, months, whole percent,
   * days, weeks. One entry = a one-time achievement (tier 0 or 1).
   */
  readonly thresholds: readonly [number] | readonly [number, number, number];
}

export const ACHIEVEMENTS = [
  // Retten
  { id: 'first-rescue', family: 'rescue', thresholds: [1] }, // Erste Rettung
  { id: 'rescue-service', family: 'rescue', thresholds: [10, 50, 200] }, // Rettungsdienst
  { id: 'savings', family: 'rescue', thresholds: [2_000, 10_000, 50_000] }, // Sparbuch, in Rappen
  { id: 'last-day', family: 'rescue', thresholds: [5, 20, 50] }, // Auf den letzten Tag
  { id: 'all-senses', family: 'rescue', thresholds: [3, 10, 30] }, // Mit allen Sinnen
  // Bilanz
  { id: 'frugal', family: 'balance', thresholds: [1, 3, 6] }, // Sparsam, in Monaten
  { id: 'nothing-wasted', family: 'balance', thresholds: [1, 3, 6] }, // Nichts entsorgt
  { id: 'progress', family: 'balance', thresholds: [25, 50, 75] }, // Fortschritt, in Prozent
  { id: 'year-end', family: 'balance', thresholds: [365] }, // Jahresabschluss, in Tagen
  // Kochen und Verarbeiten
  { id: 'at-the-stove', family: 'cooking', thresholds: [1, 10, 50] }, // Am Herd
  { id: 'bakery', family: 'cooking', thresholds: [1, 5, 20] }, // Backstube
  { id: 'leftover-kitchen', family: 'cooking', thresholds: [5, 20, 50] }, // Resteküche
  { id: 'own-cookbook', family: 'cooking', thresholds: [1, 5, 20] }, // Eigenes Kochbuch
  // Vorrat
  { id: 'foresight', family: 'stock', thresholds: [5, 20, 50] }, // Vorausschauend
  { id: 'overview', family: 'stock', thresholds: [30] }, // Alles im Blick, in Tagen
  { id: 'loyal', family: 'stock', thresholds: [4, 12, 52] }, // Treu, in Wochen
  { id: 'survival', family: 'stock', thresholds: [2] }, // Überlebenskunst, in erfüllten Teilen
  { id: 'bookkeeping', family: 'stock', thresholds: [1, 10, 50] }, // Buchhaltung
] as const satisfies readonly AchievementSpec[];

export type AchievementId = (typeof ACHIEVEMENTS)[number]['id'];

export const ACHIEVEMENT_IDS = ACHIEVEMENTS.map((achievement) => achievement.id) as [
  AchievementId,
  ...AchievementId[],
];
