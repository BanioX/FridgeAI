import { describe, expect, it } from 'vitest';
import { uuidV7, type Id } from '../src/ids';
import {
  GrantSchema,
  HouseholdSchema,
  InventoryItemSchema,
  isValidGtin,
  LocalDateSchema,
  MemberSchema,
  OutcomeEventSchema,
  ProductSchema,
  ReceiptLineSchema,
  ReceiptSchema,
  ReminderPrefsSchema,
  RescueOfferSchema,
  SettlementSchema,
  ShoppingListItemSchema,
  TimeOfDaySchema,
} from '../src/model';

let counter = 0;
const id = (): Id => {
  counter += 1;
  return uuidV7(1_762_441_200_000 + counter, new Uint8Array(10).fill(counter % 256));
};
const now = '2026-11-06T15:00:00.000Z';
const householdId = id();
const alice = id();
const bob = id();
const sync = () => ({ id: id(), householdId, updatedAt: now });

describe('primitives', () => {
  it('accepts real calendar days only', () => {
    expect(LocalDateSchema.safeParse('2026-02-28').success).toBe(true);
    expect(LocalDateSchema.safeParse('2026-02-30').success).toBe(false);
    expect(LocalDateSchema.safeParse('2026-11-06T00:00:00Z').success).toBe(false);
  });

  it('validates times of day', () => {
    expect(TimeOfDaySchema.safeParse('17:30').success).toBe(true);
    expect(TimeOfDaySchema.safeParse('24:00').success).toBe(false);
    expect(TimeOfDaySchema.safeParse('7:30').success).toBe(false);
  });

  it.each([
    ['7610000000000', false],
    ['4006381333931', true], // EAN-13
    ['96385074', true], // EAN-8
    ['036000291452', true], // UPC-A
    ['4006381333932', false],
    ['12345', false],
    ['abcdefgh', false],
  ])('checks the GTIN check digit of %s', (gtin, valid) => {
    expect(isValidGtin(gtin)).toBe(valid);
  });
});

describe('household and members', () => {
  it('accepts a household and trims its name', () => {
    const parsed = HouseholdSchema.parse({
      id: householdId,
      name: '  WG Langstrasse  ',
      plan: 'free',
      createdAt: now,
      updatedAt: now,
    });
    expect(parsed.name).toBe('WG Langstrasse');
  });

  it('allows local members without an account', () => {
    const member = { ...sync(), displayName: 'Lena', role: 'owner', joinedAt: now };
    expect(MemberSchema.safeParse(member).success).toBe(true);
    expect(MemberSchema.safeParse({ ...member, displayName: ' ' }).success).toBe(false);
  });

  it('rejects duplicate reminder days', () => {
    const prefs = {
      ...sync(),
      memberId: alice,
      digestTime: '17:30',
      daysBefore: [3, 1],
      quietHours: { start: '22:00', end: '07:00' },
      channels: { push: true, inApp: true },
    };
    expect(ReminderPrefsSchema.safeParse(prefs).success).toBe(true);
    expect(ReminderPrefsSchema.safeParse({ ...prefs, daysBefore: [1, 1] }).success).toBe(false);
  });

  it('requires at least one known scope for a grant', () => {
    const grant = {
      ...sync(),
      clientId: 'mcp-claude',
      scopes: ['inventory:read'],
      grantedBy: alice,
      grantedAt: now,
    };
    expect(GrantSchema.safeParse(grant).success).toBe(true);
    expect(GrantSchema.safeParse({ ...grant, scopes: [] }).success).toBe(false);
    expect(GrantSchema.safeParse({ ...grant, scopes: ['admin'] }).success).toBe(false);
  });
});

describe('inventory', () => {
  const item = {
    ...sync(),
    productId: id(),
    location: 'fridge',
    quantity: 1,
    unit: 'pcs',
    purchasedAt: now,
    expiresOn: '2026-11-09',
    expiryKind: 'best_before',
    expirySource: 'category_estimate',
    priceRappen: 195,
    owner: 'shared',
    status: 'active',
  };

  it('accepts an item owned by a member or by everyone', () => {
    expect(InventoryItemSchema.safeParse(item).success).toBe(true);
    expect(InventoryItemSchema.safeParse({ ...item, owner: alice }).success).toBe(true);
    expect(InventoryItemSchema.safeParse({ ...item, owner: 'everyone' }).success).toBe(false);
  });

  it('records where the expiry date came from and which kind it is', () => {
    expect(
      InventoryItemSchema.safeParse({ ...item, expiryKind: 'use_by', expirySource: 'gs1_code' })
        .success,
    ).toBe(true);
    expect(InventoryItemSchema.safeParse({ ...item, expirySource: 'guess' }).success).toBe(false);
    expect(InventoryItemSchema.safeParse({ ...item, expiryKind: 'sell_by' }).success).toBe(false);
  });

  it('rejects impossible quantities, prices and dates', () => {
    expect(InventoryItemSchema.safeParse({ ...item, quantity: 0 }).success).toBe(false);
    expect(InventoryItemSchema.safeParse({ ...item, priceRappen: -5 }).success).toBe(false);
    expect(InventoryItemSchema.safeParse({ ...item, priceRappen: 1.95 }).success).toBe(false);
    expect(InventoryItemSchema.safeParse({ ...item, expiresOn: '9.11.2026' }).success).toBe(false);
  });

  it('validates products and their GTIN', () => {
    const product = {
      ...sync(),
      name: 'Vollmilch',
      categoryId: 'dairy-milk',
      defaultLocation: 'fridge',
      source: 'receipt',
      externalRefs: { migros: '104010000000' },
    };
    expect(ProductSchema.safeParse(product).success).toBe(true);
    expect(ProductSchema.safeParse({ ...product, gtin: '4006381333931' }).success).toBe(true);
    expect(ProductSchema.safeParse({ ...product, gtin: '4006381333932' }).success).toBe(false);
    expect(ProductSchema.safeParse({ ...product, categoryId: 'Milch' }).success).toBe(false);
  });

  it('stores nutrition facts, Nutri-Score and allergens from a scan', () => {
    const product = {
      ...sync(),
      name: 'Vollmilch',
      categoryId: 'dairy-milk',
      defaultLocation: 'fridge',
      source: 'off',
      packSize: '1 l',
      nutrition: {
        basis: '100ml',
        energyKcal: 64,
        fat: 3.5,
        protein: 3.3,
        salt: 0.1,
        source: 'off',
      },
      nutriScore: 'b',
      allergens: ['milk'],
    };
    expect(ProductSchema.safeParse(product).success).toBe(true);
    expect(
      ProductSchema.safeParse({ ...product, nutrition: { ...product.nutrition, fat: 120 } })
        .success,
    ).toBe(false);
    expect(ProductSchema.safeParse({ ...product, nutriScore: 'f' }).success).toBe(false);
    expect(ProductSchema.safeParse({ ...product, allergens: ['Milch!'] }).success).toBe(false);
  });

  it('records outcomes with an owner snapshot', () => {
    const event = {
      ...sync(),
      itemId: id(),
      outcome: 'eaten',
      quantity: 0.5,
      valueRappen: 98,
      valueEstimated: false,
      owner: bob,
      at: now,
      by: alice,
    };
    expect(OutcomeEventSchema.safeParse(event).success).toBe(true);
    expect(OutcomeEventSchema.safeParse({ ...event, outcome: 'lost' }).success).toBe(false);
  });

  it('keeps rescue offers consistent', () => {
    const offer = { ...sync(), itemId: id(), offeredBy: alice, offeredAt: now };
    expect(RescueOfferSchema.safeParse(offer).success).toBe(true);
    expect(RescueOfferSchema.safeParse({ ...offer, claimedBy: bob, claimedAt: now }).success).toBe(
      true,
    );
    expect(RescueOfferSchema.safeParse({ ...offer, claimedBy: bob }).success).toBe(false);
    expect(
      RescueOfferSchema.safeParse({ ...offer, claimedBy: bob, claimedAt: now, withdrawnAt: now })
        .success,
    ).toBe(false);
  });

  it('accepts shopping list items', () => {
    const entry = { ...sync(), name: 'Eier', checked: false, addedBy: alice };
    expect(ShoppingListItemSchema.safeParse(entry).success).toBe(true);
    expect(ShoppingListItemSchema.safeParse({ ...entry, name: '' }).success).toBe(false);
  });
});

describe('receipts', () => {
  it('accepts a receipt and its lines', () => {
    const receipt = {
      ...sync(),
      retailer: 'coop',
      purchasedAt: now,
      totalRappen: 2340,
      source: 'photo',
      hash: 'a'.repeat(64),
      paidBy: alice,
      splitAmong: [alice, bob],
      createdBy: alice,
    };
    expect(ReceiptSchema.safeParse(receipt).success).toBe(true);
    expect(ReceiptSchema.safeParse({ ...receipt, hash: 'xyz' }).success).toBe(false);
    expect(ReceiptSchema.safeParse({ ...receipt, splitAmong: [] }).success).toBe(false);

    const line = {
      ...sync(),
      receiptId: receipt.id,
      position: 0,
      rawText: 'NATURA JOGHURT 180G   0.95',
      name: 'Natura Joghurt',
      kind: 'item',
      isFood: true,
      quantity: 1,
      unit: 'pcs',
      priceRappen: 95,
      discountRappen: -20,
      assignedTo: 'shared',
      includedInInventory: true,
    };
    expect(ReceiptLineSchema.safeParse(line).success).toBe(true);
    expect(ReceiptLineSchema.safeParse({ ...line, discountRappen: 20 }).success).toBe(false);
  });

  it('rejects settlements to oneself or without amount', () => {
    const settlement = {
      ...sync(),
      from: alice,
      to: bob,
      amountRappen: 1240,
      createdAt: now,
      createdBy: alice,
    };
    expect(SettlementSchema.safeParse(settlement).success).toBe(true);
    expect(SettlementSchema.safeParse({ ...settlement, to: alice }).success).toBe(false);
    expect(SettlementSchema.safeParse({ ...settlement, amountRappen: 0 }).success).toBe(false);
  });
});
