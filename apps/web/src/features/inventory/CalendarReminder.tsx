import {
  calendarReminderFile,
  formatSwissDate,
  reminderDay,
  type Id,
  type LocalDate,
  type StorageLocation,
} from '@fridgeai/core';
import { CalendarPlus } from 'lucide-react';
import { messages } from '../../app/messages.de-CH';
import { Button } from '../../ui/Button';

const t = messages.itemDetail;

interface CalendarReminderProps {
  item: { id: Id; name: string; expiresOn: LocalDate; location: StorageLocation };
  today: LocalDate;
  disabled?: boolean;
}

/** «rettich-joghurt-nature.ics»: plain letters for every calendar app. */
export function calendarFileName(name: string): string {
  const plain = name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
  return `rettich-${plain === '' ? 'erinnerung' : plain}.ics`;
}

/**
 * «Im Kalender erinnern» (ADR-0090): a calendar file for the evening before the date, made on the
 * device. The phone offers to add it to its calendar; nothing is sent anywhere.
 */
export function CalendarReminder({ item, today, disabled = false }: CalendarReminderProps) {
  const day = reminderDay(item.expiresOn, today);
  if (day === null) {
    return null;
  }
  const save = () => {
    const text = calendarReminderFile({
      uid: `${item.id}-${day}@rettich`,
      title: t.calendarTitle(item.name),
      description: t.calendarText(
        messages.locations[item.location],
        formatSwissDate(item.expiresOn),
      ),
      on: day,
      at: '18:00',
      minutes: 15,
      now: new Date(),
    });
    // A download, not the share sheet: the iPhone opens a calendar file with «Hinzufügen».
    const url = URL.createObjectURL(new Blob([text], { type: 'text/calendar;charset=utf-8' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = calendarFileName(item.name);
    document.body.append(link);
    link.click();
    link.remove();
    setTimeout(() => {
      URL.revokeObjectURL(url);
    }, 1000);
  };
  return (
    <div className="space-y-1">
      <Button variant="secondary" icon={CalendarPlus} fullWidth disabled={disabled} onClick={save}>
        {t.calendar}
      </Button>
      <p className="text-center text-sm text-ink-muted">{t.calendarHint}</p>
    </div>
  );
}
