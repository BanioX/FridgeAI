import 'fake-indexeddb/auto';
import { cleanup, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { afterEach, describe, expect, it } from 'vitest';
import { AppDataProvider } from '../../app/AppData';
import { messages } from '../../app/messages.de-CH';
import { testDb } from '../../data/test-helpers';
import { AddPage } from './AddPage';

const t = messages.addHub;

describe('«Erfassen»', () => {
  afterEach(cleanup);

  it('has one way for photos and the other ways as one list (ADR-0078)', async () => {
    render(
      <AppDataProvider db={testDb()}>
        <MemoryRouter>
          <AddPage />
        </MemoryRouter>
      </AppDataProvider>,
    );
    // The green tile is the camera itself: a receipt or a pack, Rettich sees which.
    const photo = await screen.findByLabelText(new RegExp(`^${t.photoTitle}`));
    expect(photo.getAttribute('type')).toBe('file');
    expect(photo.getAttribute('capture')).toBe('environment');
    const href = (name: string) =>
      screen.getByRole('link', { name: new RegExp(`^${name}`) }).getAttribute('href');
    expect(href(t.uploadTitle)).toBe('/add/receipt');
    expect(href(messages.scanner.open)).toBe('/inventory/new?scan=1');
    expect(href(t.manualTitle)).toBe('/inventory/new');
    expect(href(t.batchTitle)).toBe('/add/batch');
    expect(href(t.leftoversTitle)).toBe('/add/process?kind=leftover');
    expect(screen.queryByText(messages.photo.take)).toBeNull();
  });
});
