import 'fake-indexeddb/auto';
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, useLocation } from 'react-router';
import { afterEach, describe, expect, it } from 'vitest';
import { AppDataProvider } from '../../app/AppData';
import { messages } from '../../app/messages.de-CH';
import { testDb } from '../../data/test-helpers';
import { AddItemPage } from './AddItemPage';

const t = messages.addItem;

function Where() {
  const location = useLocation();
  return <output data-testid="where">{`${location.pathname}${location.search}`}</output>;
}

async function renderPage(path = '/inventory/new') {
  render(
    <AppDataProvider db={testDb()}>
      <MemoryRouter initialEntries={[path]}>
        <AddItemPage />
        <Where />
      </MemoryRouter>
    </AppDataProvider>,
  );
  await screen.findByLabelText(t.name);
}

const moreButton = () => screen.getByText(new RegExp(`^${t.more}`));

describe('AddItemPage', () => {
  afterEach(cleanup);

  it('shows name, expiry and amount by default, the rest under «Mehr Angaben»', async () => {
    await renderPage();
    expect(screen.getByLabelText(t.name)).toBeDefined();
    expect(screen.getByLabelText(t.amount)).toBeDefined();
    expect(screen.getByText(t.expiry)).toBeDefined();
    // Closed disclosure: location, price and category are not reachable.
    const details = moreButton().closest('details');
    expect(details?.open).toBe(false);
    expect(details?.contains(screen.getByText(t.location))).toBe(true);
    expect(details?.contains(screen.getByLabelText(t.price))).toBe(true);
    expect(details?.contains(screen.getByLabelText(t.category))).toBe(true);
  });

  it("puts unknown food in the fridge, not in the fallback category's pantry", async () => {
    await renderPage();
    expect(moreButton().textContent).toBe(t.moreWith(messages.locations.fridge));
    await userEvent.type(screen.getByLabelText(t.name), 'Hummus nach Grossmutters Art');
    expect(moreButton().textContent).toBe(t.moreWith(messages.locations.fridge));
  });

  it('has no barcode button, no quick add and one save button', async () => {
    await renderPage();
    expect(screen.queryByRole('button', { name: messages.scanner.open })).toBeNull();
    expect(screen.queryByText(messages.quickAdd.title)).toBeNull();
    expect(screen.getAllByRole('button', { name: t.save })).toHaveLength(1);
  });

  it('summarises the location from the URL and a price on the disclosure button', async () => {
    await renderPage('/inventory/new?location=freezer');
    expect(moreButton().textContent).toBe(t.moreWith('Tiefkühler'));
    await userEvent.click(moreButton());
    await userEvent.type(screen.getByLabelText(t.price), '3.95');
    expect(moreButton().textContent).toBe(t.moreWith('Tiefkühler, CHF 3.95'));
  });

  it('follows the category suggestion in the summary until a location is chosen', async () => {
    await renderPage();
    expect(moreButton().textContent).toBe(t.moreWith('Kühlschrank'));
    await userEvent.type(screen.getByLabelText(t.name), 'Spaghetti');
    expect(moreButton().textContent).toBe(t.moreWith('Vorrat'));
  });

  it('opens «Mehr Angaben» when the price is invalid on save', async () => {
    await renderPage();
    await userEvent.type(screen.getByLabelText(t.name), 'Butter');
    await userEvent.click(moreButton());
    await userEvent.type(screen.getByLabelText(t.price), 'abc');
    await userEvent.click(screen.getByRole('button', { name: t.save }));
    expect(screen.getByText(t.priceInvalid)).toBeDefined();
    expect(screen.getByTestId('where').textContent).toBe('/inventory/new');
  });

  it('saves with the one button and goes to the inventory tab of the location', async () => {
    await renderPage();
    await userEvent.type(screen.getByLabelText(t.name), 'Butter');
    await userEvent.click(screen.getByRole('button', { name: t.save }));
    expect(await screen.findByText('/inventory?location=fridge')).toBeDefined();
  });
});
