/**
 * Semantic tones of the design system (see docs/design.md).
 * Colour always comes with text: a tone never carries meaning on its own.
 */
export type Tone = 'fresh' | 'soon' | 'today' | 'danger' | 'ice' | 'wheat' | 'olive' | 'neutral';

interface ToneClasses {
  /** Background + text for chips and badges. */
  chip: string;
}

export const toneClasses: Record<Tone, ToneClasses> = {
  fresh: { chip: 'bg-basil-50 text-basil-700' },
  soon: { chip: 'bg-soon-bg text-soon' },
  today: { chip: 'bg-today-bg text-today' },
  danger: { chip: 'bg-danger text-white' },
  ice: { chip: 'bg-ice-bg text-ice' },
  wheat: { chip: 'bg-wheat-bg text-wheat' },
  olive: { chip: 'bg-olive-bg text-olive' },
  neutral: { chip: 'bg-surface-muted text-ink-muted' },
};
