import { localDate, type LocalDate } from '@fridgeai/core';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { DateField } from './DateField';
import { describeRelative, nextDateText } from './date-text';

const today = localDate('2026-11-06');

function Harness(props: {
  initial: LocalDate | null;
  location?: 'fridge' | 'reserve';
  onValue?: (value: LocalDate | null) => void;
}) {
  const [value, setValue] = useState(props.initial);
  return (
    <DateField
      label="Ablaufdatum"
      value={value}
      onChange={(next) => {
        setValue(next);
        props.onValue?.(next);
      }}
      today={today}
      location={props.location ?? 'fridge'}
      typicalShelfLifeDays={props.location === 'reserve' ? 9125 : 7}
    />
  );
}

describe('nextDateText', () => {
  it('adds dots while only digits are typed', () => {
    let state = { text: '', autoFormatting: true };
    for (const char of '061126') {
      state = nextDateText(state.text, state.text + char, state.autoFormatting);
    }
    expect(state.text).toBe('06.11.26');
    state = { text: '', autoFormatting: true };
    for (const char of '06112026') {
      state = nextDateText(state.text, state.text + char, state.autoFormatting);
    }
    expect(state.text).toBe('06.11.2026');
  });

  it('keeps the text as typed once a separator is typed', () => {
    let state = { text: '', autoFormatting: true };
    for (const char of '11.2026') {
      state = nextDateText(state.text, state.text + char, state.autoFormatting);
    }
    expect(state).toEqual({ text: '11.2026', autoFormatting: false });
    expect(nextDateText('6', '6.', true)).toEqual({ text: '6.', autoFormatting: false });
  });

  it('re-groups after deleting and resets when empty', () => {
    expect(nextDateText('06.11.26', '06.11.2', true).text).toBe('06.11.2');
    expect(nextDateText('06.1', '06.', true).text).toBe('06');
    expect(nextDateText('0', '', false)).toEqual({ text: '', autoFormatting: true });
  });
});

describe('describeRelative', () => {
  it.each([
    ['2026-11-06', 'heute'],
    ['2026-11-07', 'morgen'],
    ['2026-11-05', 'gestern'],
    ['2026-11-09', 'in 3 Tagen'],
    ['2026-12-04', 'in 4 Wochen'],
    ['2027-05-06', 'in 6 Monaten'],
    ['2051-11-06', 'in 25 Jahren'],
    ['2026-11-01', 'vor 5 Tagen'],
  ])('describes %s as «%s»', (date, expected) => {
    expect(describeRelative(localDate(date), today)).toBe(expected);
  });
});

describe('DateField', () => {
  afterEach(cleanup);

  it('marks an estimate until the person changes it', async () => {
    render(
      <DateField
        label="Ablaufdatum"
        value={localDate('2026-11-13')}
        onChange={() => undefined}
        today={today}
        location="fridge"
        estimated
      />,
    );
    expect(screen.getByText('geschätzt')).toBeDefined();
    await userEvent.click(screen.getByRole('button', { name: 'morgen' }));
    expect(screen.queryByText('geschätzt')).toBeNull();
  });

  it('shows the suggestion with a readable preview', () => {
    render(<Harness initial={localDate('2026-11-13')} />);
    expect(screen.getByLabelText<HTMLInputElement>('Ablaufdatum').value).toBe('13.11.2026');
    expect(screen.getByText(/in 7 Tagen/)).toBeDefined();
  });

  it('accepts typed digits and reports the parsed date', async () => {
    const onValue = vi.fn();
    render(<Harness initial={null} onValue={onValue} />);
    const input = screen.getByLabelText<HTMLInputElement>('Ablaufdatum');
    await userEvent.type(input, '24122026');
    expect(input.value).toBe('24.12.2026');
    expect(onValue).toHaveBeenLastCalledWith('2026-12-24');
    expect(screen.getByText(/in 7 Wochen/)).toBeDefined();
  });

  it('flags impossible dates', async () => {
    const onValue = vi.fn();
    render(<Harness initial={null} onValue={onValue} />);
    await userEvent.type(screen.getByLabelText('Ablaufdatum'), '31022026');
    expect(onValue).toHaveBeenLastCalledWith(null);
    expect(screen.getByText(/Kein gültiges Datum/)).toBeDefined();
    expect(screen.getByLabelText('Ablaufdatum').getAttribute('aria-invalid')).toBe('true');
  });

  it('sets the date with one tap on a quick choice', async () => {
    render(<Harness initial={null} />);
    await userEvent.click(screen.getByRole('button', { name: 'morgen' }));
    expect(screen.getByLabelText<HTMLInputElement>('Ablaufdatum').value).toBe('07.11.2026');
    expect(screen.getByRole('button', { name: 'morgen' }).getAttribute('aria-pressed')).toBe(
      'true',
    );
  });

  it('offers decades for the Notvorrat', async () => {
    render(<Harness initial={null} location="reserve" />);
    await userEvent.click(screen.getByRole('button', { name: '50 Jahre' }));
    expect(screen.getByLabelText<HTMLInputElement>('Ablaufdatum').value).toBe('06.11.2076');
    expect(screen.getByText(/in 50 Jahren/)).toBeDefined();
  });

  it('takes the date from the calendar field, which lies on the calendar symbol for iPhone taps', () => {
    const onValue = vi.fn();
    render(<Harness initial={null} onValue={onValue} />);
    const calendar = screen.getByLabelText<HTMLInputElement>('Kalender öffnen');
    // A real, tappable date field (not hidden off-screen): iOS opens its wheel only for those.
    expect(calendar.type).toBe('date');
    expect(calendar.className).toContain('inset-0');
    expect(calendar.tabIndex).not.toBe(-1);
    fireEvent.change(calendar, { target: { value: '2026-12-24' } });
    expect(onValue).toHaveBeenLastCalledWith('2026-12-24');
    expect(screen.getByLabelText<HTMLInputElement>('Ablaufdatum').value).toBe('24.12.2026');
  });
});
