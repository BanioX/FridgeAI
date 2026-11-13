import { addDays } from './dates';
import type { LocalDate } from './model/primitives';

/** The first question comes after a week of use, later ones at most every two weeks (ADR-0089). */
export const FIRST_ASK_AFTER_DAYS = 7;
export const ASK_AGAIN_AFTER_DAYS = 14;

export interface FeedbackAskState {
  /** The day Rettich was first used on this device (the household's creation). */
  firstUseOn: LocalDate;
  today: LocalDate;
  /** The day of the last saved answer, if any. */
  lastAnsweredOn?: LocalDate;
  /** «Später»: not before this day. */
  snoozedUntil?: LocalDate;
  /** «Nicht mehr fragen». */
  never: boolean;
}

/** Whether Start asks the one question today. */
export function shouldAskFeedback(state: FeedbackAskState): boolean {
  if (state.never) {
    return false;
  }
  if (state.snoozedUntil !== undefined && state.today < state.snoozedUntil) {
    return false;
  }
  if (state.lastAnsweredOn !== undefined) {
    return state.today >= addDays(state.lastAnsweredOn, ASK_AGAIN_AFTER_DAYS);
  }
  return state.today >= addDays(state.firstUseOn, FIRST_ASK_AFTER_DAYS);
}
