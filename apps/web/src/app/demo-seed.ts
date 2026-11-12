import {
  addDays,
  IsoDateTimeSchema,
  type Clock,
  type Id,
  type LocalDate,
  type Retailer,
  type StorageLocation,
  type WasteReason,
} from '@fridgeai/core';
import { createInventoryHandlers } from '../data/handlers';
import type { AppData } from './AppData';

/*
 * The demo household of the previews (route /dev/seed, branch `demo` only): a flat share that has
 * used Rettich for about three months. Weekly receipts from five shops, what was used, rescued and
 * thrown away, two more people, places and a minimum stock, so that the Bilanz, the Klimabilanz,
 * the Journal, the Abzeichen and the Auszüge have something to show. Everything is sample data
 * relative to today; nothing here is product copy.
 */

const DAY_MS = 86_400_000;
const WEEKS = 14;
const SHOPS: readonly Retailer[] = ['coop', 'migros', 'lidl', 'denner', 'aldi'];
const REASONS: readonly WasteReason[] = ['expired', 'forgotten', 'spoiled', 'too_much'];

interface Bought {
  name: string;
  location: StorageLocation;
  quantity: number;
  unit: 'pcs' | 'g';
  /** Usual price in Rappen; shops differ by a few Rappen. */
  price: number;
  /** Days from the purchase to the date on the pack. */
  keeps: number;
}

const BASKET: readonly Bought[] = [
  { name: 'Vollmilch', location: 'fridge', quantity: 1, unit: 'pcs', price: 165, keeps: 7 },
  { name: 'Joghurt', location: 'fridge', quantity: 4, unit: 'pcs', price: 380, keeps: 14 },
  { name: 'Ruchbrot', location: 'pantry', quantity: 1, unit: 'pcs', price: 320, keeps: 3 },
  { name: 'Bananen', location: 'pantry', quantity: 5, unit: 'pcs', price: 250, keeps: 5 },
  { name: 'Hackfleisch', location: 'fridge', quantity: 300, unit: 'g', price: 690, keeps: 2 },
  { name: 'Blattspinat', location: 'fridge', quantity: 250, unit: 'g', price: 295, keeps: 4 },
  { name: 'Mozzarella', location: 'fridge', quantity: 1, unit: 'pcs', price: 220, keeps: 10 },
  { name: 'Pouletbrust', location: 'fridge', quantity: 400, unit: 'g', price: 890, keeps: 3 },
  { name: 'Tomaten', location: 'fridge', quantity: 500, unit: 'g', price: 350, keeps: 6 },
  { name: 'Eier', location: 'fridge', quantity: 6, unit: 'pcs', price: 420, keeps: 21 },
  { name: 'Rüebli', location: 'fridge', quantity: 1000, unit: 'g', price: 220, keeps: 14 },
  { name: 'Rahm', location: 'fridge', quantity: 1, unit: 'pcs', price: 260, keeps: 10 },
  { name: 'Rauchlachs', location: 'fridge', quantity: 1, unit: 'pcs', price: 520, keeps: 4 },
  { name: 'Äpfel', location: 'fridge', quantity: 6, unit: 'pcs', price: 390, keeps: 14 },
  { name: 'Emmentaler', location: 'fridge', quantity: 250, unit: 'g', price: 480, keeps: 21 },
  { name: 'Butter', location: 'fridge', quantity: 250, unit: 'g', price: 345, keeps: 30 },
];

type Fate = 'eaten' | 'rescued' | 'wasted';

/** Fewer things are thrown away and more are rescued as the weeks go by: the story of the demo. */
function fateOf(week: number, index: number): Fate {
  const roll = (week * 7 + index * 3) % 10;
  const wasted = week < 5 ? 3 : week < 10 ? 2 : 1;
  if (roll < wasted) {
    return 'wasted';
  }
  return roll < 5 ? 'rescued' : 'eaten';
}

/** A receipt hash is 64 hex digits; the demo only needs them to differ. */
const hashOf = (week: number) => week.toString(16).padStart(4, '0').repeat(16);

export async function seedDemo(data: AppData): Promise<void> {
  const { db, householdId, ids, memberId, today } = data;
  const { items } = await data.inventory['inventory.list']({ householdId });
  if (items.length > 0) {
    return;
  }
  const now = Date.now();
  /** The handlers as they were `daysAgo` days ago, so purchases and outcomes carry their day. */
  const at = (daysAgo: number) => {
    const clock: Clock = {
      now: () => IsoDateTimeSchema.parse(new Date(now - daysAgo * DAY_MS).toISOString()),
      today: () => addDays(today, -daysAgo),
    };
    return { clock, handlers: createInventoryHandlers({ db, clock, ids, actor: memberId }) };
  };
  const command = () => ({ commandId: ids.next(), householdId });

  // Two more people share the flat.
  const people: Id[] = [];
  for (const displayName of ['Lena', 'Noah']) {
    const added = await data.household['household.addMember']({ ...command(), displayName });
    people.push(added.memberId);
  }

  // Three months of weekly shopping. Every purchase is closed by yesterday.
  for (let week = 0; week < WEEKS; week += 1) {
    const boughtAgo = (WEEKS - week) * 7 - 2;
    const shop = SHOPS[week % SHOPS.length] ?? 'coop';
    const basket = BASKET.filter((_, index) => (index + week) % 2 === 0 || index < 4);
    const lines = basket.map((bought, index) => ({
      name: bought.name,
      kind: 'item' as const,
      quantity: bought.quantity,
      unit: bought.unit,
      priceRappen: bought.price + ((week + index) % SHOPS.length) * 5,
      discountRappen: 0,
      isFood: true,
      location: bought.location,
    }));
    const purchase = at(boughtAgo);
    const { itemIds } = await purchase.handlers['receipts.import']({
      ...command(),
      retailer: shop,
      purchasedAt: purchase.clock.now(),
      totalRappen: lines.reduce((sum, line) => sum + line.priceRappen, 0),
      source: 'pdf',
      hash: hashOf(week),
      lines,
    });
    for (const [index, bought] of basket.entries()) {
      const itemId = itemIds[index];
      if (itemId === undefined) {
        continue;
      }
      const expiresAgo = boughtAgo - bought.keeps;
      await purchase.handlers['inventory.updateItem']({
        ...command(),
        itemId,
        expiresOn: addDays(today, -expiresAgo),
      });
      const fate = fateOf(week, index);
      const wantedAgo =
        fate === 'wasted'
          ? expiresAgo - 2
          : fate === 'rescued'
            ? expiresAgo
            : boughtAgo - Math.max(1, Math.floor(bought.keeps / 2));
      // What would only happen today or later was simply used up on one of the days since.
      const happened = wantedAgo >= 1;
      const outcomeAgo = happened ? wantedAgo : 1 + ((week + index * 2) % (boughtAgo - 1));
      const outcome = happened && fate === 'wasted' ? 'wasted' : 'eaten';
      await at(outcomeAgo).handlers['inventory.recordOutcome']({
        ...command(),
        itemId,
        outcome,
        ...(outcome === 'wasted' ? { wasteReason: REASONS[(week + index) % REASONS.length] } : {}),
        ...(happened && fate === 'rescued' ? { rescued: true } : {}),
      });
    }
  }

  // The fridge check was done last week.
  await at(6).handlers['inventory.completeCheck']({ ...command(), itemCount: 7 });

  // What is at home today: a typical fridge with something to rescue.
  const on = (days: number): LocalDate => addDays(today, days);
  const samples = [
    { name: 'Hackfleisch', location: 'fridge', quantity: 300, unit: 'g', priceRappen: 690 },
    {
      name: 'Rauchlachs',
      location: 'fridge',
      expiresOn: on(-1),
      expiryKind: 'use_by',
      priceRappen: 520,
    },
    { name: 'Vollmilch', location: 'fridge', expiresOn: on(0), priceRappen: 165 },
    { name: 'Blattspinat', location: 'fridge', quantity: 250, unit: 'g', expiresOn: on(2) },
    { name: 'Mozzarella', location: 'fridge', expiresOn: on(3), priceRappen: 220 },
    { name: 'Joghurt', location: 'fridge', quantity: 4, expiresOn: on(9), priceRappen: 380 },
    { name: 'Grana Padano', location: 'fridge', quantity: 100, unit: 'g', expiresOn: on(120) },
    { name: 'Ruchbrot', location: 'pantry', expiresOn: on(2) },
    { name: 'Basmatireis', location: 'pantry', quantity: 1000, unit: 'g' },
    { name: 'Erbsen', location: 'freezer', quantity: 750, unit: 'g' },
    { name: 'Pouletbrust', location: 'freezer', quantity: 400, unit: 'g' },
    { name: 'Gefriergetrocknet Risotto', location: 'reserve', expiresOn: on(9125) },
    { name: 'Notwasser', location: 'reserve', quantity: 6, expiresOn: on(60) },
  ] as const;
  for (const sample of samples) {
    await data.inventory['inventory.addItem']({ ...command(), ...sample });
  }

  // Yesterday's shopping, so the shop shows on what is at home.
  const yesterday = at(1);
  const fresh = [
    { name: 'Emmentaler', quantity: 250, unit: 'g' as const, priceRappen: 480 },
    { name: 'Butter', quantity: 250, unit: 'g' as const, priceRappen: 345 },
    { name: 'Eier', quantity: 6, unit: 'pcs' as const, priceRappen: 420 },
    { name: 'Äpfel', quantity: 6, unit: 'pcs' as const, priceRappen: 390 },
  ].map((line) => ({
    ...line,
    kind: 'item' as const,
    discountRappen: 0,
    isFood: true,
    location: 'fridge' as const,
  }));
  await yesterday.handlers['receipts.import']({
    ...command(),
    retailer: 'coop',
    purchasedAt: yesterday.clock.now(),
    totalRappen: fresh.reduce((sum, line) => sum + line.priceRappen, 0),
    source: 'pdf',
    hash: hashOf(WEEKS),
    lines: fresh,
  });

  // Two packs of cheese slices, three slices gone: the ring shows the opened pack (ADR-0066).
  const slices = await at(4).handlers['inventory.addItem']({
    ...command(),
    name: 'Schmelzkäse',
    location: 'fridge',
    quantity: 20,
    unit: 'pcs',
    piecesPerPack: 10,
    priceRappen: 590,
  });
  await at(2).handlers['inventory.recordOutcome']({
    ...command(),
    itemId: slices.itemId,
    outcome: 'eaten',
    quantity: 3,
  });

  // Places, who owns what, a minimum stock and a short list.
  const stock = (await data.inventory['inventory.list']({ householdId })).items;
  const find = (name: string) => stock.find((item) => item.name === name);
  const places = [
    { name: 'Gemüsefach', location: 'fridge', holds: ['Blattspinat', 'Äpfel'] },
    { name: 'Türe', location: 'fridge', holds: ['Vollmilch', 'Butter', 'Eier'] },
    { name: 'Oberer Schrank', location: 'pantry', holds: ['Basmatireis'] },
  ] as const;
  for (const place of places) {
    const { spotId } = await data.inventory['spots.create']({
      ...command(),
      name: place.name,
      location: place.location,
    });
    for (const name of place.holds) {
      const item = find(name);
      if (item !== undefined) {
        await data.inventory['products.setSpot']({
          ...command(),
          productId: item.productId,
          spotId,
        });
      }
    }
  }
  const owned = [
    ['Joghurt', people[0]],
    ['Mozzarella', people[1]],
  ] as const;
  for (const [name, owner] of owned) {
    const item = find(name);
    if (item !== undefined && owner !== undefined) {
      await data.inventory['inventory.updateItem']({ ...command(), itemId: item.id, owner });
    }
  }
  const milk = find('Vollmilch');
  if (milk !== undefined) {
    await data.inventory['products.setMinStock']({
      ...command(),
      productId: milk.productId,
      minStock: 1,
    });
  }
  for (const name of ['Haferflocken', 'Zitronen']) {
    await data.shopping['shopping.addItem']({ ...command(), name });
  }
}
