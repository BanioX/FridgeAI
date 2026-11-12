import {
  ACHIEVEMENTS,
  formatSwissDate,
  rappen,
  type AchievementId,
  type AchievementState,
} from '@fridgeai/core';
import {
  BookOpen,
  CalendarCheck,
  CalendarClock,
  CircleCheck,
  ClipboardCheck,
  Coins,
  CookingPot,
  Croissant,
  Eye,
  LifeBuoy,
  PiggyBank,
  ReceiptText,
  ScanEye,
  Snowflake,
  Soup,
  Sprout,
  Tent,
  TrendingDown,
  type LucideIcon,
} from 'lucide-react';
import { messages } from '../../app/messages.de-CH';
import type { Money } from '../../app/money-format';
import type { MedalLook } from '../../ui/Medal';

const t = messages.achievements;

/** The Lucide symbol of each achievement (docs/abzeichen.md). */
export const ACHIEVEMENT_ICONS: Record<AchievementId, LucideIcon> = {
  'first-rescue': Sprout,
  'rescue-service': LifeBuoy,
  savings: PiggyBank,
  'last-day': CalendarClock,
  'all-senses': ScanEye,
  frugal: Coins,
  'nothing-wasted': CircleCheck,
  progress: TrendingDown,
  'year-end': CalendarCheck,
  'at-the-stove': CookingPot,
  bakery: Croissant,
  'leftover-kitchen': Soup,
  'own-cookbook': BookOpen,
  foresight: Snowflake,
  overview: Eye,
  loyal: ClipboardCheck,
  survival: Tent,
  bookkeeping: ReceiptText,
};

export interface AchievementView {
  id: AchievementId;
  name: string;
  about: string;
  look: MedalLook;
  /** How far the arc of an open medal goes, 0 to 1. */
  fraction: number;
  /** «noch 3 Rettungen» while the next tier is open; null at the top. */
  missing: string | null;
  /** The full spoken text: «Resteküche, Stufe II, freigeschaltet am 4.12.2026». */
  label: string;
  state: AchievementState;
}

const LOOKS = ['open', 'silver', 'emerald', 'onyx'] as const;

/** Everything the medal and the page say about one achievement. */
export function viewOf(state: AchievementState, money: Money): AchievementView {
  const spec = ACHIEVEMENTS.find((entry) => entry.id === state.id);
  const oneTime = spec?.thresholds.length === 1;
  const name = t.names[state.id];
  const { current, next } = state.progress;
  const missing =
    next === null
      ? null
      : t.missing[state.id](Math.max(1, Math.ceil(next - current)), {
          amount: money.format(rappen(Math.max(0, next - current))),
          current,
          next,
        });
  const look: MedalLook = state.tier === 0 ? 'open' : oneTime ? 'emerald' : LOOKS[state.tier];
  const reached = state.tier > 0 && state.reachedOn !== null;
  return {
    id: state.id,
    name,
    about: t.about[state.id],
    look,
    fraction: next === null ? 1 : Math.min(1, Math.max(0, current / next)),
    missing,
    label:
      reached && state.reachedOn !== null
        ? t.reachedLabel(
            name,
            oneTime ? '' : t.stages[state.tier],
            formatSwissDate(state.reachedOn),
          ) + (missing === null ? '' : `, ${missing}`)
        : t.openLabel(name, missing ?? ''),
    state,
  };
}
