import 'fake-indexeddb/auto';
import { addDays } from '@fridgeai/core';
import { cleanup, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';
import { afterEach, describe, expect, it } from 'vitest';
import { AppDataProvider } from '../../app/AppData';
import { messages } from '../../app/messages.de-CH';
import { browserClock, browserIds } from '../../data/adapters';
import { ensureLocalHousehold } from '../../data/bootstrap';
import type { FridgeDb } from '../../data/db';
import { createInventoryHandlers } from '../../data/handlers';
import { testDb } from '../../data/test-helpers';
import { ClimateCard } from './ClimateCard';
import { ClimatePage } from './ClimatePage';

const t = messages.climate;

/** Joghurt (last day, rescued) and Vollmilch (entsorgt), both closed today. */
async function dbWith(outcomes: { name: string; rescued: boolean; wasted?: boolean }[]) {
  const db = testDb();
  const profile = await ensureLocalHousehold(db, browserClock, browserIds, {
    household: messages.defaults.householdName,
    member: messages.defaults.memberName,
  });
  const handlers = createInventoryHandlers({
    db,
    clock: browserClock,
    ids: browserIds,
    actor: profile.member.id,
  });
  for (const { name, rescued, wasted = false } of outcomes) {
    const { itemId } = await handlers['inventory.addItem']({
      commandId: browserIds.next(),
      householdId: profile.household.id,
      name,
      location: 'fridge',
      expiresOn: addDays(browserClock.today(), 0),
      expirySource: 'manual',
    });
    await handlers['inventory.recordOutcome']({
      commandId: browserIds.next(),
      householdId: profile.household.id,
      itemId,
      outcome: wasted ? 'wasted' : 'eaten',
      ...(rescued ? { rescued: true } : {}),
    });
  }
  return db;
}

function renderIn(db: FridgeDb, children: React.ReactNode) {
  render(
    <AppDataProvider db={db}>
      <MemoryRouter>{children}</MemoryRouter>
    </AppDataProvider>,
  );
}

describe('ClimateCard', () => {
  afterEach(cleanup);

  it('is hidden while nothing was rescued', async () => {
    const db = await dbWith([{ name: 'Vollmilch', rescued: false, wasted: true }]);
    renderIn(db, <ClimateCard />);
    // Give the live queries a moment, then there is still nothing.
    await new Promise((resolve) => setTimeout(resolve, 100));
    expect(screen.queryByRole('heading', { name: t.title })).toBeNull();
  });

  it('shows the month in one line, with weight, CO₂e and water, and a link', async () => {
    const db = await dbWith([{ name: 'Joghurt', rescued: true }]);
    renderIn(db, <ClimateCard />);
    expect(await screen.findByRole('heading', { name: t.title })).toBeDefined();
    expect(screen.getByText(`${t.cardMonth}:`, { exact: false })).toBeDefined();
    expect(screen.getByText(/ CO₂e · .* l Wasser/, { exact: false })).toBeDefined();
    expect(screen.getByRole('link', { name: t.cardLink }).getAttribute('href')).toBe(
      '/more/climate',
    );
  });
});

describe('ClimatePage', () => {
  afterEach(cleanup);

  it('explains the empty state and still shows how it is calculated', async () => {
    renderIn(await dbWith([]), <ClimatePage />);
    expect(await screen.findByText(t.empty)).toBeDefined();
    expect(screen.getByRole('heading', { name: t.methodTitle })).toBeDefined();
    expect(screen.getByText(t.attribution)).toBeDefined();
  });

  it('shows the four tiles, the chart with its text label, the top category and the Kehricht estimate', async () => {
    const db = await dbWith([
      { name: 'Joghurt', rescued: true },
      { name: 'Vollmilch', rescued: false, wasted: true },
    ]);
    renderIn(db, <ClimatePage />);
    const tiles = await screen.findByRole('heading', { name: t.tilesTitle });
    const section = tiles.closest('section');
    if (section === null) {
      throw new Error('The tiles have no section');
    }
    for (const label of Object.values(t.metrics)) {
      expect(within(section).getByText(label)).toBeDefined();
    }

    // The chart is one image; every value is in its label, rescued and entsorgt.
    const chart = screen.getByRole('img', { name: /^Gerettet und entsorgt im Vergleich: / });
    const label = chart.getAttribute('aria-label') ?? '';
    for (const metric of Object.values(t.metrics)) {
      expect(label).toContain(`${metric}: `);
    }
    expect(label).toContain('gerettet,');
    expect(label).toContain('entsorgt');

    expect(screen.getByRole('heading', { name: t.topTitle })).toBeDefined();
    expect(screen.getByRole('heading', { name: t.kehrichtTitle })).toBeDefined();
    expect(screen.getByText(t.kehrichtNote)).toBeDefined();
    expect(screen.getByText(t.attribution)).toBeDefined();
    expect(screen.getByText(/dass Energie fehlt|Energie fehlt/)).toBeDefined();
    const sources = screen.getAllByRole('link', {
      name: /PNAS|Preisüberwacher|Horgen|Maur|Our World/,
    });
    expect(sources.length).toBe(5);
    for (const source of sources) {
      expect(source.getAttribute('rel')).toContain('noopener');
    }
  });

  it('switches the period without errors', async () => {
    const db = await dbWith([{ name: 'Joghurt', rescued: true }]);
    renderIn(db, <ClimatePage />);
    await screen.findByRole('heading', { name: t.tilesTitle });
    await userEvent.click(screen.getByText(t.periodAll));
    expect(await screen.findByRole('heading', { name: t.tilesTitle })).toBeDefined();
  });
});
