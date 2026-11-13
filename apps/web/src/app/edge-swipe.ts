/**
 * Swipe back from the left edge (ADR-0091). An installed web app on the iPhone has no back gesture
 * of its own; this one follows the finger like iOS and goes one step back in the history.
 */

/** A touch must start this close to the left edge. The list rows start at 16 px. */
export const EDGE = 16;
/** Further than this, or a quick flick, goes back; less springs back. */
export const COMMIT_DISTANCE = 96;
const FLICK_SPEED = 0.5;
const FLICK_DISTANCE = 32;
/** Moving this far up or down first is a scroll, not a swipe. */
const SLOP = 10;

export type SwipeDecision = 'track' | 'scroll' | 'back' | 'cancel';

/** Whether a touch at `x` may start a swipe back: in the installed app, with a page to go back to. */
export function canStart(x: number, standalone: boolean, historyIndex: number): boolean {
  return standalone && historyIndex > 0 && x <= EDGE;
}

/** While the finger moves: keep following it, or give way to a vertical scroll. */
export function whileMoving(dx: number, dy: number): 'track' | 'scroll' {
  return Math.abs(dy) > SLOP && Math.abs(dy) > Math.abs(dx) ? 'scroll' : 'track';
}

/** When the finger lifts: far enough, or a quick flick to the right, goes back. */
export function onRelease(dx: number, speed: number): 'back' | 'cancel' {
  return dx >= COMMIT_DISTANCE || (dx >= FLICK_DISTANCE && speed >= FLICK_SPEED)
    ? 'back'
    : 'cancel';
}

/** Whether the app runs installed on the home screen (no browser back gesture there). */
export function isStandalone(win: Window = window): boolean {
  const legacy = (win.navigator as Navigator & { standalone?: boolean }).standalone === true;
  // Not every environment has matchMedia (tests); without it, it is not the installed app.
  const media = typeof (win.matchMedia as unknown) === 'function';
  return legacy || (media && win.matchMedia('(display-mode: standalone)').matches);
}

/** React Router keeps its position in the history state; 0 is the first page of this visit. */
export function historyIndex(state: unknown): number {
  return typeof state === 'object' &&
    state !== null &&
    'idx' in state &&
    typeof state.idx === 'number'
    ? state.idx
    : 0;
}
