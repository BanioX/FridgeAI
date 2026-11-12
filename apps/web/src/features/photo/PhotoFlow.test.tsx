import 'fake-indexeddb/auto';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { AppDataProvider } from '../../app/AppData';
import { messages } from '../../app/messages.de-CH';
import { testDb } from '../../data/test-helpers';
import { AddItemPage } from '../inventory/AddItemPage';
import { readImageText } from '../receipts/read-image';
import { handOverReceiptPhotos, takeReceiptPhotos } from '../receipts/receipt-handover';
import { ReceiptPage } from '../receipts/ReceiptPage';
import { StartIntro } from '../today/StartIntro';
import { takePhoto } from './photo-handover';
import { PhotoPage } from './PhotoPage';
import type { PhotoReaders } from './read-photo';

vi.mock('../receipts/read-image', () => ({ readImageText: vi.fn(() => Promise.resolve('')) }));

const RECEIPT = `MIGROS
M-Budget Vollmilch UHT        1.25 1
Gruyère AOC 250g            2x 4.20  8.40 1
TOTAL                         9.65`;

const photo = () => new File(['x'], 'foto.jpg', { type: 'image/jpeg' });

function readers(block: string, sparse = ''): PhotoReaders {
  return {
    readText: (_file, mode) => Promise.resolve(mode === 'block' ? block : sparse),
    readCode: () => Promise.resolve(null),
  };
}

function Path() {
  return <output data-testid="path">{useLocation().pathname}</output>;
}

function renderAt(path: string, fake: PhotoReaders = readers('')) {
  render(
    <AppDataProvider db={testDb()}>
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          <Route path="/" element={<StartIntro />} />
          <Route path="/add/photo" element={<PhotoPage readers={fake} />} />
          <Route path="/add/receipt" element={<ReceiptPage />} />
          <Route path="/inventory/new" element={<AddItemPage />} />
        </Routes>
        <Path />
      </MemoryRouter>
    </AppDataProvider>,
  );
}

const path = () => screen.getByTestId('path').textContent;

/** jsdom has no object URLs for the preview. */
URL.createObjectURL = vi.fn(() => 'blob:preview');
URL.revokeObjectURL = vi.fn();

describe('«Foto aufnehmen» (ADR-0068)', () => {
  afterEach(() => {
    cleanup();
    takePhoto();
    takeReceiptPhotos();
    vi.mocked(readImageText).mockClear();
  });

  it('offers photo, barcode and typing on Start; the photo goes to «Foto aufnehmen»', async () => {
    renderAt('/');
    const t = messages.today.intro;
    expect((await screen.findByRole('link', { name: t.receipt })).getAttribute('href')).toBe(
      '/add/receipt',
    );
    expect(screen.getByRole('link', { name: t.barcode }).getAttribute('href')).toBe(
      '/inventory/new?scan=1',
    );
    const camera = screen.getByLabelText(t.photo);
    expect(camera.getAttribute('capture')).toBe('environment');
    fireEvent.change(camera, { target: { files: [photo()] } });
    await waitFor(() => {
      expect(path()).toBe('/inventory/new');
    });
    // Nothing readable on it: the form says so and leaves the name to the person.
    expect(await screen.findByText(messages.photo.found.noText)).toBeDefined();
  });

  it('fills the form from a label and offers the catalogue products to pick', async () => {
    renderAt(
      '/add/photo',
      readers('Naturaplan\nBio Vollmilch\n1 l', 'Mindestens haltbar bis 20.11.2026'),
    );
    fireEvent.change(await screen.findByLabelText(messages.photo.take), {
      target: { files: [photo()] },
    });
    expect(await screen.findByText(messages.photo.found.title)).toBeDefined();
    expect(screen.getByText('Haltbar bis 20.11.2026')).toBeDefined();
    expect(screen.getByText('Menge 1000 ml')).toBeDefined();
    // No catalogue in the test: no suggestion, so the name is typed.
    expect(screen.getByText(messages.photo.found.nothing)).toBeDefined();
    expect(screen.getByLabelText<HTMLInputElement>(messages.addItem.name).value).toBe('');
  });

  it('sends a receipt to «Quittung hochladen» with its text, read only once', async () => {
    renderAt('/add/photo', readers(RECEIPT));
    fireEvent.change(await screen.findByLabelText(messages.photo.take), {
      target: { files: [photo()] },
    });
    await waitFor(() => {
      expect(path()).toBe('/add/receipt');
    });
    expect(await screen.findByText('M-Budget Vollmilch UHT')).toBeDefined();
    expect(readImageText).not.toHaveBeenCalled();
  });

  it('reads a handed-over receipt text without reading the photo again', async () => {
    handOverReceiptPhotos([{ file: photo(), text: '' }]);
    renderAt('/add/receipt');
    expect(await screen.findByText(messages.receiptUpload.noLines)).toBeDefined();
    expect(readImageText).not.toHaveBeenCalled();
  });

  it('opens the camera on the receipt page too', async () => {
    renderAt('/add/receipt');
    const file = photo();
    fireEvent.change(await screen.findByLabelText(messages.receiptUpload.takePhoto), {
      target: { files: [file] },
    });
    await waitFor(() => {
      expect(readImageText).toHaveBeenCalledWith(file);
    });
  });

  it('lets the person pick a suggestion from the label', async () => {
    const user = userEvent.setup();
    render(
      <AppDataProvider db={testDb()}>
        <MemoryRouter
          initialEntries={[
            {
              pathname: '/inventory/new',
              state: {
                photo: {
                  label: {
                    categoryId: 'dairy-milk',
                    suggestions: [
                      { gtin: '7610200000019', name: 'Bio Vollmilch', brand: 'Naturaplan' },
                    ],
                  },
                  empty: false,
                },
              },
            },
          ]}
        >
          <AddItemPage />
        </MemoryRouter>
      </AppDataProvider>,
    );
    expect(await screen.findByText(messages.photo.found.suggestions)).toBeDefined();
    await user.click(screen.getByRole('button', { name: 'Naturaplan · Bio Vollmilch' }));
    expect(screen.getByLabelText<HTMLInputElement>(messages.addItem.name).value).toBe(
      'Bio Vollmilch',
    );
    expect(screen.queryByText(messages.photo.found.suggestions)).toBeNull();
  });
});
