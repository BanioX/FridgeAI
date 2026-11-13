import {
  daysBetween,
  type ExpiryStatus,
  type LocalDate,
  type StorageLocation,
} from '@fridgeai/core';
import { messages } from '../app/messages.de-CH';
import type { Tone } from './tones';

const t = messages.expiry;

const monthYear = new Intl.DateTimeFormat('de-CH', {
  month: 'long',
  year: 'numeric',
  timeZone: 'UTC',
});
const monthOnly = new Intl.DateTimeFormat('de-CH', { month: 'long', timeZone: 'UTC' });

function toUtcDate(date: LocalDate): Date {
  const [year = 0, month = 1, day = 1] = date.split('-').map(Number);
  return new Date(Date.UTC(year, month - 1, day));
}

/**
 * Tone and label for an item's expiry chip (docs/design.md). Colour always comes with text, and
 * only what is due has a colour (ADR-0075): red for today and past, amber for soon, everything
 * else neutral. Fresh food shows days; freezer and Notvorrat show a calm «bis März» / «bis 2051».
 */
export function expiryBadge(
  status: ExpiryStatus,
  expiresOn: LocalDate,
  today: LocalDate,
  location: StorageLocation,
): { tone: Tone; label: string } {
  switch (status.kind) {
    case 'past_use_by':
      return { tone: 'danger', label: t.doNotEat };
    case 'past_best_before':
      return { tone: 'today', label: t.pastBestBefore(status.daysOver) };
    case 'today':
      return { tone: 'today', label: t.today };
    case 'soon':
      return {
        tone: 'soon',
        label: status.daysLeft === 1 ? t.tomorrow : t.inDays(status.daysLeft),
      };
    case 'fresh':
      break;
  }
  const date = toUtcDate(expiresOn);
  if (location === 'reserve') {
    return { tone: 'neutral', label: t.until(String(date.getUTCFullYear())) };
  }
  if (location === 'freezer') {
    const sameYear = expiresOn.slice(0, 4) === today.slice(0, 4);
    return {
      tone: 'neutral',
      label: t.until(sameYear ? monthOnly.format(date) : monthYear.format(date)),
    };
  }
  const days = daysBetween(today, expiresOn);
  return {
    tone: 'neutral',
    label: days <= 30 ? t.inDays(days) : t.until(monthYear.format(date)),
  };
}
