/**
 * Semantic tones of the design system (see docs/design.md).
 * Colour always comes with text: a tone never carries meaning on its own.
 */
export type Tone = 'fresh' | 'soon' | 'today' | 'danger' | 'ice' | 'wheat' | 'olive' | 'neutral';

interface ToneClasses {
  /** Background + text for chips and badges. */
  chip: string;
  /** Solid accent, e.g. the status bar of an item row. */
  accent: string;
}

export const toneClasses: Record<Tone, ToneClasses> = {
  fresh: { chip: 'bg-basil-50 text-basil-700', accent: 'bg-basil-400' },
  soon: { chip: 'bg-soon-bg text-soon', accent: 'bg-soon-accent' },
  today: { chip: 'bg-today-bg text-today', accent: 'bg-today-accent' },
  danger: { chip: 'bg-danger text-white', accent: 'bg-danger' },
  ice: { chip: 'bg-ice-bg text-ice', accent: 'bg-ice' },
  wheat: { chip: 'bg-wheat-bg text-wheat', accent: 'bg-wheat' },
  olive: { chip: 'bg-olive-bg text-olive', accent: 'bg-olive' },
  neutral: { chip: 'bg-surface-muted text-ink-muted', accent: 'bg-line' },
};
