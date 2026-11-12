import { toneClasses, type Tone } from './tones';

/**
 * Calm tones for the people of a household, taken from the existing colour pairs (text and
 * background with AA contrast). The colour follows the person's order and only supports the
 * letters: the initials (and the name next to them) always carry the meaning.
 */
const PALETTE: readonly Tone[] = ['fresh', 'ice', 'wheat', 'olive', 'soon'];

export function ownerTone(index: number): Tone {
  return PALETTE[((index % PALETTE.length) + PALETTE.length) % PALETTE.length] ?? 'neutral';
}

const SIZES = {
  /** In a list row: about 22 px, one line of text high. */
  sm: 'size-[22px] text-[10px]',
  md: 'size-8 text-xs',
} as const;

interface OwnerBadgeProps {
  initials: string;
  /** Position of the person in the household, which picks the tone. */
  index: number;
  size?: keyof typeof SIZES;
  /** Screen-reader text («Gehört Mia»); without it the circle is decorative (the name is next to it). */
  label?: string;
}

/** The initials of a person in a circle: «this is Mia's». */
export function OwnerBadge({ initials, index, size = 'md', label }: OwnerBadgeProps) {
  return (
    <span
      {...(label === undefined ? { 'aria-hidden': true } : { role: 'img', 'aria-label': label })}
      className={`inline-flex shrink-0 items-center justify-center rounded-full leading-none font-bold ring-1 ring-current/25 ring-inset ${SIZES[size]} ${toneClasses[ownerTone(index)].chip}`}
    >
      {initials}
    </span>
  );
}
