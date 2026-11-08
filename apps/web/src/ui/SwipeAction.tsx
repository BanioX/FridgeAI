import { Check, Trash2, type LucideIcon } from 'lucide-react';
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

function vibrate(ms: number): void {
  if ('vibrate' in navigator) {
    navigator.vibrate(ms);
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
  /** Whether the row is past the commit point, for one haptic tick when it gets there. */
  armed: boolean;
}

/** One side of a swipe: what is behind the row and what happens when it commits. */
export interface SwipeSide {
  /** Text under the icon, e.g. «Verwertet» or «Entsorgt». */
  label: string;
  /** Smaller second line, e.g. «−1». */
  detail?: string;
  /** Called once when the swipe commits. */
  onCommit: () => void;
}

/** The two sides (Alban, 8.11.2026, «wie bei Spotify»): their colour and icon are fixed. */
const LOOK = {
  // Swiped to the left: the strip shows on the right. Smaragd, like every «done» in Rettich.
  end: { icon: Check, className: 'bg-basil-700', align: 'right-0' },
  // Swiped to the right: the strip shows on the left. Red, like «Abgelaufen».
  start: { icon: Trash2, className: 'bg-danger', align: 'left-0' },
} satisfies Record<string, { icon: LucideIcon; className: string; align: string }>;

interface SwipeActionProps {
  /** Right to left: green, «Verwertet». */
  end: SwipeSide;
  /** Left to right: red, «Entsorgt». */
  start?: SwipeSide | undefined;
  /** The row; a function gets `sliced` for a short moment after the commit (for the picture). */
  children: ReactNode | ((state: { sliced: boolean }) => ReactNode);
}

/**
 * Swipe a row to do one thing with it, like Spotify: to the left over a green strip
 * («Verwertet»), to the right over a red one («Entsorgt»). The row follows the finger; past 40 %
 * of its width, or with a fast flick, the action commits and the row springs back. At the commit
 * point the icon grows and the phone ticks once, so you feel when letting go counts. A tap still
 * reaches the link inside, a drag never does. It is a shortcut only: the same actions exist as
 * plain buttons on the item page (WCAG 2.5.1).
 */
export function SwipeAction({ end, start, children }: SwipeActionProps) {
  const gesture = useRef<Gesture | null>(null);
  const dragged = useRef(false);
  const timer = useRef<number | undefined>(undefined);
  const [offset, setOffset] = useState(0);
  const [armed, setArmed] = useState(false);
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
    setArmed(false);
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
      armed: false,
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
    // Never further than the row is wide, and to the right only when there is a «start» side.
    const next = Math.max(Math.min(dx, start === undefined ? 0 : current.width), -current.width);
    const past = current.width > 0 && Math.abs(next) >= current.width * COMMIT_SHARE;
    if (past !== current.armed) {
      current.armed = past;
      setArmed(past);
      if (past) {
        vibrate(8);
      }
    }
    setOffset(next);
  };

  const onPointerUp = (event: PointerEvent<HTMLDivElement>) => {
    const current = gesture.current;
    if (current?.pointerId !== event.pointerId) {
      return;
    }
    const dx = event.clientX - current.startX;
    const side = dx < 0 ? end : start;
    const far = current.width > 0 && Math.abs(dx) >= current.width * COMMIT_SHARE;
    const flick = Math.abs(dx) >= FLICK_DISTANCE && Math.abs(current.speed) >= FLICK_SPEED;
    const sameWay = Math.sign(current.speed) === Math.sign(dx);
    const commit = current.mode === 'drag' && side !== undefined && (far || (flick && sameWay));
    finish();
    if (!commit) {
      return;
    }
    vibrate(15);
    if (!prefersReducedMotion()) {
      setSliced(true);
      window.clearTimeout(timer.current);
      timer.current = window.setTimeout(() => {
        setSliced(false);
      }, SLICE_MS);
    }
    side.onCommit();
  };

  // A drag ends over the link, too: that click must not open the item page.
  const onClickCapture = (event: MouseEvent<HTMLDivElement>) => {
    if (dragged.current) {
      dragged.current = false;
      event.preventDefault();
      event.stopPropagation();
    }
  };

  const revealed = Math.abs(offset);
  const which = offset < 0 ? 'end' : 'start';
  const side = which === 'end' ? end : start;
  const look = LOOK[which];
  const Icon = look.icon;
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
      {side === undefined ? null : (
        <div
          aria-hidden="true"
          className={`absolute inset-0 text-white transition-opacity ${look.className} ${settle}`}
          style={{ opacity: revealed > 0 ? 1 : 0 }}
        >
          <div
            className={`@container absolute inset-y-0 flex items-center justify-center overflow-hidden transition-[width] ${look.align} ${settle}`}
            style={{ width: `${String(revealed)}px` }}
          >
            <div className="flex flex-col items-center gap-0.5" style={{ opacity: progress }}>
              <Icon
                size={22}
                strokeWidth={2.75}
                className={`transition-transform duration-150 ${armed ? 'scale-125' : 'scale-100'}`}
              />
              <span className="hidden text-sm leading-tight font-semibold whitespace-nowrap @min-[6rem]:block">
                {side.label}
              </span>
              {side.detail === undefined ? null : (
                <span className="hidden text-xs leading-tight whitespace-nowrap @min-[6rem]:block">
                  {side.detail}
                </span>
              )}
            </div>
          </div>
        </div>
      )}
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
