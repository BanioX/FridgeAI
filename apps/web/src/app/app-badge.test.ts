import { describe, expect, it, vi } from 'vitest';
import { syncAppBadge } from './app-badge';

describe('syncAppBadge', () => {
  it('sets the number when something needs saving', async () => {
    const setAppBadge = vi.fn(() => Promise.resolve());
    const clearAppBadge = vi.fn(() => Promise.resolve());
    await syncAppBadge(3, { setAppBadge, clearAppBadge });
    expect(setAppBadge).toHaveBeenCalledWith(3);
    expect(clearAppBadge).not.toHaveBeenCalled();
  });

  it('clears the badge at 0', async () => {
    const setAppBadge = vi.fn(() => Promise.resolve());
    const clearAppBadge = vi.fn(() => Promise.resolve());
    await syncAppBadge(0, { setAppBadge, clearAppBadge });
    expect(clearAppBadge).toHaveBeenCalledOnce();
    expect(setAppBadge).not.toHaveBeenCalled();
  });

  it('does nothing in browsers without the Badging API', async () => {
    await expect(syncAppBadge(2, {})).resolves.toBeUndefined();
    await expect(syncAppBadge(0, {})).resolves.toBeUndefined();
    await expect(syncAppBadge(2, undefined)).resolves.toBeUndefined();
  });

  it('swallows rejections, e.g. iOS without notification permission', async () => {
    const setAppBadge = vi.fn(() => Promise.reject(new Error('NotAllowedError')));
    const clearAppBadge = vi.fn(() => {
      throw new Error('boom');
    });
    await expect(syncAppBadge(2, { setAppBadge })).resolves.toBeUndefined();
    await expect(syncAppBadge(0, { clearAppBadge })).resolves.toBeUndefined();
  });

  it('uses the global navigator by default', async () => {
    const setAppBadge = vi.fn(() => Promise.resolve());
    vi.stubGlobal('navigator', { setAppBadge });
    await syncAppBadge(1);
    vi.unstubAllGlobals();
    expect(setAppBadge).toHaveBeenCalledWith(1);
  });
});
