import { IsoDateTimeSchema, localDate, uuidV7, type Clock, type IdGenerator } from '@fridgeai/core';
import { FridgeDb } from './db';

/** A fresh, isolated database per test (fake-indexeddb must be imported by the test file). */
export function testDb(): FridgeDb {
  return new FridgeDb(`test-${crypto.randomUUID()}`);
}

export function fixedClock(now = '2026-11-06T09:00:00.000Z', today = '2026-11-06'): Clock {
  return { now: () => IsoDateTimeSchema.parse(now), today: () => localDate(today) };
}

export function sequentialIds(): IdGenerator {
  let counter = 0;
  return {
    next: () => {
      counter += 1;
      const random = new Uint8Array(10);
      random[9] = counter % 256;
      random[8] = Math.floor(counter / 256) % 256;
      return uuidV7(1_762_419_600_000 + counter, random);
    },
  };
}
