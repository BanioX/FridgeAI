import { addMonths, localDate, startOfMonth, type LocalDate } from '@fridgeai/core';

export type Period = 'month' | 'quarter' | 'year';

/** First day of «Dieser Monat», «Letzte 3 Monate» or «Dieses Jahr» (Swiss calendar days). */
export function periodStart(period: Period, today: LocalDate): LocalDate {
  switch (period) {
    case 'month':
      return startOfMonth(today);
    case 'quarter':
      return startOfMonth(addMonths(today, -2));
    case 'year':
      return localDate(`${today.slice(0, 4)}-01-01`);
  }
}
