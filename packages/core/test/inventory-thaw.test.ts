import { beforeEach, describe, expect, it } from 'vitest';
import {
  createInventoryUseCases,
  createMemoryStorage,
  IsoDateTimeSchema,
  localDate,
  uuidV7,
  type Id,
  type Storage,
} from '../src';

/** `inventory.move`: the thaw field and the «Trotzdem einfrieren» path. */
let storage: Storage;
let inventory: ReturnType<typeof createInventoryUseCases>;
let counter = 10;
const householdId = id(1);

function id(n: number): Id {
  const random = new Uint8Array(10);
  random[9] = n;
  return uuidV7(1_762_500_000_000 + n, random);
}
const next = () => id((counter += 1));

beforeEach(() => {
  storage = createMemoryStorage();
  inventory = createInventoryUseCases({
    storage,
    clock: {
      now: () => IsoDateTimeSchema.parse('2026-11-07T09:00:00.000Z'),
      today: () => localDate('2026-11-07'),
    },
    ids: { next },
    actor: id(2),
  });
});

const add = (name: string) =>
  inventory['inventory.addItem']({
    commandId: next(),
    householdId,
    name,
    location: 'fridge',
  });
const move = (itemId: Id, to: 'fridge' | 'freezer', extra: Record<string, unknown> = {}) =>
  inventory['inventory.move']({ commandId: next(), householdId, itemId, to, ...extra });

describe('inventory.move: thawed and unsuitable', () => {
  it('sets thawedOn when leaving the freezer and clears it when freezing again', async () => {
    const { itemId } = await add('Hackfleisch');
    await move(itemId, 'freezer');
    expect((await storage.items.get(itemId))?.frozenOn).toBe('2026-11-07');
    await move(itemId, 'fridge');
    const thawed = await storage.items.get(itemId);
    expect(thawed?.thawedOn).toBe('2026-11-07');
    expect(thawed?.frozenOn).toBeUndefined();
    await move(itemId, 'freezer');
    const again = await storage.items.get(itemId);
    expect(again?.thawedOn).toBeUndefined();
    expect(again?.frozenOn).toBe('2026-11-07');
  });

  it('refuses unsuitable food unless allowUnsuitable, then keeps its date', async () => {
    const { itemId, expiresOn } = await add('Kopfsalat');
    await expect(move(itemId, 'freezer')).rejects.toMatchObject({ code: 'unsuitable_location' });
    const result = await move(itemId, 'freezer', { allowUnsuitable: true });
    expect(result.expiresOn).toBe(expiresOn);
    const item = await storage.items.get(itemId);
    expect(item?.location).toBe('freezer');
    expect(item?.frozenOn).toBe('2026-11-07');
  });
});
