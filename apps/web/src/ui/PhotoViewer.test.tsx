import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { messages } from '../app/messages.de-CH';
import { ZoomablePhoto } from './PhotoViewer';

const PHOTO = 'data:image/jpeg;base64,AAAA';

describe('ZoomablePhoto (ADR-0082)', () => {
  afterEach(cleanup);

  it('opens the photo over the whole screen and closes again', () => {
    render(<ZoomablePhoto src={PHOTO} title="Oben" />);
    const open = screen.getByRole('button', { name: messages.photoViewer.open('Oben') });
    fireEvent.click(open);
    const viewer = screen.getByRole('dialog', { name: 'Oben' });
    expect(viewer.querySelector('img')?.getAttribute('src')).toBe(PHOTO);
    // «Schliessen» has the focus, so the thumb and the keyboard find it at once.
    const close = screen.getByRole('button', { name: messages.photoViewer.close });
    expect(document.activeElement).toBe(close);
    fireEvent.click(close);
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(document.activeElement).toBe(open);
  });

  it('closes on Escape without closing a sheet underneath', () => {
    const sheetEscape = vi.fn();
    window.addEventListener('keydown', sheetEscape);
    render(<ZoomablePhoto src={PHOTO} title="Oben" />);
    fireEvent.click(screen.getByRole('button', { name: messages.photoViewer.open('Oben') }));
    fireEvent.keyDown(document.activeElement ?? window, { key: 'Escape' });
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(sheetEscape).not.toHaveBeenCalled();
    window.removeEventListener('keydown', sheetEscape);
  });
});
