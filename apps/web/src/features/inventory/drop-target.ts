import { StorageLocationSchema, type StorageLocation } from '@fridgeai/core';

/** The pots that settle the selection (ADR-0055). Freezing is the Tiefkühler tab. */
export const SETTLE_ACTIONS = ['eaten', 'wasted', 'process', 'rebuy'] as const;
export type SettleAction = (typeof SETTLE_ACTIONS)[number];

/** Where a dragged parcel can land: a storage-location tab or a pot. */
export type DropTarget =
  { kind: 'location'; location: StorageLocation } | { kind: 'action'; action: SettleAction };

/** The attribute value of a target, e.g. `location:fridge` or `action:eaten`. */
export function dropKey(target: DropTarget): string {
  return target.kind === 'location' ? `location:${target.location}` : `action:${target.action}`;
}

export function sameTarget(a: DropTarget | null, b: DropTarget): boolean {
  return a !== null && dropKey(a) === dropKey(b);
}

function parse(value: string | null | undefined): DropTarget | null {
  const [kind, name, ...rest] = (value ?? '').split(':');
  if (rest.length > 0) {
    return null;
  }
  if (kind === 'location') {
    const location = StorageLocationSchema.safeParse(name);
    return location.success ? { kind: 'location', location: location.data } : null;
  }
  if (kind === 'action') {
    const action = SETTLE_ACTIONS.find((known) => known === name);
    return action === undefined ? null : { kind: 'action', action };
  }
  return null;
}

/**
 * The tabs carry `data-drop-target="location:fridge"` and the pots `data-drop-target="action:eaten"`;
 * this finds the one under an element.
 */
export function dropTargetFrom(element: Element | null): DropTarget | null {
  return parse(element?.closest('[data-drop-target]')?.getAttribute('data-drop-target'));
}
