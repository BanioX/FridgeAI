import type { Retailer } from '@fridgeai/core';
import { Store } from 'lucide-react';

/**
 * A shop as one letter in its colour (Alban, 8.11.2026): orange C for Coop, orange M for Migros,
 * red D for Denner, yellow L on blue for Lidl, A on dark blue for Aldi. Rettich's own font and
 * shape, never a logo, and always next to the shop's name: it says where something was bought,
 * not that Rettich belongs to the shop (the trademark note on the receipt page stays).
 */
const SHOPS: Record<Exclude<Retailer, 'other'>, { letter: string; fill: string; ink: string }> = {
  coop: { letter: 'C', fill: '#f05a00', ink: '#ffffff' },
  migros: { letter: 'M', fill: '#ff6a00', ink: '#ffffff' },
  denner: { letter: 'D', fill: '#e2001a', ink: '#ffffff' },
  lidl: { letter: 'L', fill: '#0050aa', ink: '#fff000' },
  aldi: { letter: 'A', fill: '#14246e', ink: '#ffffff' },
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
  const shop = SHOPS[retailer];
  return (
    <svg aria-hidden="true" width={size} height={size} viewBox="0 0 28 28" className="shrink-0">
      <rect width="28" height="28" rx="7" fill={shop.fill} />
      <text
        x="14"
        y="14.5"
        dominantBaseline="central"
        textAnchor="middle"
        fontSize="17"
        fontWeight="800"
        fill={shop.ink}
      >
        {shop.letter}
      </text>
    </svg>
  );
}
