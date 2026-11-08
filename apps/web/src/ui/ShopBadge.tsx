import type { Retailer } from '@fridgeai/core';
import { Store } from 'lucide-react';
import { useId } from 'react';

/** The letter that names each shop; «Laden» (any other shop) gets the shop symbol instead. */
const LETTER: Record<Exclude<Retailer, 'other'>, string> = {
  coop: 'C',
  migros: 'M',
  denner: 'D',
  aldi: 'A',
  lidl: 'L',
};

/**
 * The Rettich monogram of a shop (Alban, 8.11.2026): one letter in Rettich's own design language,
 * like a hallmark: an onyx tile, a silver serif capital and the emerald line under it, the same for
 * every shop. The first letter says which shop it is; no shop colours, letter shapes or logos (the
 * shops all use sans-serif letters), so it never looks like a shop's mark. Decorative: the shop's
 * name always stands next to it.
 */
export function ShopBadge({ retailer, size = 28 }: { retailer: Retailer; size?: number }) {
  const tile = useId().replace(/[^\w-]/g, '');
  return (
    <svg aria-hidden="true" width={size} height={size} viewBox="0 0 28 28" className="shrink-0">
      <defs>
        <linearGradient id={tile} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#2a2d33" />
          <stop offset="1" stopColor="#0d1012" />
        </linearGradient>
      </defs>
      <rect width="28" height="28" rx="8" fill={`url(#${tile})`} />
      <rect
        x="1"
        y="1"
        width="26"
        height="26"
        rx="7"
        fill="none"
        stroke="#ffffff"
        strokeOpacity="0.12"
      />
      {retailer === 'other' ? (
        <Store x="7.5" y="5.5" width="13" height="13" color="#f3f4f6" strokeWidth={2.2} />
      ) : (
        <text
          x="14"
          y="12.75"
          fontSize="15"
          fontWeight="500"
          fontFamily="ui-serif, 'New York', Georgia, 'Times New Roman', serif"
          fill="#f3f4f6"
          textAnchor="middle"
          dominantBaseline="central"
          letterSpacing="0.2"
        >
          {LETTER[retailer]}
        </text>
      )}
      <rect x="11" y="21" width="6" height="1.4" rx="0.7" fill="#59a884" />
    </svg>
  );
}
