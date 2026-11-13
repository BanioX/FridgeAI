import { addDays } from './dates';
import type { LocalDate } from './model/primitives';

/** Monday is 0, Sunday 6. */
export function weekdayIndex(day: LocalDate): number {
  return (new Date(`${day}T12:00:00Z`).getUTCDay() + 6) % 7;
}

/** The calendar week before the one `today` lies in, Monday to Sunday (ADR-0090). */
export function previousWeek(today: LocalDate): { from: LocalDate; to: LocalDate } {
  const from = addDays(today, -(weekdayIndex(today) + 7));
  return { from, to: addDays(from, 6) };
}

/** The look back stands on Start from Monday to Wednesday, then it has had its moment. */
export const isWeekReviewDay = (today: LocalDate) => weekdayIndex(today) <= 2;
