import type { Id, StorageLocation } from '@fridgeai/core';
import { useEffect, useRef, useState, type MouseEvent, type PointerEvent } from 'react';
import { dropLocationFrom } from './drop-target';

/** Press and hold this long before a row turns into a parcel. */
const HOLD_MS = 350;
/** Moving further than this (px) before the hold is over means scrolling, not dragging. */
const SLOP_PX = 10;
/** A click right after a drag must not toggle the row again. */
const CLICK_GUARD_MS = 60;

interface Drag {
  id: Id;
  label: string;
  x: number;
  y: number;
  over: StorageLocation | null;
}

interface Hold {
  x: number;
  y: number;
  timer: number;
}

/**
 * Drag a held row onto a storage-location tab (a shortcut for «Verschieben nach», which stays the
 * accessible way, WCAG 2.5.7). `begin` selects the row if needed and names the parcel; `drop` gets
 * the tab under the finger on release. Releasing anywhere else cancels.
 */
export function useDragToLocation({
  enabled,
  from,
  begin,
  drop,
}: {
  enabled: boolean;
  from: StorageLocation;
  begin: (id: Id) => string;
  drop: (to: StorageLocation) => void;
}) {
  const [drag, setDrag] = useState<Drag | null>(null);
  const hold = useRef<Hold | null>(null);
  const guard = useRef(false);
  const latest = useRef({ begin, drop });
  const dragging = drag !== null;

  useEffect(() => {
    latest.current = { begin, drop };
  });

  // iOS still scrolls on touchmove unless it is cancelled (touch-action is read at touchstart).
  useEffect(() => {
    if (!dragging) {
      return undefined;
    }
    const stop = (event: TouchEvent) => {
      event.preventDefault();
    };
    document.addEventListener('touchmove', stop, { passive: false });
    return () => {
      document.removeEventListener('touchmove', stop);
    };
  }, [dragging]);

  const cancelHold = () => {
    if (hold.current !== null) {
      window.clearTimeout(hold.current.timer);
      hold.current = null;
    }
  };

  const overAt = (x: number, y: number) => {
    const location = dropLocationFrom(document.elementFromPoint(x, y));
    return location === from ? null : location;
  };

  const finish = (event: PointerEvent<HTMLElement>, dropped: boolean) => {
    cancelHold();
    if (drag === null) {
      return;
    }
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    const to = dropped ? overAt(event.clientX, event.clientY) : null;
    setDrag(null);
    guard.current = true;
    window.setTimeout(() => {
      guard.current = false;
    }, CLICK_GUARD_MS);
    if (to !== null) {
      latest.current.drop(to);
    }
  };

  /** Spread onto the row element (the `label` of a `SelectableRow`). */
  const rowProps = (id: Id) => ({
    onPointerDown: (event: PointerEvent<HTMLElement>) => {
      if (!enabled || !event.isPrimary || event.button !== 0) {
        return;
      }
      cancelHold();
      const row = event.currentTarget;
      const { pointerId, clientX: x, clientY: y } = event;
      const timer = window.setTimeout(() => {
        hold.current = null;
        row.setPointerCapture(pointerId);
        if ('vibrate' in navigator) {
          navigator.vibrate(10);
        }
        setDrag({ id, label: latest.current.begin(id), x, y, over: null });
      }, HOLD_MS);
      hold.current = { x, y, timer };
    },
    onPointerMove: (event: PointerEvent<HTMLElement>) => {
      const held = hold.current;
      if (held !== null && Math.hypot(event.clientX - held.x, event.clientY - held.y) > SLOP_PX) {
        cancelHold();
      }
      if (drag?.id === id) {
        const { clientX: x, clientY: y } = event;
        setDrag({ ...drag, x, y, over: overAt(x, y) });
      }
    },
    onPointerUp: (event: PointerEvent<HTMLElement>) => {
      cancelHold();
      finish(event, true);
    },
    onPointerCancel: (event: PointerEvent<HTMLElement>) => {
      finish(event, false);
    },
    onContextMenu: (event: MouseEvent<HTMLElement>) => {
      if (enabled) {
        event.preventDefault();
      }
    },
    onClickCapture: (event: MouseEvent<HTMLElement>) => {
      if (guard.current) {
        guard.current = false;
        event.preventDefault();
        event.stopPropagation();
      }
    },
    style: drag?.id === id ? { touchAction: 'none' as const } : undefined,
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
