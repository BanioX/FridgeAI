import { Check } from 'lucide-react';
import {
  useEffect,
  useRef,
  useState,
  type MouseEvent,
  type PointerEvent,
  type ReactNode,
} from 'react';

/** Horizontal movement before a gesture counts as a swipe (and not a tap or a scroll). */
const LOCK_DISTANCE = 10;
/** Share of the row width that commits the action. */
const COMMIT_SHARE = 0.4;
/** A fast flick commits earlier: at least this far, faster than this (px per ms). */
const FLICK_DISTANCE = 60;
const FLICK_SPEED = 0.6;
/** How long the halves of the picture fly (matches `slice-a` and `slice-b` in index.css). */
const SLICE_MS = 350;

function prefersReducedMotion(): boolean {
  return typeof window.matchMedia === 'function'
    ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
    : false;
}

function vibrate(): void {
  if ('vibrate' in navigator) {
    navigator.vibrate(15);
  }
}

interface Gesture {
  pointerId: number;
  startX: number;
  startY: number;
  width: number;
  /** `idle` until the movement decides: `drag` (horizontal) or `scroll` (vertical, not ours). */
  mode: 'idle' | 'drag' | 'scroll';
  /** Last two samples, for the speed of a flick. */
  lastX: number;
  lastTime: number;
  speed: number;
}

interface SwipeActionProps {
  /** Text below the check in the strip behind the row, e.g. «Verwertet». */
  label: string;
  /** Smaller second line, e.g. «−1». */
  detail?: string;
  /** Called once when the swipe commits. */
  onCommit: () => void;
  /** The row; a function gets `sliced` for a short moment after the commit (for the picture). */
  children: ReactNode | ((state: { sliced: boolean }) => ReactNode);
}

/**
 * Swipe a row to the left to do one thing with it (Apple «Mail»-style, for eating one portion).
 * The row follows the finger over a basil strip; past 40 % of its width, or with a fast flick,
 * the action commits and the row springs back. A tap still reaches the link inside, a drag never
 * does. It is a shortcut only: the same action must exist as plain buttons elsewhere (WCAG 2.5.1).
 */
export function SwipeAction({ label, detail, onCommit, children }: SwipeActionProps) {
  const gesture = useRef<Gesture | null>(null);
  const dragged = useRef(false);
  const timer = useRef<number | undefined>(undefined);
  const [offset, setOffset] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [sliced, setSliced] = useState(false);

  useEffect(
    () => () => {
      window.clearTimeout(timer.current);
    },
    [],
  );

  const finish = () => {
    gesture.current = null;
    setDragging(false);
    setOffset(0);
  };

  const onPointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if (event.pointerType === 'mouse' && event.button !== 0) {
      return;
    }
    if (!event.isPrimary) {
      return;
    }
    dragged.current = false;
    gesture.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      width: event.currentTarget.getBoundingClientRect().width,
      mode: 'idle',
      lastX: event.clientX,
      lastTime: event.timeStamp,
      speed: 0,
    };
  };

  const onPointerMove = (event: PointerEvent<HTMLDivElement>) => {
    const current = gesture.current;
    if (current?.pointerId !== event.pointerId || current.mode === 'scroll') {
      return;
    }
    const dx = event.clientX - current.startX;
    const dy = event.clientY - current.startY;
    if (current.mode === 'idle') {
      if (Math.abs(dy) > LOCK_DISTANCE && Math.abs(dy) >= Math.abs(dx)) {
        current.mode = 'scroll';
        return;
      }
      if (Math.abs(dx) <= LOCK_DISTANCE || Math.abs(dx) <= Math.abs(dy)) {
        return;
      }
      current.mode = 'drag';
      dragged.current = true;
      setDragging(true);
      try {
        event.currentTarget.setPointerCapture(event.pointerId);
      } catch {
        // Not supported (tests): the move events still reach the row while the pointer is over it.
      }
    }
    const elapsed = event.timeStamp - current.lastTime;
    if (elapsed > 0) {
      current.speed = (event.clientX - current.lastX) / elapsed;
    }
    current.lastX = event.clientX;
    current.lastTime = event.timeStamp;
    // Only to the left, and never further than the row is wide.
    setOffset(Math.max(Math.min(dx, 0), -current.width));
  };

  const onPointerUp = (event: PointerEvent<HTMLDivElement>) => {
    const current = gesture.current;
    if (current?.pointerId !== event.pointerId) {
      return;
    }
    const dx = event.clientX - current.startX;
    const far = current.width > 0 && -dx >= current.width * COMMIT_SHARE;
    const flick = -dx >= FLICK_DISTANCE && -current.speed >= FLICK_SPEED;
    const commit = current.mode === 'drag' && (far || flick);
    finish();
    if (!commit) {
      return;
    }
    vibrate();
    if (!prefersReducedMotion()) {
      setSliced(true);
      window.clearTimeout(timer.current);
      timer.current = window.setTimeout(() => {
        setSliced(false);
      }, SLICE_MS);
    }
    onCommit();
  };

  // A drag ends over the link, too: that click must not open the item page.
  const onClickCapture = (event: MouseEvent<HTMLDivElement>) => {
    if (dragged.current) {
      dragged.current = false;
      event.preventDefault();
      event.stopPropagation();
    }
  };

  const revealed = Math.max(0, -offset);
  const progress = Math.min(1, revealed / 80);
  // The row's own content fades as it slides away, so its clipped edge never competes with the
  // action (docs/design.md, «Immer sauber ausgerichtet»).
  const contentOpacity = 1 - 0.7 * Math.min(1, Math.max(0, (revealed - 48) / 120));
  const settle = dragging ? '' : 'duration-300';

  return (
    <div className="relative overflow-hidden">
      {/*
        Behind the row. Its content is always centred in the uncovered part, icon above text, and
        the text only shows once it fits whole: never clipped, never off-centre (docs/design.md).
      */}
      <div
        aria-hidden="true"
        className={`absolute inset-0 bg-basil-700 text-white transition-opacity ${settle}`}
        style={{ opacity: revealed > 0 ? 1 : 0 }}
      >
        <div
          className={`@container absolute inset-y-0 right-0 flex items-center justify-center overflow-hidden transition-[width] ${settle}`}
          style={{ width: `${String(revealed)}px` }}
        >
          <div className="flex flex-col items-center gap-0.5" style={{ opacity: progress }}>
            <Check size={22} strokeWidth={3} />
            <span className="hidden text-sm leading-tight font-semibold whitespace-nowrap @min-[6rem]:block">
              {label}
            </span>
            {detail === undefined ? null : (
              <span className="hidden text-xs leading-tight whitespace-nowrap @min-[6rem]:block">
                {detail}
              </span>
            )}
          </div>
        </div>
      </div>
      <div
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={finish}
        onClickCapture={onClickCapture}
        onDragStart={(event) => {
          event.preventDefault();
        }}
        style={{ transform: `translateX(${String(offset)}px)`, touchAction: 'pan-y' }}
        className={`relative bg-surface ${
          dragging
            ? 'cursor-grabbing select-none'
            : 'transition-transform duration-300 ease-[cubic-bezier(0.2,0.9,0.3,1.15)]'
        }`}
      >
        <div className={`transition-opacity ${settle}`} style={{ opacity: contentOpacity }}>
          {typeof children === 'function' ? children({ sliced }) : children}
        </div>
      </div>
    </div>
  );
}
