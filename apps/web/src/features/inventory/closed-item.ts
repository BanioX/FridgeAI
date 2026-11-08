import { IdSchema, OutcomeSchema, type Id, type Outcome } from '@fridgeai/core';

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
  | { kind: 'deleted'; itemId: Id; name: string };

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
