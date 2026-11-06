import {
  createIdGenerator,
  IsoDateTimeSchema,
  toLocalDate,
  type Clock,
  type IdGenerator,
} from '@fridgeai/core';

/** Real time in the browser; «today» is the Swiss calendar day. */
export const browserClock: Clock = {
  now: () => IsoDateTimeSchema.parse(new Date().toISOString()),
  today: () => toLocalDate(new Date()),
};

/** UUIDv7 with cryptographically secure randomness. */
export const browserIds: IdGenerator = {
  next: createIdGenerator(
    () => Date.now(),
    (length) => crypto.getRandomValues(new Uint8Array(length)),
  ),
};
