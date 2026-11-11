import {
  IdSchema,
  OutcomeSchema,
  StorageLocationSchema,
  type Id,
  type Outcome,
  type StorageLocation,
} from '@fridgeai/core';

/**
 * What the detail page hands to the Vorrat page when an item leaves the list, so it can offer
 * undo: closed as eaten, shared or wasted (undo the outcome) or deleted by mistake (restore it).
 */
export type ClosedItem =
  | {
      kind: 'outcome';
      eventId: Id;
      name: string;
      outcome: Outcome;
      /** Confirmed as rescued (ADR-0039): the value for «Gerettet: CHF 2.10». */
      rescuedRappen?: number;
      /** The value is a category estimate, not a price from the receipt. */
      estimated?: true;
    }
  | { kind: 'deleted'; itemId: Id; name: string }
  /**
   * «Verarbeiten» (ADR-0052): ingredients used up and, maybe, a new item. Undo gives the
   * ingredients back (their outcomes) and removes the new item. `name` is empty for «Gekocht».
   */
  | {
      kind: 'processed';
      name: string;
      outcomeIds: Id[];
      resultItemId?: Id;
      location: StorageLocation;
    };

/** Router state survives reloads in the browser history: read it defensively. */
export function closedItemFrom(state: unknown): ClosedItem | null {
  if (typeof state !== 'object' || state === null || !('closed' in state)) {
    return null;
  }
  const closed: unknown = state.closed;
  if (typeof closed !== 'object' || closed === null) {
    return null;
  }
  const fields = closed as Record<string, unknown>;
  const name = typeof fields.name === 'string' ? fields.name.slice(0, 120) : null;
  if (name === null) {
    return null;
  }
  if (fields.kind === 'processed') {
    const parsed = Array.isArray(fields.outcomeIds)
      ? fields.outcomeIds.map((value) => IdSchema.safeParse(value))
      : [];
    const outcomeIds = parsed.flatMap((entry) => (entry.success ? [entry.data] : []));
    const resultItemId = IdSchema.safeParse(fields.resultItemId);
    const location = StorageLocationSchema.safeParse(fields.location);
    return location.success && outcomeIds.length === parsed.length
      ? {
          kind: 'processed',
          name,
          outcomeIds: outcomeIds.slice(0, 50),
          ...(resultItemId.success ? { resultItemId: resultItemId.data } : {}),
          location: location.data,
        }
      : null;
  }
  if (fields.kind === 'deleted') {
    const itemId = IdSchema.safeParse(fields.itemId);
    return itemId.success ? { kind: 'deleted', itemId: itemId.data, name } : null;
  }
  // Entries from before «kind» existed are outcomes.
  const eventId = IdSchema.safeParse(fields.eventId);
  const outcome = OutcomeSchema.safeParse(fields.outcome);
  return (fields.kind === undefined || fields.kind === 'outcome') &&
    eventId.success &&
    outcome.success
    ? {
        kind: 'outcome',
        eventId: eventId.data,
        name,
        outcome: outcome.data,
        ...(typeof fields.rescuedRappen === 'number' &&
        Number.isSafeInteger(fields.rescuedRappen) &&
        fields.rescuedRappen >= 0
          ? {
              rescuedRappen: fields.rescuedRappen,
              ...(fields.estimated === true ? { estimated: true as const } : {}),
            }
          : {}),
      }
    : null;
}
