import type { ReactNode } from 'react';

/**
 * Apple's inset grouped list (ADR-0021): rows share one white, rounded group and are separated by
 * hairlines that start where the text starts, not by gaps between cards.
 */
export function GroupedList({ children }: { children: ReactNode }) {
  return <ul className="overflow-hidden rounded-2xl bg-surface shadow-card">{children}</ul>;
}

/**
 * One row of a grouped list. `inset` is where the hairline above the row begins, so it lines up
 * with the text after an icon (`icon`, 40 px picture) or a checkbox (`check`).
 */
export function GroupedListItem({
  children,
  inset = 'icon',
  className = '',
}: {
  children: ReactNode;
  inset?: 'icon' | 'check';
  className?: string;
}) {
  const line = inset === 'icon' ? 'before:left-[4.25rem]' : 'before:left-13';
  return (
    <li
      className={`relative before:absolute before:top-0 before:right-0 before:h-px before:bg-line first:before:hidden ${line} ${className}`}
    >
      {children}
    </li>
  );
}

/** Classes for a link that fills a grouped row: highlight on hover and tap, focus ring inside. */
export const GROUPED_ROW_LINK =
  'block hover:bg-surface-muted active:bg-surface-muted focus-visible:outline-2 focus-visible:-outline-offset-2';
