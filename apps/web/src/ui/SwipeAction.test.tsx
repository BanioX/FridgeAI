import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter, Link } from 'react-router';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { SwipeAction } from './SwipeAction';

const WIDTH = 300;

function setup({ withStart = true } = {}) {
  const onCommit = vi.fn();
  const onWaste = vi.fn();
  const onOpen = vi.fn();
  render(
    <MemoryRouter>
      <SwipeAction
        end={{ label: 'Verwertet', detail: '−1', onCommit }}
        start={withStart ? { label: 'Entsorgt', detail: '−1', onCommit: onWaste } : undefined}
      >
        <Link
          to="/x"
          onClick={(event) => {
            event.preventDefault();
            onOpen();
          }}
        >
          Glace
        </Link>
      </SwipeAction>
    </MemoryRouter>,
  );
  const target = screen.getByRole('link', { name: 'Glace' });
  const pointer = (type: 'pointerDown' | 'pointerMove' | 'pointerUp', x: number, y = 0) => {
    fireEvent[type](target, {
      pointerId: 1,
      pointerType: 'touch',
      isPrimary: true,
      clientX: x,
      clientY: y,
    });
  };
  return { onCommit, onWaste, onOpen, target, pointer };
}

describe('SwipeAction', () => {
  beforeEach(() => {
    vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockReturnValue({
      width: WIDTH,
    } as DOMRect);
  });
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('commits «Verwertet» when dragged past 40 % to the left, and does not open the link', () => {
    const { onCommit, onWaste, onOpen, target, pointer } = setup();
    pointer('pointerDown', 250);
    pointer('pointerMove', 200);
    pointer('pointerMove', 100);
    pointer('pointerUp', 100);
    fireEvent.click(target);
    expect(onCommit).toHaveBeenCalledTimes(1);
    expect(onWaste).not.toHaveBeenCalled();
    expect(onOpen).not.toHaveBeenCalled();
  });

  it('commits «Entsorgt» when dragged past 40 % to the right', () => {
    const { onCommit, onWaste, target, pointer } = setup();
    pointer('pointerDown', 50);
    pointer('pointerMove', 100);
    pointer('pointerMove', 200);
    pointer('pointerUp', 200);
    fireEvent.click(target);
    expect(onWaste).toHaveBeenCalledTimes(1);
    expect(onCommit).not.toHaveBeenCalled();
  });

  it('springs back below the threshold', () => {
    const { onCommit, target, pointer } = setup();
    pointer('pointerDown', 250);
    pointer('pointerMove', 235);
    pointer('pointerMove', 215);
    pointer('pointerUp', 215);
    fireEvent.click(target);
    expect(onCommit).not.toHaveBeenCalled();
  });

  it('ignores vertical drags, even when they drift far to the left', () => {
    const { onCommit, pointer } = setup();
    pointer('pointerDown', 250, 100);
    pointer('pointerMove', 245, 140);
    pointer('pointerMove', 20, 160);
    pointer('pointerUp', 20, 160);
    expect(onCommit).not.toHaveBeenCalled();
  });

  it('ignores a drag to the right when there is no «start» side', () => {
    const { onCommit, pointer } = setup({ withStart: false });
    pointer('pointerDown', 50);
    pointer('pointerMove', 200);
    pointer('pointerUp', 280);
    expect(onCommit).not.toHaveBeenCalled();
  });

  it('keeps a plain tap for the link', () => {
    const { onCommit, onOpen, target, pointer } = setup();
    pointer('pointerDown', 150);
    pointer('pointerUp', 150);
    fireEvent.click(target);
    expect(onCommit).not.toHaveBeenCalled();
    expect(onOpen).toHaveBeenCalledTimes(1);
  });
});
