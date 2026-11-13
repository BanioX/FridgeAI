import { addDays, HOME_TIME_ZONE } from './dates';
import type { LocalDate } from './model/primitives';

/**
 * A reminder as a calendar file (RFC 5545, ADR-0090): one event in local Swiss time with an alarm
 * at its start. The file is made on the device; it only leaves it if the person saves it.
 */
export interface CalendarReminder {
  /** Stable for the same item and day, so a second file updates the event instead of doubling it. */
  uid: string;
  title: string;
  description: string;
  /** Day and local time of the event, Europe/Zurich. */
  on: LocalDate;
  at: `${number}:${number}`;
  minutes: number;
  /** When the file was made (DTSTAMP). */
  now: Date;
}

/** Central European time with its summer time rule, so calendars need nothing else. */
const ZURICH = [
  'BEGIN:VTIMEZONE',
  `TZID:${HOME_TIME_ZONE}`,
  'BEGIN:DAYLIGHT',
  'TZOFFSETFROM:+0100',
  'TZOFFSETTO:+0200',
  'TZNAME:CEST',
  'DTSTART:19700329T020000',
  'RRULE:FREQ=YEARLY;BYMONTH=3;BYDAY=-1SU',
  'END:DAYLIGHT',
  'BEGIN:STANDARD',
  'TZOFFSETFROM:+0200',
  'TZOFFSETTO:+0100',
  'TZNAME:CET',
  'DTSTART:19701025T030000',
  'RRULE:FREQ=YEARLY;BYMONTH=10;BYDAY=-1SU',
  'END:STANDARD',
  'END:VTIMEZONE',
];

/** Text values: backslash, semicolon, comma and line breaks are escaped. */
export function escapeCalendarText(text: string): string {
  return text
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\r?\n/g, '\\n');
}

/** Lines longer than 75 octets continue on the next line after one space (never inside a character). */
export function foldCalendarLine(line: string): string {
  const parts: string[] = [];
  let current = '';
  let octets = 0;
  for (const character of line) {
    const size = utf8Length(character.codePointAt(0) ?? 0);
    const limit = parts.length === 0 ? 75 : 74;
    if (octets + size > limit) {
      parts.push(current);
      current = '';
      octets = 0;
    }
    current += character;
    octets += size;
  }
  parts.push(current);
  return parts.join('\r\n ');
}

/** Octets of one code point in UTF-8 (core has no TextEncoder). */
const utf8Length = (point: number) =>
  point < 0x80 ? 1 : point < 0x800 ? 2 : point < 0x10000 ? 3 : 4;

const pad = (value: number) => String(value).padStart(2, '0');

function localStamp(day: LocalDate, minutesOfDay: number): string {
  const extra = Math.floor(minutesOfDay / (24 * 60));
  const rest = minutesOfDay % (24 * 60);
  const date = addDays(day, extra).replace(/-/g, '');
  return `${date}T${pad(Math.floor(rest / 60))}${pad(rest % 60)}00`;
}

function utcStamp(instant: Date): string {
  return instant
    .toISOString()
    .replace(/[-:]/g, '')
    .replace(/\.\d{3}/, '');
}

/** The whole `.ics` text with CRLF line ends, ready to be saved as a file. */
export function calendarReminderFile(reminder: CalendarReminder): string {
  const [hours = 0, minutes = 0] = reminder.at.split(':').map(Number);
  const start = hours * 60 + minutes;
  const zone = `TZID=${HOME_TIME_ZONE}`;
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Rettich//Erinnerung//DE',
    'CALSCALE:GREGORIAN',
    ...ZURICH,
    'BEGIN:VEVENT',
    `UID:${reminder.uid}`,
    `DTSTAMP:${utcStamp(reminder.now)}`,
    `DTSTART;${zone}:${localStamp(reminder.on, start)}`,
    `DTEND;${zone}:${localStamp(reminder.on, start + reminder.minutes)}`,
    `SUMMARY:${escapeCalendarText(reminder.title)}`,
    `DESCRIPTION:${escapeCalendarText(reminder.description)}`,
    'BEGIN:VALARM',
    'ACTION:DISPLAY',
    'TRIGGER:PT0M',
    `DESCRIPTION:${escapeCalendarText(reminder.title)}`,
    'END:VALARM',
    'END:VEVENT',
    'END:VCALENDAR',
  ];
  return `${lines.map(foldCalendarLine).join('\r\n')}\r\n`;
}

/** The evening before an expiry date, or nothing when that evening is already over (before today). */
export function reminderDay(expiresOn: LocalDate, today: LocalDate): LocalDate | null {
  const evening = addDays(expiresOn, -1);
  return evening < today ? null : evening;
}
