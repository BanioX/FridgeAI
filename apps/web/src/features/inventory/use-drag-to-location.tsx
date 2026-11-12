import type { Id, StorageLocation } from '@fridgeai/core';
import { useEffect, useRef, useState, type MouseEvent, type PointerEvent } from 'react';
import { dropTargetFrom, type DropTarget } from './drop-target';

/** Press and hold this long before a row turns into a parcel: in select mode, and from the list. */
const HOLD_SELECTING_MS = 350;
const HOLD_LIST_MS = 450;
/** Moving further than this (px) before the hold is over means scrolling or swiping. */
const SLOP_PX = 10;
/** A click right after a drag must not toggle or open the row. */
const CLICK_GUARD_MS = 60;

interface Drag {
  label: string;
  x: number;
  y: number;
  over: DropTarget | null;
}

interface Hold {
  x: number;
  y: number;
  timer: number;
}

/**
 * Press and hold a row, then drag it onto a storage-location tab or a pot, like app icons on iOS (a
 * shortcut for «Verschieben nach» and the pots, which stay the accessible way, WCAG 2.5.7). `begin`
 * starts select mode, selects the row if needed and names the parcel; `drop` gets the target under
 * the finger on release.
 * Releasing anywhere else cancels the drag but keeps select mode. The row may be replaced while it
 * is held (list row to select row), so the pointer is captured on `body` and followed on `window`.
 */
export function useDragToLocation({
  enabled,
  selecting,
  from,
  begin,
  drop,
}: {
  enabled: boolean;
  /** Select mode is on: the hold is shorter. */
  selecting: boolean;
  from: StorageLocation;
  begin: (id: Id) => string;
  drop: (to: DropTarget) => void;
}) {
  const [drag, setDrag] = useState<Drag | null>(null);
  const hold = useRef<Hold | null>(null);
  /** The row element that was held: touch events keep going to it even after it left the page. */
  const pressed = useRef<HTMLElement | null>(null);
  const guard = useRef(false);
  /** The drag was started by a finger: it follows touch events (see below). */
  const touch = useRef(false);
  const latest = useRef({ begin, drop, from });
  useEffect(() => {
    latest.current = { begin, drop, from };
  });
  const dragging = drag !== null;

  const overAt = (x: number, y: number) => {
    const target = dropTargetFrom(document.elementFromPoint(x, y));
    // The tab of the place the parcel comes from is no target.
    return target?.kind === 'location' && target.location === latest.current.from ? null : target;
  };

  // A click right after a drag (the finger lifts over a row) must neither toggle nor navigate.
  useEffect(() => {
    const swallow = (event: Event) => {
      if (guard.current) {
        guard.current = false;
        event.preventDefault();
        event.stopPropagation();
      }
    };
    // Only the click that ends the drag counts: a new press clears the guard.
    const release = () => {
      guard.current = false;
    };
    window.addEventListener('click', swallow, true);
    window.addEventListener('pointerdown', release, true);
    return () => {
      window.removeEventListener('click', swallow, true);
      window.removeEventListener('pointerdown', release, true);
    };
  }, []);

  useEffect(() => {
    if (!dragging) {
      return undefined;
    }
    let finished = false;
    const follow = (x: number, y: number) => {
      setDrag((old) => (old === null ? null : { ...old, x, y, over: overAt(x, y) }));
    };
    /** Ends the drag once, whichever event comes first; `at` is where the finger lifted. */
    const finish = (at: { x: number; y: number } | null) => {
      if (finished) {
        return;
      }
      finished = true;
      const to = at === null ? null : overAt(at.x, at.y);
      setDrag(null);
      guard.current = true;
      window.setTimeout(() => {
        guard.current = false;
      }, CLICK_GUARD_MS);
      if (to !== null) {
        latest.current.drop(to);
      }
    };
    const move = (event: globalThis.PointerEvent) => {
      follow(event.clientX, event.clientY);
    };
    const up = (event: globalThis.PointerEvent) => {
      finish({ x: event.clientX, y: event.clientY });
    };
    // On iPhone, Safari may cancel the pointer when select mode replaces the held row, although the
    // finger is still down; touch events keep coming (to the removed row). So a finger drag follows
    // the touch events and ignores a pointer cancel; only a mouse or pen drag ends on it.
    const cancel = () => {
      if (!touch.current) {
        finish(null);
      }
    };
    const touchMove = (event: TouchEvent) => {
      // iOS still scrolls on touchmove unless it is cancelled (touch-action is read at touchstart).
      event.preventDefault();
      const point = event.touches[0];
      if (point !== undefined) {
        follow(point.clientX, point.clientY);
      }
    };
    const touchEnd = (event: TouchEvent) => {
      const point = event.changedTouches[0];
      finish(
        event.type === 'touchend' && point !== undefined
          ? { x: point.clientX, y: point.clientY }
          : null,
      );
    };
    // A list row is replaced by its select row when the hold starts select mode; touch events keep
    // going to the removed row and no longer bubble to the document, so listen on the row too.
    const row = pressed.current;
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
    window.addEventListener('pointercancel', cancel);
    document.addEventListener('touchmove', touchMove, { passive: false });
    document.addEventListener('touchend', touchEnd);
    document.addEventListener('touchcancel', touchEnd);
    row?.addEventListener('touchmove', touchMove, { passive: false });
    row?.addEventListener('touchend', touchEnd);
    row?.addEventListener('touchcancel', touchEnd);
    return () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
      window.removeEventListener('pointercancel', cancel);
      document.removeEventListener('touchmove', touchMove);
      document.removeEventListener('touchend', touchEnd);
      document.removeEventListener('touchcancel', touchEnd);
      row?.removeEventListener('touchmove', touchMove);
      row?.removeEventListener('touchend', touchEnd);
      row?.removeEventListener('touchcancel', touchEnd);
      pressed.current = null;
      touch.current = false;
    };
  }, [dragging]);

  const cancelHold = () => {
    if (hold.current !== null) {
      window.clearTimeout(hold.current.timer);
      hold.current = null;
    }
  };

  /** Spread onto the row element (a `SelectableRow` label, or a wrapper around a swipeable row). */
  const rowProps = (id: Id) => ({
    onPointerDown: (event: PointerEvent<HTMLElement>) => {
      if (!enabled || !event.isPrimary || event.button !== 0) {
        return;
      }
      cancelHold();
      const row = event.currentTarget;
      const { pointerId, pointerType, clientX: x, clientY: y } = event;
      const timer = window.setTimeout(
        () => {
          hold.current = null;
          pressed.current = row;
          touch.current = pointerType === 'touch';
          try {
            document.body.setPointerCapture(pointerId);
          } catch {
            // The pointer is gone already: the window listeners still follow it.
          }
          if ('vibrate' in navigator) {
            navigator.vibrate(10);
          }
          setDrag({ label: latest.current.begin(id), x, y, over: null });
        },
        selecting ? HOLD_SELECTING_MS : HOLD_LIST_MS,
      );
      hold.current = { x, y, timer };
    },
    onPointerMove: (event: PointerEvent<HTMLElement>) => {
      const held = hold.current;
      if (held !== null && Math.hypot(event.clientX - held.x, event.clientY - held.y) > SLOP_PX) {
        cancelHold();
      }
    },
    onPointerUp: cancelHold,
    onPointerCancel: cancelHold,
    onContextMenu: (event: MouseEvent<HTMLElement>) => {
      if (hold.current !== null || dragging || guard.current) {
        event.preventDefault();
      }
    },
  });

  const parcel =
    drag === null ? null : (
      <div
        aria-hidden="true"
        className="pointer-events-none fixed top-0 left-0 z-50 rounded-full bg-onyx px-4 py-2 text-sm font-semibold whitespace-nowrap text-white shadow-float"
        style={{
          transform: `translate(${String(drag.x)}px, ${String(drag.y)}px) translate(-50%, 2.5rem)`,
        }}
      >
        {drag.label}
      </div>
    );

  return { dragging, over: drag?.over ?? null, rowProps, parcel };
}
