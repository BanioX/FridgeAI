import 'fake-indexeddb/auto';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { AppDataProvider } from '../../app/AppData';
import { messages } from '../../app/messages.de-CH';
import { testDb } from '../../data/test-helpers';
import { StartIntro } from '../today/StartIntro';
import { readImageText } from './read-image';
import { handOverReceiptPhotos, takeReceiptPhotos } from './ReceiptPhotoInput';
import { ReceiptPage } from './ReceiptPage';

vi.mock('./read-image', () => ({ readImageText: vi.fn(() => Promise.resolve('')) }));

const photo = () => new File(['x'], 'quittung.jpg', { type: 'image/jpeg' });

function Path() {
  return <output data-testid="path">{useLocation().pathname}</output>;
}

function renderAt(path: string) {
  render(
    <AppDataProvider db={testDb()}>
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          <Route path="/" element={<StartIntro />} />
          <Route path="/add/receipt" element={<ReceiptPage />} />
        </Routes>
        <Path />
      </MemoryRouter>
    </AppDataProvider>,
  );
}

describe('receipt photo from Start', () => {
  afterEach(() => {
    cleanup();
    takeReceiptPhotos();
    vi.mocked(readImageText).mockClear();
  });

  it('hands the photos over once', () => {
    const file = photo();
    handOverReceiptPhotos([file]);
    expect(takeReceiptPhotos()).toEqual([file]);
    expect(takeReceiptPhotos()).toEqual([]);
  });

  it('offers photo, barcode and typing next to the receipt upload', async () => {
    renderAt('/');
    const t = messages.today.intro;
    expect((await screen.findByRole('link', { name: t.receipt })).getAttribute('href')).toBe(
      '/add/receipt',
    );
    expect(screen.getByRole('link', { name: t.barcode }).getAttribute('href')).toBe(
      '/inventory/new?scan=1',
    );
    expect(screen.getByRole('link', { name: t.item }).getAttribute('href')).toBe('/inventory/new');
    const camera = screen.getByLabelText(t.photo);
    expect(camera.getAttribute('capture')).toBe('environment');
    expect(camera.getAttribute('accept')).toBe('image/*');
  });

  it('takes the photo to «Quittung hochladen» and reads it there', async () => {
    renderAt('/');
    const file = photo();
    fireEvent.change(await screen.findByLabelText(messages.today.intro.photo), {
      target: { files: [file] },
    });
    await waitFor(() => {
      expect(screen.getByTestId('path').textContent).toBe('/add/receipt');
    });
    await waitFor(() => {
      expect(readImageText).toHaveBeenCalledWith(file);
    });
    // Nothing readable in it: the page says so.
    expect(await screen.findByText(messages.receiptUpload.noLines)).toBeDefined();
    expect(takeReceiptPhotos()).toEqual([]);
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
});
