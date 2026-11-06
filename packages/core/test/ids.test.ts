import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { createIdGenerator, IdSchema, isUuidV7, uuidV7, uuidV7Timestamp } from '../src/ids';

const fixedRandom = (byte: number) => new Uint8Array(10).fill(byte);

describe('uuidV7', () => {
  it('builds an RFC 9562 version 7 UUID', () => {
    const id = uuidV7(0x0190_1234_5678, fixedRandom(0xff));
    expect(id).toBe('01901234-5678-7fff-bfff-ffffffffffff');
    expect(isUuidV7(id)).toBe(true);
    expect(IdSchema.safeParse(id).success).toBe(true);
  });

  it('embeds the timestamp and sorts by creation time', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 2 ** 48 - 2 }),
        fc.uint8Array({ minLength: 10, maxLength: 10 }),
        fc.uint8Array({ minLength: 10, maxLength: 10 }),
        (time, randomA, randomB) => {
          const earlier = uuidV7(time, randomA);
          const later = uuidV7(time + 1, randomB);
          expect(isUuidV7(earlier)).toBe(true);
          expect(uuidV7Timestamp(earlier)).toBe(time);
          expect(earlier < later).toBe(true);
        },
      ),
    );
  });

  it('rejects invalid timestamps and short randomness', () => {
    expect(() => uuidV7(-1, fixedRandom(0))).toThrow(RangeError);
    expect(() => uuidV7(2 ** 48, fixedRandom(0))).toThrow(RangeError);
    expect(() => uuidV7(1.5, fixedRandom(0))).toThrow(RangeError);
    expect(() => uuidV7(0, new Uint8Array(9))).toThrow(RangeError);
  });

  it('rejects non-v7 and uppercase IDs in the schema', () => {
    expect(IdSchema.safeParse('01901234-5678-4fff-bfff-ffffffffffff').success).toBe(false);
    expect(IdSchema.safeParse('01901234-5678-7FFF-BFFF-FFFFFFFFFFFF').success).toBe(false);
    expect(IdSchema.safeParse('not-an-id').success).toBe(false);
  });
});

describe('createIdGenerator', () => {
  it('uses the injected clock and randomness', () => {
    let calls = 0;
    const next = createIdGenerator(
      () => 1_762_441_200_000,
      (length) => {
        calls += 1;
        return new Uint8Array(length).fill(calls);
      },
    );
    const first = next();
    const second = next();
    expect(uuidV7Timestamp(first)).toBe(1_762_441_200_000);
    expect(first).not.toBe(second);
  });
});
