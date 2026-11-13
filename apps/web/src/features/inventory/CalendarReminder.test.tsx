import { localDate, type Id } from '@fridgeai/core';
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { messages } from '../../app/messages.de-CH';
import { CalendarReminder, calendarFileName } from './CalendarReminder';

const t = messages.itemDetail;
const today = localDate('2026-11-13');
const item = (expiresOn: string) => ({
  id: 'item-1' as Id,
  name: 'Joghurt Nature',
  expiresOn: localDate(expiresOn),
  location: 'fridge' as const,
});

describe('CalendarReminder', () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('saves a calendar file for the evening before, made on the device', async () => {
    const blobs: Blob[] = [];
    vi.spyOn(URL, 'createObjectURL').mockImplementation((blob) => {
      blobs.push(blob as Blob);
      return 'blob:rettich';
    });
    vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => undefined);
    const clicked = vi
      .spyOn(HTMLAnchorElement.prototype, 'click')
      .mockImplementation(() => undefined);
    render(<CalendarReminder item={item('2026-11-17')} today={today} />);
    expect(screen.getByText(t.calendarHint)).toBeTruthy();
    await userEvent.click(screen.getByRole('button', { name: t.calendar }));
    expect(clicked).toHaveBeenCalledTimes(1);
    const [blob] = blobs;
    expect(blob?.type).toBe('text/calendar;charset=utf-8');
    const text = await blob?.text();
    expect(text).toContain('DTSTART;TZID=Europe/Zurich:20261116T180000');
    expect(text).toContain('SUMMARY:Rettich: Joghurt Nature läuft morgen ab');
    expect(text).toContain('DESCRIPTION:Kühlschrank. Haltbar bis 17.11.2026.');
  });

  it('offers nothing when the evening before is already over', () => {
    render(<CalendarReminder item={item('2026-11-13')} today={today} />);
    expect(screen.queryByRole('button', { name: t.calendar })).toBeNull();
  });

  it('names the file in plain letters', () => {
    expect(calendarFileName('Crème fraîche 25%')).toBe('rettich-creme-fraiche-25.ics');
    expect(calendarFileName('***')).toBe('rettich-erinnerung.ics');
  });
});
