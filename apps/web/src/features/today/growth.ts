/** How far the Rettich on Start has grown this month (ADR-0043). */
export type GrowthStage = 'seed' | 'sprout' | 'young' | 'grown' | 'model';

/** Confirmed rescues this month from which a stage starts. «Vorbild» is the milestone. */
const STAGES: readonly { stage: GrowthStage; from: number }[] = [
  { stage: 'seed', from: 0 },
  { stage: 'sprout', from: 1 },
  { stage: 'young', from: 3 },
  { stage: 'grown', from: 6 },
  { stage: 'model', from: 10 },
];

/** More leaves would not fit the picture; from the 7th rescue on it grows in stage only. */
export const MAX_LEAVES = 7;

export interface Growth {
  stage: GrowthStage;
  /** One leaf per rescue, up to {@link MAX_LEAVES}. */
  leaves: number;
  /** The next stage and how many rescues are missing for it; none after «Vorbild». */
  next: { stage: GrowthStage; missing: number } | null;
}

export function growthOf(rescues: number): Growth {
  const count = Math.max(0, Math.floor(rescues));
  const reached = STAGES.filter((stage) => count >= stage.from);
  const following = STAGES[reached.length];
  return {
    stage: reached.at(-1)?.stage ?? 'seed',
    leaves: Math.min(count, MAX_LEAVES),
    next:
      following === undefined ? null : { stage: following.stage, missing: following.from - count },
  };
}

/** Leaf angles in degrees, fanned out wider the more leaves there are. */
export function leafAngles(leaves: number): number[] {
  if (leaves <= 1) {
    return leaves === 1 ? [0] : [];
  }
  const spread = Math.min(66, 15 * (leaves - 1));
  return Array.from(
    { length: leaves },
    (_, index) => -spread + (index * 2 * spread) / (leaves - 1),
  );
}
