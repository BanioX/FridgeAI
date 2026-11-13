import { useEffect, useLayoutEffect, type RefObject } from 'react';
import { useLocation } from 'react-router';
import { canStart, historyIndex, isStandalone, onRelease, whileMoving } from './edge-swipe';
import { isTabRoot, markSwipeBack } from './page-transition';

const SETTLE_MS = 180;
const EASE = 'cubic-bezier(0.32, 0.72, 0, 1)';

const reduceMotion = () =>
  typeof (window.matchMedia as unknown) === 'function' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/** Moves the page `dx` pixels to the right, with a soft shadow on its left edge; 0 puts it back. */
function place(element: HTMLElement | null, dx: number, animate: boolean) {
  if (element === null) {
    return;
  }
  element.style.transition = animate ? `transform ${String(SETTLE_MS)}ms ${EASE}` : 'none';
  element.style.transform = dx > 0 ? `translateX(${String(dx)}px)` : '';
  element.style.boxShadow = dx > 0 ? '-12px 0 24px rgb(0 0 0 / 0.08)' : '';
}

/**
 * Swipe back from the left edge in the installed app (ADR-0091): the page follows the finger and,
 * released far enough, slides out and the history goes one step back. Not on the tab roots and
 * not while a sheet is open.
 */
export function useEdgeSwipeBack(page: RefObject<HTMLElement | null>): void {
  const { key, pathname } = useLocation();

  // A new page starts in place, before the browser takes its picture for the transition.
  useLayoutEffect(() => {
    place(page.current, 0, false);
    page.current?.style.removeProperty('transition');
  }, [key, page]);

  useEffect(() => {
    if (!isStandalone() || isTabRoot(pathname)) {
      return undefined;
    }
    let start: { x: number; y: number } | null = null;
    let tracking = false;
    let previous = { x: 0, time: 0 };
    let last = { x: 0, time: 0 };

    const onStart = (event: TouchEvent) => {
      const touch = event.touches[0];
      const sheetOpen = document.querySelector('[role="dialog"][aria-modal="true"]') !== null;
      if (event.touches.length !== 1 || touch === undefined || sheetOpen) {
        return;
      }
      if (!canStart(touch.clientX, true, historyIndex(window.history.state))) {
        return;
      }
      start = { x: touch.clientX, y: touch.clientY };
      previous = last = { x: touch.clientX, time: event.timeStamp };
      tracking = false;
    };

    const onMove = (event: TouchEvent) => {
      const touch = event.touches[0];
      if (start === null || touch === undefined) {
        return;
      }
      const dx = touch.clientX - start.x;
      if (!tracking) {
        if (whileMoving(dx, touch.clientY - start.y) === 'scroll') {
          start = null;
          return;
        }
        if (dx < 4) {
          return;
        }
        tracking = true;
      }
      event.preventDefault();
      previous = last;
      last = { x: touch.clientX, time: event.timeStamp };
      if (!reduceMotion()) {
        place(page.current, dx, false);
      }
    };

    const onEnd = () => {
      const from = start;
      start = null;
      if (from === null || !tracking) {
        return;
      }
      tracking = false;
      const speed = (last.x - previous.x) / Math.max(1, last.time - previous.time);
      if (onRelease(last.x - from.x, speed) === 'cancel') {
        place(page.current, 0, !reduceMotion());
        return;
      }
      const back = () => {
        markSwipeBack();
        window.history.back();
      };
      if (reduceMotion()) {
        back();
        return;
      }
      place(page.current, window.innerWidth, true);
      window.setTimeout(back, SETTLE_MS);
    };

    document.addEventListener('touchstart', onStart, { passive: true });
    document.addEventListener('touchmove', onMove, { passive: false });
    document.addEventListener('touchend', onEnd);
    document.addEventListener('touchcancel', onEnd);
    return () => {
      document.removeEventListener('touchstart', onStart);
      document.removeEventListener('touchmove', onMove);
      document.removeEventListener('touchend', onEnd);
      document.removeEventListener('touchcancel', onEnd);
    };
  }, [page, pathname]);
}
