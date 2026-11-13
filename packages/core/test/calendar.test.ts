import { describe, expect, it } from 'vitest';
import {
  calendarReminderFile,
  escapeCalendarText,
  foldCalendarLine,
  localDate,
  reminderDay,
} from '../src';

const file = () =>
  calendarReminderFile({
    uid: 'item-1-2026-11-16@rettich',
    title: 'Rettich: Joghurt, Natur; läuft morgen ab',
    description: 'Im Kühlschrank.\nHaltbar bis 17.11.2026.',
    on: localDate('2026-11-16'),
    at: '18:00',
    minutes: 15,
    now: new Date('2026-11-13T20:05:09.123Z'),
  });

describe('calendar reminder', () => {
  it('writes one event at 18:00 Swiss time with an alarm, CRLF line ends', () => {
    const text = file();
    expect(text.endsWith('\r\n')).toBe(true);
    expect(text.split('\r\n').every((line) => !line.includes('\n'))).toBe(true);
    const lines = text.replace(/\r\n /g, '').split('\r\n');
    expect(lines).toContain('DTSTART;TZID=Europe/Zurich:20261116T180000');
    expect(lines).toContain('DTEND;TZID=Europe/Zurich:20261116T181500');
    expect(lines).toContain('DTSTAMP:20261113T200509Z');
    expect(lines).toContain('UID:item-1-2026-11-16@rettich');
    expect(lines).toContain('SUMMARY:Rettich: Joghurt\\, Natur\\; läuft morgen ab');
    expect(lines).toContain('DESCRIPTION:Im Kühlschrank.\\nHaltbar bis 17.11.2026.');
    expect(lines).toContain('TRIGGER:PT0M');
    expect(lines.filter((line) => line === 'BEGIN:VEVENT')).toHaveLength(1);
  });

  it('escapes text and folds long lines at 75 octets, never inside a character', () => {
    expect(escapeCalendarText('a\\b;c,d\ne')).toBe('a\\\\b\\;c\\,d\\ne');
    const folded = foldCalendarLine(`SUMMARY:${'ä'.repeat(60)}`);
    const parts = folded.split('\r\n ');
    expect(parts.length).toBeGreaterThan(1);
    for (const part of parts) {
      expect(new TextEncoder().encode(part).length).toBeLessThanOrEqual(75);
    }
    expect(parts.join('')).toBe(`SUMMARY:${'ä'.repeat(60)}`);
    expect(foldCalendarLine('SHORT:ok')).toBe('SHORT:ok');
  });

  it('reminds on the evening before, not for a day already over', () => {
    const today = localDate('2026-11-13');
    expect(reminderDay(localDate('2026-11-17'), today)).toBe('2026-11-16');
    expect(reminderDay(localDate('2026-11-14'), today)).toBe('2026-11-13');
    expect(reminderDay(localDate('2026-11-13'), today)).toBeNull();
  });

  it('keeps the local time across the change to winter time', () => {
    const text = calendarReminderFile({
      uid: 'x',
      title: 't',
      description: 'd',
      on: localDate('2026-10-25'),
      at: '18:00',
      minutes: 15,
      now: new Date('2026-10-20T10:00:00Z'),
    });
    expect(text).toContain('DTSTART;TZID=Europe/Zurich:20261025T180000');
    expect(text).toContain('RRULE:FREQ=YEARLY;BYMONTH=10;BYDAY=-1SU');
  });
});
