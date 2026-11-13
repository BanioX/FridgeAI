import { afterEach, describe, expect, it, vi } from 'vitest';
import { targetPath, transitionKind, withPageTransitions } from './page-transition';

describe('transitionKind', () => {
  it('cross-fades between the tabs', () => {
    expect(transitionKind('/', '/inventory')).toBe('tab');
    expect(transitionKind('/inventory', '/more')).toBe('tab');
    expect(transitionKind('/more/', '/')).toBe('tab');
  });

  it('pushes a deeper page in and goes back to a parent', () => {
    expect(transitionKind('/inventory', '/inventory/abc')).toBe('forward');
    expect(transitionKind('/', '/check')).toBe('forward');
    expect(transitionKind('/more', '/more/reports/view')).toBe('forward');
    expect(transitionKind('/inventory/abc', '/inventory')).toBe('back');
    expect(transitionKind('/more/reports/view', '/more/reports')).toBe('back');
    expect(transitionKind('/check', '/')).toBe('back');
  });

  it('follows the history and keeps still on the same page', () => {
    expect(transitionKind('/inventory/abc', -1)).toBe('back');
    expect(transitionKind('/inventory', 1)).toBe('forward');
    expect(transitionKind('/inventory', 0)).toBe('none');
    expect(transitionKind('/inventory', '/inventory')).toBe('none');
  });

  it('pushes a page of another section in', () => {
    expect(transitionKind('/inventory/abc', '/knowledge/recipes/x')).toBe('forward');
  });
});

describe('targetPath', () => {
  it('resolves strings and path objects', () => {
    expect(targetPath('/inventory?view=kind', '/')).toBe('/inventory');
    expect(targetPath('reports', '/more/')).toBe('/more/reports');
    expect(targetPath({ pathname: '/check' }, '/')).toBe('/check');
    expect(targetPath({ search: '?q=milch' }, '/inventory')).toBe('/inventory');
  });
});

describe('withPageTransitions', () => {
  afterEach(() => {
    delete document.documentElement.dataset.transition;
    vi.unstubAllGlobals();
    Reflect.deleteProperty(document, 'startViewTransition');
  });

  /** The router's own navigate stays reachable as `spy` after the wrapper replaces it. */
  function fakeRouter() {
    const spy = vi.fn((to: unknown, options?: unknown) => Promise.resolve([to, options]));
    return { spy, navigate: spy, subscribe: vi.fn(() => () => undefined) };
  }

  function allowMotion(reduce: boolean) {
    Object.defineProperty(document, 'startViewTransition', {
      configurable: true,
      value: vi.fn(),
    });
    vi.stubGlobal(
      'matchMedia',
      vi.fn(() => ({ matches: reduce })),
    );
  }

  it('asks the router for a view transition and marks its kind', async () => {
    allowMotion(false);
    const inner = fakeRouter();
    const router = withPageTransitions(() => inner);
    await router.navigate('/inventory', { replace: false });
    expect(inner.spy).toHaveBeenCalledWith('/inventory', {
      replace: false,
      viewTransition: true,
    });
    expect(document.documentElement.dataset.transition).toBe('tab');
  });

  it('leaves the navigation as it is without motion', async () => {
    allowMotion(true);
    const inner = fakeRouter();
    const router = withPageTransitions(() => inner);
    await router.navigate('/check');
    expect(inner.spy).toHaveBeenCalledWith('/check', undefined);
    expect(document.documentElement.dataset.transition).toBeUndefined();
  });

  it('marks a step back in the history before the router sees it', () => {
    allowMotion(false);
    window.history.replaceState({ idx: 3 }, '');
    withPageTransitions(() => fakeRouter());
    window.dispatchEvent(new PopStateEvent('popstate', { state: { idx: 2 } }));
    expect(document.documentElement.dataset.transition).toBe('back');
    window.dispatchEvent(new PopStateEvent('popstate', { state: { idx: 4 } }));
    expect(document.documentElement.dataset.transition).toBe('forward');
  });
});
