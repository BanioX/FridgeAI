import { ChevronRight } from 'lucide-react';
import type { ReactNode } from 'react';
import type { Retailer } from '@fridgeai/core';
import { ShopBadge } from './ShopBadge';
import { StatusChip } from './StatusChip';
import type { Tone } from './tones';

interface ItemRowProps {
  emoji: string;
  /** Pack picture (data URL); replaces the emoji when there is one. */
  image?: string | undefined;
  name: string;
  meta: string;
  status: { tone: Tone; label: string };
  /** Disclosure chevron for rows that open a detail page (Apple: «›» on navigating rows). */
  chevron?: boolean;
  /** Plays the «slice» of the picture (two halves fly apart) after a swipe. */
  sliced?: boolean;
  /** Where it was bought (from its receipt): the shop letter before the meta line, `label` for screen readers. */
  shop?: { retailer: Retailer; label: string } | undefined;
  /** Calm state badges under the meta line (at most two in a row). */
  badges?: ReactNode;
  /** Who it belongs to (initials circle) beside the name; none = everyone's. */
  owner?: ReactNode;
}

/**
 * One inventory item as a row of a grouped list: pack picture or food emoji, name, meta line and
 * the expiry chip, whose text carries the status (colour only supports it).
 */
export function ItemRow({
  emoji,
  image,
  name,
  meta,
  status,
  chevron = false,
  sliced = false,
  shop,
  badges,
  owner,
}: ItemRowProps) {
  const picture =
    image === undefined ? (
      <span
        aria-hidden="true"
        className="grid size-10 shrink-0 place-items-center text-2xl leading-none"
      >
        {emoji}
      </span>
    ) : (
      <img
        src={image}
        alt=""
        className="size-10 shrink-0 rounded-lg bg-surface-muted object-contain"
      />
    );
  return (
    <div className="flex min-h-15 items-center gap-3 py-2.5 pr-3 pl-4">
      {/* The two halves lie on top of the picture while it is sliced (see `slice-a` in index.css). */}
      <span className="relative size-10 shrink-0">
        <span className={`block transition-opacity duration-200 ${sliced ? 'opacity-0' : ''}`}>
          {picture}
        </span>
        {sliced ? (
          <>
            <span
              aria-hidden="true"
              className="slice-a absolute inset-0 [clip-path:polygon(0_0,100%_0,0_100%)]"
            >
              {picture}
            </span>
            <span
              aria-hidden="true"
              className="slice-b absolute inset-0 [clip-path:polygon(100%_0,100%_100%,0_100%)]"
            >
              {picture}
            </span>
          </>
        ) : null}
      </span>
      {/* Below 360 px (small phones, large text) the chip goes under the name, so the name stays
          readable instead of «Rauc…». */}
      <div className="flex min-w-0 flex-1 items-center gap-3 max-[359px]:flex-col max-[359px]:items-start max-[359px]:gap-1">
        <div className="min-w-0 flex-1 max-[359px]:w-full">
          <p className="flex items-center gap-1.5 font-semibold">
            <span className="truncate">{name}</span>
            {owner}
          </p>
          <p className="flex items-center gap-1.5 text-sm text-ink-muted">
            {shop === undefined ? null : (
              <>
                <ShopBadge retailer={shop.retailer} size={16} />
                <span className="sr-only">{shop.label}. </span>
              </>
            )}
            <span className="truncate">{meta}</span>
          </p>
          {badges === undefined ? null : <div className="mt-1">{badges}</div>}
        </div>
        <StatusChip tone={status.tone}>{status.label}</StatusChip>
      </div>
      {chevron ? (
        <ChevronRight size={18} aria-hidden="true" className="-ml-1 shrink-0 text-ink-muted/60" />
      ) : null}
    </div>
  );
}
