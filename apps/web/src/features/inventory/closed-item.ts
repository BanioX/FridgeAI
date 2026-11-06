import { IdSchema, OutcomeSchema, type Id, type Outcome } from '@fridgeai/core';

/** What the detail page hands to the Vorrat page after closing an item, so it can offer undo. */
export interface ClosedItem {
  eventId: Id;
  name: string;
  outcome: Outcome;
}

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
  const eventId = IdSchema.safeParse(fields.eventId);
  const outcome = OutcomeSchema.safeParse(fields.outcome);
  const name = typeof fields.name === 'string' ? fields.name.slice(0, 120) : null;
  return eventId.success && outcome.success && name !== null
    ? { eventId: eventId.data, name, outcome: outcome.data }
    : null;
}
