import type { Unit } from '@fridgeai/core';
import { useEffect, useRef, type KeyboardEvent } from 'react';
import { wheelText } from './amount-wheel';

/** Height of one stop in px (44 px: Apple's smallest tap target). */
const ROW = 44;

/**
 * An amount on a wheel like the iPhone's pickers (ADR-0083): scroll or swipe, the middle row is
 * the choice: «250 g», «1.25 kg», «750 ml», «1.5 l». A tap on a row picks
 * it; for the keyboard and screen readers the wheel is a spin button (arrow keys, Home, End).
 */
export function AmountWheel({
  values,
  index,
  unit,
  label,
  onChange,
}: {
  values: readonly number[];
  index: number;
  unit: Unit;
  label: string;
  onChange: (index: number) => void;
}) {
  const list = useRef<HTMLUListElement>(null);
  const settled = useRef(index);

  // Follow a change from outside (opening, keys, a tap): put the chosen row into the middle at
  // once. A smooth scroll would pass other rows, and the scroll handler would pick them.
  useEffect(() => {
    const element = list.current;
    if (element !== null && Math.round(element.scrollTop / ROW) !== index) {
      settled.current = index;
      element.scrollTop = index * ROW;
    }
  }, [index]);

  const pick = (next: number) => {
    const bounded = Math.min(values.length - 1, Math.max(0, next));
    if (bounded !== index) {
      onChange(bounded);
    }
  };

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const moves: Record<string, number> = {
      ArrowUp: index - 1,
      ArrowDown: index + 1,
      PageUp: index - 5,
      PageDown: index + 5,
      Home: 0,
      End: values.length - 1,
    };
    const next = moves[event.key];
    if (next !== undefined) {
      event.preventDefault();
      pick(next);
    }
  };

  const current = values[index] ?? 0;
  return (
    <div
      role="spinbutton"
      tabIndex={0}
      aria-label={label}
      aria-valuemin={values[0] ?? 0}
      aria-valuemax={values.at(-1) ?? 0}
      aria-valuenow={current}
      aria-valuetext={wheelText(current, unit)}
      onKeyDown={onKeyDown}
      className="relative mx-auto w-full max-w-60 rounded-2xl bg-surface-muted focus-visible:outline-2 focus-visible:outline-offset-2"
      style={{ height: ROW * 3 }}
    >
      {/* The band in the middle: what lies in it is the choice. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-2 rounded-xl bg-surface shadow-card"
        style={{ top: ROW, height: ROW }}
      />
      <ul
        ref={list}
        aria-hidden="true"
        onScroll={(event) => {
          const next = Math.round(event.currentTarget.scrollTop / ROW);
          if (next !== settled.current) {
            settled.current = next;
            pick(next);
          }
        }}
        className="relative h-full snap-y snap-mandatory overflow-y-scroll [mask-image:linear-gradient(transparent,black_30%,black_70%,transparent)] [scrollbar-width:none]"
        style={{ paddingBlock: ROW }}
      >
        {values.map((value, position) => (
          <li
            key={value}
            onClick={() => {
              pick(position);
            }}
            className={`grid snap-center place-items-center tabular-nums ${
              position === index ? 'text-lg font-semibold text-ink' : 'text-ink-muted'
            }`}
            style={{ height: ROW }}
          >
            {wheelText(value, unit)}
          </li>
        ))}
      </ul>
    </div>
  );
}
