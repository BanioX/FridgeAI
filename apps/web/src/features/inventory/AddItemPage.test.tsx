import 'fake-indexeddb/auto';
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, useLocation } from 'react-router';
import { addDays, formatSwissDate, toLocalDate } from '@fridgeai/core';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { AppDataProvider } from '../../app/AppData';
import { messages } from '../../app/messages.de-CH';
import { testDb } from '../../data/test-helpers';
import { AddItemPage } from './AddItemPage';

vi.mock('../receipts/read-image', () => ({ readImageText: vi.fn() }));

const t = messages.addItem;

function Where() {
  const location = useLocation();
  return <output data-testid="where">{`${location.pathname}${location.search}`}</output>;
}

async function renderPage(path = '/inventory/new', db = testDb()) {
  render(
    <AppDataProvider db={db}>
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

  it('shows name and expiry by default, the rest under «Mehr Angaben»', async () => {
    await renderPage();
    expect(screen.getByLabelText(t.name)).toBeDefined();
    expect(screen.getByText(t.expiry)).toBeDefined();
    // Closed disclosure: amount, location, price and category wait there (Alban, 7.11.2026).
    const details = moreButton().closest('details');
    expect(details?.open).toBe(false);
    expect(details?.contains(screen.getByLabelText(t.amount))).toBe(true);
    expect(details?.contains(screen.getByText(t.location))).toBe(true);
    expect(details?.contains(screen.getByLabelText(t.price('CHF')))).toBe(true);
    expect(details?.contains(screen.getByLabelText(t.category))).toBe(true);
  });

  it("puts unknown food in the fridge, not in the fallback category's pantry", async () => {
    await renderPage();
    expect(moreButton().textContent).toBe(t.moreWith(`1 Stück, ${messages.locations.fridge}`));
    await userEvent.type(screen.getByLabelText(t.name), 'Kimchi nach Grossmutters Art');
    expect(moreButton().textContent).toBe(t.moreWith(`1 Stück, ${messages.locations.fridge}`));
  });

  it('has no barcode button, no quick add and one save button', async () => {
    await renderPage();
    expect(screen.queryByRole('button', { name: messages.scanner.open })).toBeNull();
    expect(screen.queryByText(messages.quickAdd.title)).toBeNull();
    expect(screen.getAllByRole('button', { name: t.save })).toHaveLength(1);
  });

  it('summarises the location from the URL and a price on the disclosure button', async () => {
    await renderPage('/inventory/new?location=freezer');
    expect(moreButton().textContent).toBe(t.moreWith('1 Stück, Tiefkühler'));
    await userEvent.click(moreButton());
    await userEvent.type(screen.getByLabelText(t.price('CHF')), '3.95');
    expect(moreButton().textContent).toBe(t.moreWith('1 Stück, Tiefkühler, CHF 3.95'));
  });

  it('follows the category suggestion in the summary until a location is chosen', async () => {
    await renderPage();
    expect(moreButton().textContent).toBe(t.moreWith('1 Stück, Kühlschrank'));
    await userEvent.type(screen.getByLabelText(t.name), 'Spaghetti');
    expect(moreButton().textContent).toMatch(/· .*Vorrat$/);
  });

  it('opens «Mehr Angaben» when the price is invalid on save', async () => {
    await renderPage();
    await userEvent.type(screen.getByLabelText(t.name), 'Butter');
    await userEvent.click(moreButton());
    await userEvent.type(screen.getByLabelText(t.price('CHF')), 'abc');
    await userEvent.click(screen.getByRole('button', { name: t.save }));
    expect(screen.getByText(t.priceInvalid('3.95'))).toBeDefined();
    expect(screen.getByTestId('where').textContent).toBe('/inventory/new');
  });

  it('saves with the one button and goes to the inventory tab of the location', async () => {
    await renderPage();
    await userEvent.type(screen.getByLabelText(t.name), 'Butter');
    await userEvent.click(screen.getByRole('button', { name: t.save }));
    expect(await screen.findByText('/inventory?location=fridge')).toBeDefined();
  });

  it('keeps cheese from the counter only as long as an open pack (ADR-0038)', async () => {
    const db = testDb();
    await renderPage('/inventory/new', db);
    // Packed food has no choice; cheese, cold cuts and dips do.
    expect(screen.queryByRole('radio', { name: t.loose })).toBeNull();
    await userEvent.type(screen.getByLabelText(t.name), 'Mozzarella');
    await userEvent.click(screen.getByRole('radio', { name: t.loose }));
    expect(screen.getByText(t.looseHint(3))).toBeDefined();
    const today = toLocalDate(new Date());
    expect(screen.getByLabelText<HTMLInputElement>(t.expiry).value).toBe(
      formatSwissDate(addDays(today, 3)),
    );
    await userEvent.click(screen.getByRole('button', { name: t.save }));
    await screen.findByText(/^\/inventory\?location=fridge$/);
    const [item] = await db.items.toArray();
    expect(item?.openedOn).toBe(today);
    expect(item?.expiresOn).toBe(addDays(today, 3));
  });

  describe('«Datum fotografieren» (ADR-0062)', () => {
    const photo = () => new File(['x'], 'date.png', { type: 'image/png' });
    const readsAs = async (text: string | Error) => {
      const { readImageText } = await import('../receipts/read-image');
      vi.mocked(readImageText).mockReset();
      if (text instanceof Error) {
        vi.mocked(readImageText).mockRejectedValue(text);
      } else {
        vi.mocked(readImageText).mockResolvedValue(text);
      }
    };

    it('fills the date field from the photo, says so and saves it as read from the label', async () => {
      const db = testDb();
      await renderPage('/inventory/new', db);
      const date = addDays(toLocalDate(new Date()), 400);
      await readsAs(`L23114\nZu verbrauchen bis ${formatSwissDate(date)}`);
      const input = screen.getByLabelText<HTMLInputElement>(t.datePhoto.choose);
      expect(input.getAttribute('capture')).toBe('environment');
      await userEvent.upload(input, photo());
      expect(await screen.findByText(t.datePhoto.found(formatSwissDate(date)))).toBeDefined();
      expect(screen.getByLabelText<HTMLInputElement>(t.expiry).value).toBe(formatSwissDate(date));
      await userEvent.type(screen.getByLabelText(t.name), 'Butter');
      await userEvent.click(screen.getByRole('button', { name: t.save }));
      await screen.findByText(/^\/inventory\?location=fridge$/);
      const [item] = await db.items.toArray();
      expect(item?.expiresOn).toBe(date);
      expect(item?.expiryKind).toBe('use_by');
      expect(item?.expirySource).toBe('label_ocr');
    });

    it('leaves the field as it was when no date is found', async () => {
      await renderPage();
      const before = screen.getByLabelText<HTMLInputElement>(t.expiry).value;
      await readsAs('Bio Vollmilch 1 Liter');
      await userEvent.upload(screen.getByLabelText(t.datePhoto.choose), photo());
      expect(await screen.findByText(t.datePhoto.notFound)).toBeDefined();
      expect(screen.getByLabelText<HTMLInputElement>(t.expiry).value).toBe(before);
    });

    it('says so when reading fails', async () => {
      await renderPage();
      await readsAs(new Error('offline'));
      await userEvent.upload(screen.getByLabelText(t.datePhoto.choose), photo());
      expect(await screen.findByText(t.datePhoto.failed)).toBeDefined();
    });
  });
});
