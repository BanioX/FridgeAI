import { describe, expect, it } from 'vitest';
import {
  canStart,
  COMMIT_DISTANCE,
  EDGE,
  historyIndex,
  onRelease,
  whileMoving,
} from './edge-swipe';
import { isTabRoot } from './page-transition';

describe('edge swipe back', () => {
  it('starts only at the left edge of the installed app, with a page to go back to', () => {
    expect(canStart(EDGE, true, 2)).toBe(true);
    expect(canStart(EDGE + 1, true, 2)).toBe(false);
    expect(canStart(4, false, 2)).toBe(false);
    expect(canStart(4, true, 0)).toBe(false);
  });

  it('gives way to a vertical scroll, and goes back when far enough or flicked', () => {
    expect(whileMoving(30, 4)).toBe('track');
    expect(whileMoving(5, 30)).toBe('scroll');
    expect(onRelease(COMMIT_DISTANCE, 0)).toBe('back');
    expect(onRelease(40, 0.8)).toBe('back');
    expect(onRelease(40, 0.1)).toBe('cancel');
    expect(onRelease(10, 2)).toBe('cancel');
  });

  it('reads the history position React Router keeps, and knows the tab roots', () => {
    expect(historyIndex({ idx: 3, key: 'a' })).toBe(3);
    expect(historyIndex(null)).toBe(0);
    expect(isTabRoot('/more/')).toBe(true);
    expect(isTabRoot('/more/reports')).toBe(false);
  });
});
