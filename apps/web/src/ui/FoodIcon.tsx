import type { LucideIcon } from 'lucide-react';
import { categoryIcon } from './food-icon-nodes';

const SIZES = {
  /** Inline, beside a word (shopping list, quick add, climate list). */
  xs: { tile: 'size-7 rounded-lg', icon: 16 },
  /** A row of a list. */
  md: { tile: 'size-10 rounded-xl', icon: 22 },
  /** The head of a page. */
  lg: { tile: 'size-16 rounded-2xl', icon: 34 },
} as const;

/**
 * A picture in a calm silver tile (ADR-0080): the same frame for every food, so lists look like
 * one family. Decorative: the name next to it carries the meaning.
 */
export function IconTile({
  icon: Icon,
  size = 'md',
}: {
  icon: LucideIcon;
  size?: keyof typeof SIZES;
}) {
  const { tile, icon } = SIZES[size];
  return (
    <span
      aria-hidden="true"
      className={`grid shrink-0 place-items-center bg-surface-muted text-ink ${tile}`}
    >
      <Icon size={icon} strokeWidth={1.75} />
    </span>
  );
}

/** The picture of a category in its tile; the food's own photo replaces it where there is one. */
export function FoodIcon({
  categoryId,
  size = 'md',
}: {
  categoryId: string;
  size?: keyof typeof SIZES;
}) {
  return <IconTile icon={categoryIcon(categoryId)} size={size} />;
}
