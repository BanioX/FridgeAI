import type { Retailer } from '@fridgeai/core';
import { Store } from 'lucide-react';
import type { ReactNode } from 'react';

const FONT = { fontWeight: 900, textAnchor: 'middle', dominantBaseline: 'central' } as const;

/**
 * Each shop as one letter in the design language of its sign (Alban, 8.11.2026): Coop a small
 * orange «c» on white, Migros a heavy orange «M» on white, Denner a white slanted «D» on red,
 * Lidl a blue «L» on a yellow disc on blue, Aldi a white «A» on dark blue in a warm frame.
 * Colours, letter style and plain shapes only, never the protected marks themselves (Lidl's red
 * ring and diamond, Aldi's striped A and triple frame, Coop's overlapping rings), and always
 * next to the shop's name: it says where something was bought, not that Rettich belongs to it.
 */
const SHOPS: Record<Exclude<Retailer, 'other'>, ReactNode> = {
  coop: (
    <>
      <rect x="0.5" y="0.5" width="27" height="27" rx="6.5" fill="#ffffff" stroke="#e4e4e7" />
      <text x="14" y="13" fontSize="23" fill="#e8580c" {...FONT}>
        c
      </text>
    </>
  ),
  migros: (
    <>
      <rect x="0.5" y="0.5" width="27" height="27" rx="6.5" fill="#ffffff" stroke="#e4e4e7" />
      <text x="14" y="14.5" fontSize="17" fill="#f06a1d" {...FONT}>
        M
      </text>
    </>
  ),
  denner: (
    <>
      <rect width="28" height="28" rx="7" fill="#d7001e" />
      <text
        x="14"
        y="14.5"
        fontSize="17"
        fill="#ffffff"
        transform="skewX(-12) translate(3 0)"
        {...FONT}
      >
        D
      </text>
    </>
  ),
  lidl: (
    <>
      <rect width="28" height="28" rx="7" fill="#0050aa" />
      <circle cx="14" cy="14" r="10.5" fill="#fff000" />
      <text x="14" y="14.5" fontSize="14" fill="#0050aa" {...FONT}>
        L
      </text>
    </>
  ),
  aldi: (
    <>
      <rect width="28" height="28" rx="7" fill="#101c63" />
      <rect
        x="2.5"
        y="2.5"
        width="23"
        height="23"
        rx="5"
        fill="none"
        stroke="#f39200"
        strokeWidth="1.6"
      />
      <text x="14" y="14.5" fontSize="15" fill="#ffffff" {...FONT}>
        A
      </text>
    </>
  ),
};

/** Decorative: the shop's name always stands next to it. */
export function ShopBadge({ retailer, size = 28 }: { retailer: Retailer; size?: number }) {
  if (retailer === 'other') {
    return (
      <span
        aria-hidden="true"
        style={{ width: size, height: size }}
        className="inline-flex shrink-0 items-center justify-center rounded-lg bg-surface-muted text-ink-muted"
      >
        <Store size={Math.round(size * 0.6)} />
      </span>
    );
  }
  return (
    <svg aria-hidden="true" width={size} height={size} viewBox="0 0 28 28" className="shrink-0">
      {SHOPS[retailer]}
    </svg>
  );
}
