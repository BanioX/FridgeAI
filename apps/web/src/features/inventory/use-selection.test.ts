import type { Id } from '@fridgeai/core';
import { act, renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { useSelection } from './use-selection';

const a = 'a' as Id;
const b = 'b' as Id;
const c = 'c' as Id;

describe('useSelection', () => {
  it('starts off, toggles items and leaves with stop', () => {
    const { result } = renderHook(() => useSelection('fridge'));
    expect(result.current.active).toBe(false);
    act(() => {
      result.current.start();
      result.current.toggle(a);
      result.current.toggle(b);
    });
    expect(result.current.active).toBe(true);
    expect([...result.current.ids]).toEqual([a, b]);
    act(() => {
      result.current.toggle(a);
    });
    expect([...result.current.ids]).toEqual([b]);
    act(() => {
      result.current.stop();
    });
    expect(result.current.active).toBe(false);
    expect(result.current.ids.size).toBe(0);
  });

  it('selects all and none', () => {
    const { result } = renderHook(() => useSelection('fridge'));
    act(() => {
      result.current.selectAll([a, b, c]);
    });
    expect(result.current.ids.size).toBe(3);
    act(() => {
      result.current.clear();
    });
    expect(result.current.ids.size).toBe(0);
  });

  it('drops the selection when the scope changes but stays in select mode', () => {
    const { result, rerender } = renderHook(({ scope }) => useSelection(scope), {
      initialProps: { scope: 'fridge' },
    });
    act(() => {
      result.current.start();
      result.current.toggle(a);
    });
    rerender({ scope: 'pantry' });
    expect(result.current.active).toBe(true);
    expect(result.current.ids.size).toBe(0);
    act(() => {
      result.current.toggle(b);
    });
    expect([...result.current.ids]).toEqual([b]);
    // Back on the first tab, the old choice does not come back.
    rerender({ scope: 'fridge' });
    expect(result.current.ids.size).toBe(0);
  });
});
