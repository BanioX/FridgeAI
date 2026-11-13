import 'fake-indexeddb/auto';
import { parseReceiptText, type Id } from '@fridgeai/core';
import { cleanup, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useEffect, useState } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { AppDataProvider, useAppData } from '../../app/AppData';
import { messages } from '../../app/messages.de-CH';
import { testDb } from '../../data/test-helpers';
import { ReceiptCards } from './ReceiptCards';
import { chosenExpiry, locationOf, type CardSection } from './receipt-cards';
import { useReceiptMatching, type ReceiptMatching } from './ReceiptMatch';
import { isFood, type Review } from './ReceiptReview';

const t = messages.receiptUpload.cards;

const TEXT = [
  'Musterstadt Zentrum',
  '05.11.26 18:47 00123 00456789 001 0001234',
  'Artikel Menge Preis Aktion Total Zusatz',
  'Semmeli 80G 2.0 0.70 1.40 0 A',
  'Coop Pouletbrust 2St. ca. 330g 0.307 10.40 8.30 8.30 0 A',
  'Shampoo Classic 1.0 2.95 2.95 1 A',
  'Total CHF 12.65',
].join('\n');

function startReview(): Review {
  const receipt = parseReceiptText(TEXT);
  return {
    receipt,
    hash: 'a'.repeat(64),
    source: 'pdf',
    commandId: 'cmd' as Id,
    chosen: new Set(receipt.lines.flatMap((line, index) => (isFood(line) ? [index] : []))),
    memory: new Map(),
  };
}

let latest: Review = startReview();
const onTake = vi.fn();

function Harness() {
  const { today } = useAppData();
  const [sections, setSections] = useState<readonly CardSection[]>([
    { key: 'receipt-0', review: startReview(), excluded: false },
  ]);
  const matching: ReceiptMatching = useReceiptMatching();
  useEffect(() => {
    latest = sections[0]?.review ?? latest;
  });
  return (
    <ReceiptCards
      sections={sections}
      matchingOf={() => matching}
      today={today}
      onReview={(key, review) => {
        setSections((previous) =>
          previous.map((section) => (section.key === key ? { ...section, review } : section)),
        );
      }}
      onClose={() => undefined}
      onTake={onTake}
      takeLabel="1 Artikel übernehmen"
      takeDisabled={false}
    />
  );
}

async function open() {
  render(
    <AppDataProvider db={testDb()}>
      <Harness />
    </AppDataProvider>,
  );
  await screen.findByRole('dialog', { name: t.title });
}

afterEach(() => {
  cleanup();
  onTake.mockClear();
});

describe('ReceiptCards', () => {
  it('shows «1 von 2» and the first food line, and moves focus to the card heading', async () => {
    await open();
    expect(screen.getByText(t.progress(1, 2))).toBeTruthy();
    const heading = screen.getByRole('heading', { level: 3, name: 'Semmeli 80G' });
    await waitFor(() => {
      expect(document.activeElement).toBe(heading);
    });
    // Not food: no card.
    expect(screen.queryByText('Shampoo Classic')).toBeNull();
  });

  it('«Übernehmen» goes to the next card; place and date are on the card', async () => {
    const user = userEvent.setup();
    await open();
    await user.click(screen.getByRole('button', { name: t.take }));
    expect(screen.getByText(t.progress(2, 2))).toBeTruthy();
    expect(screen.getByRole('heading', { level: 3, name: /Pouletbrust/ })).toBeTruthy();
    expect(screen.getByRole('radio', { name: 'Kühlschrank' })).toHaveProperty('checked', true);
    expect(screen.getByLabelText(t.expiry)).toBeTruthy();
    await user.click(screen.getByRole('radio', { name: 'Tiefkühler' }));
    const index = latest.receipt.lines.findIndex((line) => line.name.includes('Pouletbrust'));
    expect(locationOf(latest, index)).toBe('freezer');
    // Zurück keeps the choice.
    await user.click(screen.getByRole('button', { name: t.back }));
    expect(screen.getByText(t.progress(1, 2))).toBeTruthy();
    expect(screen.getByRole('button', { name: t.back })).toHaveProperty('disabled', true);
  });

  it('a typed date is kept as the chosen date', async () => {
    const user = userEvent.setup();
    await open();
    const field = screen.getByLabelText(t.expiry);
    await user.clear(field);
    await user.type(field, '24.12.2030');
    const index = latest.receipt.lines.findIndex((line) => line.name.includes('Semmeli'));
    expect(chosenExpiry(latest, index)).toBe('2030-12-24');
  });

  it('«Nicht in den Vorrat» unticks the line and the summary counts it', async () => {
    const user = userEvent.setup();
    await open();
    await user.click(screen.getByRole('button', { name: t.skip }));
    const bread = latest.receipt.lines.findIndex((line) => line.name.includes('Semmeli'));
    expect(latest.chosen.has(bread)).toBe(false);
    await user.click(screen.getByRole('button', { name: t.take }));
    expect(screen.getByText(t.progress(2, 2))).toBeTruthy();
    const summary = screen.getByRole('heading', { level: 3, name: t.summaryTitle });
    expect(summary).toBeTruthy();
    expect(screen.getByText(t.summary(1, 1))).toBeTruthy();
    // The last card's progress stays at the total; the take action is the list's.
    const dialog = screen.getByRole('dialog');
    await user.click(within(dialog).getByRole('button', { name: '1 Artikel übernehmen' }));
    expect(onTake).toHaveBeenCalledTimes(1);
  });

  it('lists what goes where at the end, and a tap leads back to that card', async () => {
    const user = userEvent.setup();
    await open();
    await user.click(screen.getByRole('button', { name: t.skip }));
    await user.click(screen.getByRole('radio', { name: 'Tiefkühler' }));
    await user.click(screen.getByRole('button', { name: t.take }));
    const list = screen.getByRole('list', { name: t.summaryList });
    const [chicken, bread] = within(list).getAllByRole('button');
    // Kept lines first, with place and date; the left-out line after them.
    expect(chicken?.textContent).toMatch(
      /Pouletbrust.*Tiefkühler · bis \d{2}\.\d{2}\.\d{4}.*8\.30/,
    );
    expect(bread?.textContent).toMatch(new RegExp(`Semmeli 80G.*${t.leftOut}`));
    if (bread === undefined) throw new Error('no row');
    await user.click(bread);
    expect(screen.getByText(t.progress(1, 2))).toBeTruthy();
    expect(screen.getByRole('heading', { level: 3, name: 'Semmeli 80G' })).toBeTruthy();
  });
});
