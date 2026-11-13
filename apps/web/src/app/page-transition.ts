import type { To } from 'react-router';

/** How a navigation moves, iOS style (ADR-0088): deeper pages push in, tabs cross-fade. */
export type TransitionKind = 'forward' | 'back' | 'tab' | 'none';

/** The roots of the tab bar (AppShell); `/` is Start. */
const TAB_ROOTS: readonly string[] = ['/', '/inventory', '/add', '/knowledge', '/more'];

const trim = (path: string) => (path.length > 1 ? path.replace(/\/+$/, '') : path);

const isWithin = (path: string, parent: string) =>
  parent === '/' ? path !== '/' : path.startsWith(`${parent}/`);

/** The kind of transition from one path to another; `to` as a number is a step in the history. */
export function transitionKind(fromPath: string, to: string | number): TransitionKind {
  if (typeof to === 'number') {
    return to < 0 ? 'back' : to > 0 ? 'forward' : 'none';
  }
  const from = trim(fromPath);
  const next = trim(to);
  if (from === next) {
    // Same page, other filter or search: nothing should move.
    return 'none';
  }
  if (TAB_ROOTS.includes(from) && TAB_ROOTS.includes(next)) {
    return 'tab';
  }
  if (isWithin(from, next) && next !== '/') {
    // Up to a parent page in the same section, e.g. an item back to «Vorrat».
    return 'back';
  }
  if (next === '/' && from !== '/') {
    return TAB_ROOTS.includes(from) ? 'tab' : 'back';
  }
  return 'forward';
}

/** The path a navigation goes to, relative links resolved against the current address. */
export function targetPath(to: To, current: string): string {
  if (typeof to === 'string') {
    return new URL(to, `http://localhost${current}`).pathname;
  }
  return to.pathname ?? current;
}

interface NavigatingRouter {
  navigate: (...args: never[]) => unknown;
  subscribe: (listener: () => void) => () => void;
}

/** True when the browser can animate and the person has not asked for less motion. */
export function canAnimate(win: Window = window): boolean {
  return (
    typeof win.document.startViewTransition === 'function' &&
    !win.matchMedia('(prefers-reduced-motion: reduce)').matches
  );
}

/**
 * Creates the router with view transitions for every navigation: links, buttons and the history.
 * The kind lands on `<html data-transition>`, where the CSS in index.css picks the animation. The
 * history listener comes first, so the kind is set before the router handles a back or forward.
 */
export function withPageTransitions<R extends NavigatingRouter>(
  createRouter: () => R,
  win: Window = window,
): R {
  const html = win.document.documentElement;
  const indexOf = (state: unknown): number | null =>
    typeof state === 'object' && state !== null && 'idx' in state && typeof state.idx === 'number'
      ? state.idx
      : null;
  let index = indexOf(win.history.state) ?? 0;
  win.addEventListener('popstate', (event) => {
    const next = indexOf(event.state) ?? index;
    html.dataset.transition = next < index ? 'back' : 'forward';
  });

  const router = createRouter();
  router.subscribe(() => {
    index = indexOf(win.history.state) ?? index;
  });
  const navigate = router.navigate.bind(router) as (
    to: To | number | null,
    options?: Record<string, unknown>,
  ) => unknown;
  const wrapped = (to: To | number | null, options?: Record<string, unknown>) => {
    const from = win.location.pathname;
    const kind =
      to === null
        ? 'none'
        : transitionKind(from, typeof to === 'number' ? to : targetPath(to, from));
    if (kind === 'none' || !canAnimate(win)) {
      return navigate(to, options);
    }
    html.dataset.transition = kind;
    return navigate(to, { ...options, viewTransition: options?.viewTransition ?? true });
  };
  (router as { navigate: unknown }).navigate = wrapped;
  return router;
}
