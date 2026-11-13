import 'fake-indexeddb/auto';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AppDataProvider } from '../../app/AppData';
import { messages } from '../../app/messages.de-CH';
import { seedDb } from '../../app/test-seed';
import { testDb } from '../../data/test-helpers';
import { nextTimeTip } from './RescueMoment';
import { TodayPage } from './TodayPage';

const WIDTH = 300;
const t = messages.ritual;

async function renderStart(items: Parameters<typeof seedDb>[1]) {
  const db = testDb();
  await seedDb(db, items);
  render(
    <AppDataProvider db={db}>
      <MemoryRouter>
        <TodayPage />
      </MemoryRouter>
    </AppDataProvider>,
  );
  return db;
}

/** Swipe a row of «Heute retten»: to the left to rescue, to the right to throw away. */
function swipe(name: string, direction: 'left' | 'right') {
  const row = screen.getByRole('link', { name: new RegExp(name) });
  const [from, to] = direction === 'left' ? [250, 100] : [50, 220];
  const at = (type: 'pointerDown' | 'pointerMove' | 'pointerUp', x: number) => {
    fireEvent[type](row, { pointerId: 1, pointerType: 'touch', isPrimary: true, clientX: x });
  };
  at('pointerDown', from);
  at('pointerMove', (from + to) / 2);
  at('pointerMove', to);
  at('pointerUp', to);
}

describe('the ritual on Start (ADR-0084)', () => {
  beforeEach(() => {
    window.localStorage.clear();
    vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockReturnValue({
      width: WIDTH,
    } as DOMRect);
  });
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('counts what is used from «Heute retten» as rescued and celebrates it', async () => {
    const db = await renderStart([
      { name: 'Joghurt', location: 'fridge', inDays: 0, priceRappen: 120 },
    ]);
    await screen.findByText('Joghurt');
    swipe('Joghurt', 'left');
    const moment = await screen.findByText(t.rescued, { selector: 'p' });
    expect(moment).toBeDefined();
    expect(screen.getByText(/^Joghurt · CHF 1\.20$/)).toBeDefined();
    expect(await screen.findByText(/^Deine erste Rettung diesen Monat · CHF 1\.20$/)).toBeDefined();
    const [outcome] = await db.outcomes.toArray();
    expect(outcome).toMatchObject({ outcome: 'eaten', rescued: true });
  });

  it('meets a loss with an honest moment and a tip for next time, and undoes it', async () => {
    await renderStart([{ name: 'Hackfleisch', location: 'fridge', inDays: 0, priceRappen: 450 }]);
    await screen.findByText('Hackfleisch');
    swipe('Hackfleisch', 'right');
    expect(await screen.findByText(t.wasted, { selector: 'p' })).toBeDefined();
    expect(screen.getByText(/^Hackfleisch · CHF 4\.50 im Abfall$/)).toBeDefined();
    expect(screen.getByText(t.freezeNext)).toBeDefined();
    fireEvent.click(screen.getByRole('button', { name: messages.inventory.undo }));
    await waitFor(() => {
      expect(screen.queryByText(t.wasted, { selector: 'p' })).toBeNull();
    });
    expect(await screen.findByRole('link', { name: /Hackfleisch/ })).toBeDefined();
  });

  it('picks a tip that helps: freeze it, a tip of the category, or a kind nudge', () => {
    expect(nextTimeTip({ categoryId: 'meat-minced', location: 'fridge', valueRappen: 0 })).toBe(
      t.freezeNext,
    );
    const tip = nextTimeTip({ categoryId: 'meat-minced', location: 'freezer', valueRappen: 1 });
    expect(tip).not.toBe(t.freezeNext);
    expect(tip.length).toBeGreaterThan(0);
  });
});
