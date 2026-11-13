import { toneClasses } from './tones';

const SIZES = {
  /** In a list row: about 22 px, one line of text high. */
  sm: 'size-[22px] text-[10px]',
  md: 'size-8 text-xs',
} as const;

interface OwnerBadgeProps {
  initials: string;
  size?: keyof typeof SIZES;
  /** Screen-reader text («Gehört Mia»); without it the circle is decorative (the name is next to it). */
  label?: string;
}

/**
 * The initials of a person in a circle: «this is Mia's». Silver for everyone (ADR-0075): the
 * letters and the name next to them carry the meaning, not a colour.
 */
export function OwnerBadge({ initials, size = 'md', label }: OwnerBadgeProps) {
  return (
    <span
      {...(label === undefined ? { 'aria-hidden': true } : { role: 'img', 'aria-label': label })}
      className={`inline-flex shrink-0 items-center justify-center rounded-full leading-none font-bold ring-1 ring-current/25 ring-inset ${SIZES[size]} ${toneClasses.neutral.chip}`}
    >
      {initials}
    </span>
  );
}
