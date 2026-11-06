import { z } from 'zod';

/**
 * Entity IDs are UUIDv7 (RFC 9562): generated on the device, offline, collision-free in practice
 * and roughly sortable by creation time. See ADR-0003.
 */
export const UUID_V7_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

export const IdSchema = z
  .string()
  .regex(UUID_V7_PATTERN, 'Expected a lowercase UUIDv7')
  .brand<'Id'>();
export type Id = z.infer<typeof IdSchema>;

const MAX_TIMESTAMP = 2 ** 48 - 1;
const RANDOM_BYTES = 10;

/**
 * Builds a UUIDv7 from a Unix timestamp in milliseconds and 10 random bytes.
 * Pure: the caller provides time and randomness (via the IdGenerator port in apps).
 */
export function uuidV7(timestampMs: number, random: Uint8Array): Id {
  if (!Number.isSafeInteger(timestampMs) || timestampMs < 0 || timestampMs > MAX_TIMESTAMP) {
    throw new RangeError(`timestampMs must be an integer between 0 and 2^48-1`);
  }
  if (random.length < RANDOM_BYTES) {
    throw new RangeError(`uuidV7 needs ${String(RANDOM_BYTES)} random bytes`);
  }

  const bytes = new Uint8Array(16);
  let time = timestampMs;
  for (let i = 5; i >= 0; i -= 1) {
    bytes[i] = time % 256;
    time = Math.floor(time / 256);
  }
  bytes[6] = 0x70 | ((random[0] ?? 0) & 0x0f); // version 7 + rand_a (high)
  bytes[7] = random[1] ?? 0; // rand_a (low)
  bytes[8] = 0x80 | ((random[2] ?? 0) & 0x3f); // variant 10 + rand_b
  for (let i = 3; i < RANDOM_BYTES; i += 1) {
    bytes[i + 6] = random[i] ?? 0;
  }

  const hex = Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}` as Id;
}

export function isUuidV7(value: string): value is Id {
  return UUID_V7_PATTERN.test(value);
}

/** Reads the creation time (Unix ms) embedded in a UUIDv7. */
export function uuidV7Timestamp(id: Id): number {
  return Number.parseInt(id.slice(0, 8) + id.slice(9, 13), 16);
}

/** Creates an ID generator from a clock and a source of random bytes (both injected). */
export function createIdGenerator(
  now: () => number,
  randomBytes: (length: number) => Uint8Array,
): () => Id {
  return () => uuidV7(now(), randomBytes(RANDOM_BYTES));
}
