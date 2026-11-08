import { z } from 'zod';
import { IdSchema } from '../ids';
import { RappenSchema } from '../money';
import { DomainEventSchema } from './events';
import { HouseholdSchema, MemberSchema, type Scope } from '../model/household';
import {
  ReceiptLineKindSchema,
  ReceiptLineSchema,
  ReceiptSchema,
  ReceiptSourceSchema,
} from '../model/receipt';
import {
  InventoryItemSchema,
  NutritionSchema,
  OutcomeEventSchema,
  ProductSchema,
  ProductSourceSchema,
  OutcomeSchema,
  ShoppingListItemSchema,
  ShareRecipientSchema,
  WasteReasonSchema,
} from '../model/inventory';
import {
  CategoryIdSchema,
  ContainerSchema,
  DateKindSchema,
  ExpirySourceSchema,
  GtinSchema,
  IsoDateTimeSchema,
  LocalDateSchema,
  OwnerSchema,
  PackageSizeSchema,
  QuantitySchema,
  RetailerSchema,
  StorageLocationSchema,
  UnitSchema,
} from '../model/primitives';

/**
 * Contract v1 (ADR-0005): every action of rettich as a named command or query with Zod schemas
 * for input and output. The PWA calls exactly these. The same schemas later generate the REST
 * API (OpenAPI) and the MCP tools for AI assistants, and define the scopes a partner needs.
 */
export interface Operation<TInput extends z.ZodType, TOutput extends z.ZodType> {
  name: string;
  kind: 'command' | 'query';
  /** Short description; `en` doubles as MCP tool description. */
  summary: { de: string; en: string };
  /** Rights an external client needs (plan section 2, `Grant.scopes`). */
  scopes: readonly Scope[];
  input: TInput;
  output: TOutput;
}

/** One reviewed receipt line (ADR-0028); `location` puts an item into the inventory. */
const ReceiptImportLineSchema = z.object({
  name: z.string().trim().min(1).max(120),
  kind: ReceiptLineKindSchema.extract(['item', 'discount', 'deposit', 'bag']),
  quantity: QuantitySchema,
  unit: UnitSchema.extract(['pcs', 'g']),
  unitPriceRappen: RappenSchema.optional(),
  priceRappen: RappenSchema,
  discountRappen: RappenSchema.max(0),
  isFood: z.boolean(),
  location: StorageLocationSchema.optional(),
  /** Confirmed product from the open database or the household (receipts.matchLine). */
  gtin: GtinSchema.optional(),
  /** Name of that product for the inventory; the receipt line keeps the printed name. */
  productName: z.string().trim().min(1).max(120).optional(),
});

const ReceiptMatchSchema = z.object({
  gtin: GtinSchema,
  name: z.string().min(1).max(120),
  brand: z.string().max(80).optional(),
  packSize: z.string().max(30).optional(),
  /**
   * `household`: learned from an earlier receipt; `catalog`: the catalog shipped with the app,
   * found on the device (ADR-0045); `off`: Open Food Facts over the network.
   */
  source: z.enum(['household', 'catalog', 'off']),
  confidence: z.enum(['sure', 'maybe']),
});

/** What a report shows (ADR-0030), as computed by `buildReport`. */
const ReportItemSchema = z.object({
  name: z.string(),
  categoryId: z.string(),
  location: StorageLocationSchema,
  quantity: QuantitySchema,
  unit: UnitSchema,
  expiresOn: LocalDateSchema,
  /** «zu verbrauchen bis» or «mindestens haltbar bis», so a report can say «Nicht mehr verwenden». */
  expiryKind: DateKindSchema.optional(),
  valueRappen: RappenSchema,
  valueEstimated: z.boolean(),
});
const ReportSchema = z.object({
  today: LocalDateSchema,
  from: LocalDateSchema,
  to: LocalDateSchema,
  fridge: z.object({
    itemCount: z.int().min(0),
    valueRappen: RappenSchema,
    valueEstimated: z.boolean(),
    byLocation: z.array(
      z.object({
        location: StorageLocationSchema,
        itemCount: z.int().min(0),
        valueRappen: RappenSchema,
      }),
    ),
    urgent: z.array(ReportItemSchema.extend({ daysLeft: z.int() })),
    items: z.array(ReportItemSchema),
  }),
  impact: z.object({
    savedRappen: RappenSchema,
    wastedRappen: RappenSchema,
    savedGrams: z.number().min(0),
    savedCount: z.int().min(0),
    wastedCount: z.int().min(0),
    wastedGrams: z.number().min(0),
    estimated: z.boolean(),
    savedShare: z.number().min(0).max(1).nullable(),
    sharedRappen: RappenSchema,
    sharedCount: z.int().min(0),
    wastedItems: z.array(
      z.object({
        name: z.string(),
        categoryId: z.string(),
        on: LocalDateSchema,
        valueRappen: RappenSchema,
        grams: z.number().min(0).optional(),
        reason: WasteReasonSchema.optional(),
      }),
    ),
    months: z.array(
      z.object({ month: z.string(), savedRappen: RappenSchema, wastedRappen: RappenSchema }),
    ),
    topWasted: z.array(
      z.object({ categoryId: z.string(), count: z.int().min(0), valueRappen: RappenSchema }),
    ),
    reasons: z.array(z.object({ reason: WasteReasonSchema, count: z.int().min(0) })),
  }),
  shopping: z.object({
    receiptCount: z.int().min(0),
    spentRappen: RappenSchema,
    byRetailer: z.array(
      z.object({
        retailer: RetailerSchema,
        receiptCount: z.int().min(0),
        spentRappen: RappenSchema,
      }),
    ),
  }),
});

/** A price paid, per piece, kilogram or litre (ADR-0029). */
const PricedObservationSchema = z.object({
  retailer: RetailerSchema,
  storeName: z.string().optional(),
  purchasedOn: LocalDateSchema,
  quantity: QuantitySchema,
  unit: UnitSchema,
  paidRappen: RappenSchema,
  promotion: z.boolean(),
  unitPriceRappen: RappenSchema,
});

/** «Nach dem Öffnen innert N Tagen» from the label; overrides the category value. */
const AfterOpeningDaysSchema = z.int().min(0).max(3650);

/** Every command carries a client-generated id: offline outbox and API calls are idempotent. */
const commandBase = { commandId: IdSchema, householdId: IdSchema };
const queryBase = { householdId: IdSchema };

function command<TInput extends z.ZodType, TOutput extends z.ZodType>(
  operation: Omit<Operation<TInput, TOutput>, 'kind'>,
): Operation<TInput, TOutput> {
  return { ...operation, kind: 'command' };
}

function query<TInput extends z.ZodType, TOutput extends z.ZodType>(
  operation: Omit<Operation<TInput, TOutput>, 'kind'>,
): Operation<TInput, TOutput> {
  return { ...operation, kind: 'query' };
}

/** An inventory item as shown to people and external clients (denormalised, no sync fields). */
export const InventoryItemViewSchema = z.object({
  id: IdSchema,
  /** Packs of the same product share it, e.g. two yoghurts with different dates. */
  productId: IdSchema,
  name: z.string(),
  emoji: z.string().optional(),
  categoryId: CategoryIdSchema,
  location: StorageLocationSchema,
  quantity: QuantitySchema,
  unit: UnitSchema,
  expiresOn: LocalDateSchema,
  expiryKind: DateKindSchema,
  expirySource: ExpirySourceSchema,
  owner: OwnerSchema,
  priceRappen: RappenSchema.min(0).optional(),
  container: ContainerSchema.optional(),
  packageSize: PackageSizeSchema.optional(),
  /** Set once the pack is open; the expiry date then follows the opening rule. */
  openedOn: LocalDateSchema.optional(),
  /** When it came home, e.g. for «Gerettet» only on food that kept longer (ADR-0039). */
  purchasedAt: IsoDateTimeSchema,
  /** Product facts, e.g. from Open Food Facts after a scan (step 10b, ODbL). */
  brand: z.string().optional(),
  packSize: z.string().optional(),
  nutrition: NutritionSchema.optional(),
  nutriScore: z.enum(['a', 'b', 'c', 'd', 'e']).optional(),
  allergens: z.array(z.string()).optional(),
  /** Where the product facts come from, for the attribution. */
  productSource: ProductSourceSchema.optional(),
  /** Barcode of the product, e.g. to ask for its picture (`products.image`). */
  gtin: GtinSchema.optional(),
});
export type InventoryItemView = z.infer<typeof InventoryItemViewSchema>;

/** A product found for a barcode: from the household's own products or an open database. */
export const ProductLookupSchema = z.object({
  name: z.string(),
  brand: z.string().optional(),
  /** Pack size as printed, e.g. «1 l», «500 g». */
  packSize: z.string().optional(),
  categoryId: CategoryIdSchema,
  nutrition: NutritionSchema.optional(),
  nutriScore: z.enum(['a', 'b', 'c', 'd', 'e']).optional(),
  allergens: z.array(z.string()).optional(),
  /** `household`: known from an earlier item; `off`: Open Food Facts (ODbL, attribution). */
  source: z.enum(['household', 'off', 'openfoodrepo', 'partner']),
  /** Where brand and nutrition originally came from, also for household products (ODbL). */
  factsFrom: z.enum(['off']).optional(),
});
export type ProductLookup = z.infer<typeof ProductLookupSchema>;

/** A product the household adds often, with what went in the last time («Schnell erfassen»). */
export const FrequentProductSchema = z.object({
  name: z.string(),
  emoji: z.string().optional(),
  categoryId: CategoryIdSchema,
  gtin: GtinSchema.optional(),
  timesAdded: z.int().min(1),
  location: StorageLocationSchema,
  quantity: QuantitySchema,
  unit: UnitSchema,
  container: ContainerSchema.optional(),
  packageSize: PackageSizeSchema.optional(),
});
export type FrequentProduct = z.infer<typeof FrequentProductSchema>;

/** A category thrown away at least twice lately, with a tip (ADR-0038). */
export const WasteHabitSchema = z.object({
  categoryId: CategoryIdSchema,
  times: z.int().min(1),
  names: z.array(z.string()),
  lastOn: LocalDateSchema,
  tip: z.string().optional(),
});

export const ExpiryStatusSchema = z.discriminatedUnion('kind', [
  z.object({ kind: z.literal('fresh'), daysLeft: z.int() }),
  z.object({ kind: z.literal('soon'), daysLeft: z.int() }),
  z.object({ kind: z.literal('today') }),
  z.object({ kind: z.literal('past_best_before'), daysOver: z.int() }),
  z.object({ kind: z.literal('past_use_by'), daysOver: z.int() }),
]);

/** The soonest-expiring food of the same kind at home, and how many such items there are. */
export const AtHomeSchema = z.object({
  name: z.string(),
  quantity: QuantitySchema,
  unit: UnitSchema,
  expiresOn: LocalDateSchema,
  count: z.int().min(1),
});

/**
 * Everything of one household as a file (ADR-0020): what `household.export` hands out and
 * `household.import` takes back. «fridgeai-export» stays the technical format name (ADR-0032).
 */
export const HouseholdExportSchema = z.object({
  format: z.literal('fridgeai-export'),
  contractVersion: z.literal('v1'),
  exportedAt: IsoDateTimeSchema,
  household: HouseholdSchema,
  members: z.array(MemberSchema),
  products: z.array(ProductSchema),
  items: z.array(InventoryItemSchema),
  outcomes: z.array(OutcomeEventSchema),
  shoppingItems: z.array(ShoppingListItemSchema),
  receipts: z.array(ReceiptSchema),
  receiptLines: z.array(ReceiptLineSchema),
  events: z.array(DomainEventSchema),
});
export type HouseholdExport = z.infer<typeof HouseholdExportSchema>;

/** An import needs someone to act as, and nothing in it may belong to another household. */
const ImportableExportSchema = HouseholdExportSchema.superRefine((data, check) => {
  if (data.members.length === 0) {
    check.addIssue({ code: 'custom', path: ['members'], message: 'No member to act as' });
  }
  const id = data.household.id;
  const tables = [
    'members',
    'products',
    'items',
    'outcomes',
    'shoppingItems',
    'receipts',
    'receiptLines',
    'events',
  ] as const;
  for (const table of tables) {
    data[table].forEach((row, index) => {
      if (row.householdId !== id) {
        check.addIssue({
          code: 'custom',
          path: [table, index, 'householdId'],
          message: 'Row of another household',
        });
      }
    });
  }
});

export const CONTRACT_V1 = {
  'inventory.list': query({
    name: 'inventory.list',
    summary: {
      de: 'Vorrat eines Haushalts auflisten, optional nach Lagerort.',
      en: 'List the food a household has, optionally by storage location.',
    },
    scopes: ['inventory:read'],
    input: z.object({ ...queryBase, location: StorageLocationSchema.optional() }),
    output: z.object({ items: z.array(InventoryItemViewSchema) }),
  }),
  'inventory.listExpiring': query({
    name: 'inventory.listExpiring',
    summary: {
      de: 'Was bald abläuft und zuerst verwertet werden sollte.',
      en: 'Food that expires soon and should be eaten first.',
    },
    scopes: ['inventory:read'],
    input: z.object({
      ...queryBase,
      withinDays: z.int().min(0).max(3650).default(3),
      includeReserve: z.boolean().default(false),
    }),
    output: z.object({
      items: z.array(InventoryItemViewSchema.extend({ status: ExpiryStatusSchema })),
    }),
  }),
  'inventory.addItem': command({
    name: 'inventory.addItem',
    summary: {
      de: 'Lebensmittel in den Vorrat legen.',
      en: 'Add a food item to the inventory.',
    },
    scopes: ['inventory:write'],
    input: z.object({
      ...commandBase,
      name: z.string().trim().min(1).max(120),
      categoryId: CategoryIdSchema.optional(),
      gtin: GtinSchema.optional(),
      location: StorageLocationSchema,
      quantity: QuantitySchema.default(1),
      unit: UnitSchema.default('pcs'),
      /** For pieces: «2 Becher à 180 g». */
      container: ContainerSchema.optional(),
      packageSize: PackageSizeSchema.optional(),
      expiresOn: LocalDateSchema.optional(),
      expiryKind: DateKindSchema.optional(),
      expirySource: ExpirySourceSchema.optional(),
      priceRappen: RappenSchema.min(0).optional(),
      owner: OwnerSchema.default('shared'),
      afterOpeningDays: AfterOpeningDaysSchema.optional(),
      /** For packs that are already open when added (the opening rule applies from that day). */
      openedOn: LocalDateSchema.optional(),
    }),
    output: z.object({ itemId: IdSchema, expiresOn: LocalDateSchema }),
  }),
  'inventory.updateItem': command({
    name: 'inventory.updateItem',
    summary: {
      de: 'Name, Kategorie, Lagerort, Datum, Datumsart, Menge oder Preis eines Artikels korrigieren.',
      en: 'Correct the name, category, place, date, date kind, quantity or price of an item.',
    },
    scopes: ['inventory:write'],
    input: z
      .object({
        ...commandBase,
        itemId: IdSchema,
        /** Typo or wrong product: re-links to a known product of that name, else corrects it. */
        name: z.string().trim().min(1).max(120).optional(),
        categoryId: CategoryIdSchema.optional(),
        /** Where it really is; unlike `inventory.move`, the date stays (it was a mistake). */
        location: StorageLocationSchema.optional(),
        /** A date set by hand counts as `manual`, whatever the source was before. */
        expiresOn: LocalDateSchema.optional(),
        expiryKind: DateKindSchema.optional(),
        /** What is left now, in the item's unit. */
        quantity: QuantitySchema.optional(),
        /** Value of what is left; null removes a wrong price (then estimates apply). */
        priceRappen: RappenSchema.min(0).nullable().optional(),
      })
      .refine(
        (input) =>
          [
            input.name,
            input.categoryId,
            input.location,
            input.expiresOn,
            input.expiryKind,
            input.quantity,
            input.priceRappen,
          ].some((value) => value !== undefined),
        { message: 'Nothing to change' },
      ),
    output: z.object({
      changed: z.array(
        z.enum([
          'name',
          'categoryId',
          'location',
          'expiresOn',
          'expiryKind',
          'quantity',
          'priceRappen',
        ]),
      ),
    }),
  }),
  'inventory.deleteItem': command({
    name: 'inventory.deleteItem',
    summary: {
      de: 'Falsch erfassten Artikel löschen; zählt nicht als entsorgt.',
      en: 'Delete an item entered by mistake; it does not count as wasted.',
    },
    scopes: ['inventory:write'],
    input: z.object({ ...commandBase, itemId: IdSchema }),
    output: z.object({ itemId: IdSchema }),
  }),
  'inventory.recategorize': command({
    name: 'inventory.recategorize',
    summary: {
      de: 'Artikel aus «Sonstiges» neu einordnen, wenn die Erkennung sie inzwischen kennt.',
      en: 'Sort items out of «Sonstiges» once the recognition knows them.',
    },
    scopes: ['inventory:write'],
    input: z.object({ ...commandBase }),
    output: z.object({ itemIds: z.array(IdSchema) }),
  }),
  'inventory.restoreItem': command({
    name: 'inventory.restoreItem',
    summary: {
      de: 'Gelöschten Artikel zurückholen (Rückgängig).',
      en: 'Bring back a deleted item (undo).',
    },
    scopes: ['inventory:write'],
    input: z.object({ ...commandBase, itemId: IdSchema }),
    output: z.object({ itemId: IdSchema }),
  }),
  'inventory.recordOutcome': command({
    name: 'inventory.recordOutcome',
    summary: {
      de: 'Artikel als verwertet, weitergegeben oder entsorgt markieren (ganz oder teilweise).',
      en: 'Mark an item as eaten, shared or wasted, fully or partly.',
    },
    scopes: ['inventory:write'],
    input: z
      .object({
        ...commandBase,
        itemId: IdSchema,
        outcome: OutcomeSchema,
        quantity: QuantitySchema.optional(),
        /** Why it was thrown away (only with `wasted`). */
        wasteReason: WasteReasonSchema.optional(),
        /** Who got it (only with `shared_out`). */
        sharedWith: ShareRecipientSchema.optional(),
        /**
         * «Ohne Rettich im Abfall gelandet» (ADR-0039): counts as rescued only if the item could
         * be rescued (`canBeRescued`), never for wasted food.
         */
        rescued: z.boolean().optional(),
      })
      .refine((input) => input.wasteReason === undefined || input.outcome === 'wasted', {
        message: 'A waste reason only fits wasted food',
      })
      .refine((input) => input.sharedWith === undefined || input.outcome === 'shared_out', {
        message: 'A recipient only fits shared food',
      })
      .refine((input) => input.rescued !== true || input.outcome !== 'wasted', {
        message: 'Thrown away food is not rescued',
      }),
    output: z.object({
      eventId: IdSchema,
      remainingQuantity: z.number().min(0),
      /** Whether it counts as rescued. */
      rescued: z.boolean(),
      /** Value of what was closed, e.g. for «Gerettet: CHF 2.10». */
      valueRappen: RappenSchema.min(0),
      /** No price from a receipt: the value is the category estimate («etwa CHF 1.20»). */
      valueEstimated: z.boolean(),
    }),
  }),
  'inventory.undoOutcome': command({
    name: 'inventory.undoOutcome',
    summary: {
      de: 'Verwertet, Weitergegeben oder Entsorgt rückgängig machen; die Menge kommt zurück.',
      en: 'Undo eaten, shared or wasted; the quantity goes back to the item.',
    },
    scopes: ['inventory:write'],
    input: z.object({ ...commandBase, eventId: IdSchema }),
    output: z.object({ itemId: IdSchema, quantity: z.number().min(0) }),
  }),
  'inventory.changeOutcome': command({
    name: 'inventory.changeOutcome',
    summary: {
      de: 'Einen Eintrag korrigieren: verwertet, weitergegeben oder entsorgt, Grund oder Empfänger. Menge, Wert und Datum bleiben.',
      en: 'Correct an entry: eaten, shared or wasted, reason or recipient. Amount, value and date stay.',
    },
    scopes: ['inventory:write'],
    input: z
      .object({
        ...commandBase,
        eventId: IdSchema,
        outcome: OutcomeSchema,
        wasteReason: WasteReasonSchema.optional(),
        sharedWith: ShareRecipientSchema.optional(),
      })
      .refine((input) => input.wasteReason === undefined || input.outcome === 'wasted', {
        message: 'A waste reason only fits wasted food',
      })
      .refine((input) => input.sharedWith === undefined || input.outcome === 'shared_out', {
        message: 'A recipient only fits shared food',
      }),
    output: z.object({ eventId: IdSchema, outcome: OutcomeSchema }),
  }),
  'inventory.history': query({
    name: 'inventory.history',
    summary: {
      de: 'Verlauf: was verwertet, weitergegeben oder entsorgt wurde, neueste zuerst.',
      en: 'History: what was eaten, shared or wasted, newest first.',
    },
    scopes: ['inventory:read'],
    input: z.object({ ...queryBase, from: LocalDateSchema, to: LocalDateSchema }),
    output: z.object({
      outcomes: z.array(
        z.object({
          eventId: IdSchema,
          itemId: IdSchema,
          name: z.string(),
          outcome: OutcomeSchema,
          quantity: QuantitySchema,
          unit: UnitSchema,
          valueRappen: RappenSchema.min(0),
          valueEstimated: z.boolean(),
          wasteReason: WasteReasonSchema.optional(),
          sharedWith: ShareRecipientSchema.optional(),
          at: IsoDateTimeSchema,
        }),
      ),
    }),
  }),
  'inventory.open': command({
    name: 'inventory.open',
    summary: {
      de: 'Packung als geöffnet markieren; das Ablaufdatum folgt ab jetzt der Öffnungsregel.',
      en: 'Mark a pack as opened; from now on the expiry date follows the after-opening rule.',
    },
    scopes: ['inventory:write'],
    input: z.object({
      ...commandBase,
      itemId: IdSchema,
      afterOpeningDays: AfterOpeningDaysSchema.optional(),
    }),
    output: z.object({ expiresOn: LocalDateSchema, shortened: z.boolean() }),
  }),
  'inventory.move': command({
    name: 'inventory.move',
    summary: {
      de: 'Artikel umlagern, z. B. einfrieren; das Ablaufdatum wird neu geschätzt.',
      en: 'Move an item, e.g. freeze it; the expiry date is re-estimated.',
    },
    scopes: ['inventory:write'],
    input: z.object({ ...commandBase, itemId: IdSchema, to: StorageLocationSchema }),
    output: z.object({ expiresOn: LocalDateSchema }),
  }),
  'products.setNutrition': command({
    name: 'products.setNutrition',
    summary: {
      de: 'Nährwerte eines Produkts setzen, z. B. aus einem Foto der Nährwerttabelle (auf dem Gerät gelesen).',
      en: 'Set the nutrition facts of a product, e.g. read on the device from a photo of the label.',
    },
    scopes: ['inventory:write'],
    input: z.object({
      ...commandBase,
      itemId: IdSchema,
      nutrition: NutritionSchema,
    }),
    output: z.object({ productId: IdSchema }),
  }),
  'products.lookup': query({
    name: 'products.lookup',
    summary: {
      de: 'Produkt zu einem Barcode finden: zuerst im Haushalt, dann in offenen Produktdatenbanken.',
      en: 'Find the product for a barcode: the household first, then open product databases.',
    },
    scopes: ['inventory:read'],
    input: z.object({ ...queryBase, gtin: GtinSchema }),
    output: z.object({ product: ProductLookupSchema.nullable() }),
  }),
  'products.search': query({
    name: 'products.search',
    summary: {
      de: 'Produkt nach Namen suchen («Coop Gipfeli»): zuerst im Haushalt, dann in offenen Produktdatenbanken (Schweiz).',
      en: 'Find a product by name: the household first, then open product databases (Switzerland).',
    },
    scopes: ['inventory:read'],
    input: z.object({
      ...queryBase,
      query: z.string().trim().min(2).max(80),
      limit: z.int().min(1).max(20).default(8),
      /** `household`: only products already used here, no network (live while typing). */
      scope: z.enum(['household', 'all']).default('all'),
    }),
    output: z.object({
      products: z.array(
        z.object({
          /** Missing for products the household typed in without a barcode. */
          gtin: GtinSchema.optional(),
          name: z.string(),
          brand: z.string().optional(),
          /** As printed, e.g. «4 × 45 g». */
          packSize: z.string().optional(),
          categoryId: CategoryIdSchema,
          source: z.enum(['household', 'off']),
        }),
      ),
      /** `unavailable`: offline or too many searches; the household's own products still come. */
      openDatabase: z.enum(['searched', 'unavailable', 'none']),
    }),
  }),
  'products.frequent': query({
    name: 'products.frequent',
    summary: {
      de: 'Die Produkte, die der Haushalt am häufigsten erfasst, mit der zuletzt erfassten Menge (UC-07).',
      en: 'The products the household adds most often, with the amount added last time (UC-07).',
    },
    scopes: ['inventory:read'],
    input: z.object({ ...queryBase, limit: z.int().min(1).max(20).default(8) }),
    output: z.object({ products: z.array(FrequentProductSchema) }),
  }),
  'products.wasteHabits': query({
    name: 'products.wasteHabits',
    summary: {
      de: 'Was der Haushalt in den letzten drei Monaten mehrmals entsorgt hat, mit einem Tipp.',
      en: 'What the household threw away more than once in the last three months, with a tip.',
    },
    scopes: ['stats:read'],
    input: z.object({ ...queryBase }),
    output: z.object({ habits: z.array(WasteHabitSchema) }),
  }),
  'products.image': query({
    name: 'products.image',
    summary: {
      de: 'Packungsbild zu einem Barcode, falls auf dem Gerät vorhanden.',
      en: 'Picture of the pack for a barcode, if the device has one.',
    },
    scopes: ['inventory:read'],
    input: z.object({ ...queryBase, gtin: GtinSchema }),
    output: z.object({
      image: z
        .object({
          /** Small JPEG, PNG or WebP as data URL, so it travels in JSON (API, MCP). */
          dataUrl: z.string().regex(/^data:image\/(?:jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/),
          source: z.enum(['off']),
        })
        .nullable(),
    }),
  }),
  'shopping.list': query({
    name: 'shopping.list',
    summary: { de: 'Einkaufsliste anzeigen.', en: 'Show the shopping list.' },
    scopes: ['shopping_list:read'],
    input: z.object({ ...queryBase, includeChecked: z.boolean().default(false) }),
    output: z.object({
      items: z.array(
        z.object({
          id: IdSchema,
          name: z.string(),
          quantity: QuantitySchema.optional(),
          unit: UnitSchema.optional(),
          checked: z.boolean(),
          categoryId: CategoryIdSchema.optional(),
          emoji: z.string().optional(),
          /** E-02: what of the same kind is still at home, so nothing is bought twice. */
          atHome: AtHomeSchema.optional(),
        }),
      ),
    }),
  }),
  'shopping.addItem': command({
    name: 'shopping.addItem',
    summary: {
      de: 'Etwas auf die Einkaufsliste setzen.',
      en: 'Add something to the shopping list.',
    },
    scopes: ['shopping_list:write'],
    input: z.object({
      ...commandBase,
      name: z.string().trim().min(1).max(80),
      quantity: QuantitySchema.optional(),
      unit: UnitSchema.optional(),
    }),
    output: z.object({
      itemId: IdSchema,
      alreadyAtHome: z.boolean(),
      /** True if the same thing was already on the list (nothing new was added). */
      alreadyOnList: z.boolean().default(false),
      atHome: AtHomeSchema.optional(),
    }),
  }),
  'shopping.check': command({
    name: 'shopping.check',
    summary: {
      de: 'Eintrag auf der Einkaufsliste abhaken oder wieder öffnen.',
      en: 'Check off a shopping list entry or open it again.',
    },
    scopes: ['shopping_list:write'],
    input: z.object({ ...commandBase, itemId: IdSchema, checked: z.boolean() }),
    output: z.object({ checked: z.boolean() }),
  }),
  'shopping.remove': command({
    name: 'shopping.remove',
    summary: {
      de: 'Eintrag von der Einkaufsliste löschen.',
      en: 'Remove an entry from the shopping list.',
    },
    scopes: ['shopping_list:write'],
    input: z.object({ ...commandBase, itemId: IdSchema }),
    output: z.object({ removed: z.boolean() }),
  }),
  'stats.waste': query({
    name: 'stats.waste',
    summary: {
      de: 'Gerettet (kurz vor Ablauf verwertet oder weitergegeben) und entsorgt in CHF, kg und Anzahl für einen Zeitraum.',
      en: 'Food rescued (eaten or shared shortly before expiry) and wasted in CHF, kg and count for a period.',
    },
    scopes: ['stats:read'],
    input: z.object({ ...queryBase, from: LocalDateSchema, to: LocalDateSchema }),
    output: z.object({
      savedRappen: RappenSchema.min(0),
      wastedRappen: RappenSchema.min(0),
      savedGrams: z.int().min(0),
      wastedGrams: z.int().min(0),
      /** Rescued: eaten or shared while at risk (ADR-0033); ordinary eating is not counted. */
      savedCount: z.int().min(0),
      wastedCount: z.int().min(0),
      estimated: z.boolean(),
    }),
  }),
  'prices.memory': query({
    name: 'prices.memory',
    summary: {
      de: 'Preisgedächtnis aus den eigenen Bons: zuletzt bezahlt, üblicher Preis, am günstigsten.',
      en: 'Price memory from own receipts: last paid, usual price, cheapest shop.',
    },
    scopes: ['stats:read'],
    input: z.object({
      ...queryBase,
      /** Product names as on the receipt; matched written the same way (ADR-0029). */
      names: z.array(z.string().trim().min(1).max(120)).min(1).max(100),
    }),
    output: z.object({
      products: z.array(
        z.object({
          name: z.string(),
          count: z.int().min(0),
          last: PricedObservationSchema.optional(),
          usualUnitPriceRappen: RappenSchema.optional(),
          cheapest: PricedObservationSchema.optional(),
        }),
      ),
    }),
  }),
  'reports.build': query({
    name: 'reports.build',
    summary: {
      de: 'Bericht: Kühlschrank jetzt, gerettet und entsorgt pro Monat, Gründe, Einkäufe.',
      en: 'Report: fridge now, saved and wasted per month, reasons, spending per shop.',
    },
    scopes: ['stats:read'],
    input: z
      .object({ ...queryBase, from: LocalDateSchema, to: LocalDateSchema })
      .refine((input) => input.from <= input.to, { message: 'from must not be after to' }),
    output: ReportSchema,
  }),
  'rescue.offer': command({
    name: 'rescue.offer',
    summary: {
      de: 'Artikel im Rette-Kreis den Mitbewohner:innen anbieten.',
      en: 'Offer an item to the other household members before it expires.',
    },
    scopes: ['inventory:write'],
    input: z.object({ ...commandBase, itemId: IdSchema }),
    output: z.object({ offerId: IdSchema }),
  }),
  'receipts.import': command({
    name: 'receipts.import',
    summary: {
      de: 'Einen gelesenen Kassenbon speichern und gewählte Artikel mit Preis in den Vorrat legen.',
      en: 'Store a read receipt and add the chosen items with their price to the inventory.',
    },
    scopes: ['inventory:write'],
    input: z.object({
      ...commandBase,
      retailer: RetailerSchema,
      storeName: z.string().trim().max(80).optional(),
      purchasedAt: IsoDateTimeSchema,
      totalRappen: RappenSchema,
      source: ReceiptSourceSchema,
      /** SHA-256 (hex) of the receipt text: the same receipt is never imported twice. */
      hash: z.string().regex(/^[0-9a-f]{64}$/),
      lines: z.array(ReceiptImportLineSchema).min(1).max(300),
    }),
    output: z.object({ receiptId: IdSchema, itemIds: z.array(IdSchema), duplicate: z.boolean() }),
  }),
  'receipts.matchLine': query({
    name: 'receipts.matchLine',
    summary: {
      de: 'Zu einer Bon-Zeile das Produkt finden: zuerst frühere Bons, dann Open Food Facts.',
      en: 'Find the product for a receipt line: earlier receipts first, then Open Food Facts.',
    },
    scopes: ['inventory:read'],
    /** Only the printed product name; never price, shop, date or quantity. */
    input: z.object({ ...queryBase, name: z.string().trim().min(1).max(120) }),
    output: z.object({
      match: ReceiptMatchSchema.optional(),
      openDatabase: z.enum(['none', 'searched', 'unavailable']),
    }),
  }),
  'household.export': query({
    name: 'household.export',
    summary: {
      de: 'Alle Daten des Haushalts herausgeben (Datenportabilität, ADR-0020).',
      en: 'Hand out all of the household data (data portability, ADR-0020).',
    },
    scopes: ['household:read'],
    input: z.object({ ...queryBase }),
    output: HouseholdExportSchema,
  }),
  'household.import': command({
    name: 'household.import',
    summary: {
      de: 'Einen Export zurückholen; ersetzt alle Daten auf dem Gerät (ADR-0020).',
      en: 'Bring an export back; replaces all data on the device (ADR-0020).',
    },
    scopes: ['household:write'],
    /**
     * `householdId` is the household being replaced. `confirm: true` on purpose: an import
     * replaces everything, like deleting.
     */
    input: z.object({ ...commandBase, data: ImportableExportSchema, confirm: z.literal(true) }),
    output: z.object({
      householdId: IdSchema,
      memberId: IdSchema,
      itemCount: z.int().min(0),
      outcomeCount: z.int().min(0),
    }),
  }),
  'household.delete': command({
    name: 'household.delete',
    summary: {
      de: 'Alle Daten des Haushalts endgültig löschen (ADR-0020).',
      en: 'Delete all of the household data for good (ADR-0020).',
    },
    scopes: ['household:write'],
    /** `confirm: true` on purpose: nothing deletes everything by accident. */
    input: z.object({ ...commandBase, confirm: z.literal(true) }),
    output: z.object({ deleted: z.literal(true) }),
  }),
} as const;

export type ContractV1 = typeof CONTRACT_V1;
export type OperationName = keyof ContractV1;
export type OperationInput<TName extends OperationName> = z.input<ContractV1[TName]['input']>;
export type OperationOutput<TName extends OperationName> = z.output<ContractV1[TName]['output']>;

export const OPERATION_NAMES = Object.keys(CONTRACT_V1) as OperationName[];

/** JSON Schema of every operation: what OpenAPI and MCP tool definitions are built from. */
export function contractJsonSchemas() {
  return OPERATION_NAMES.map((name) => {
    const operation = CONTRACT_V1[name];
    return {
      name,
      kind: operation.kind,
      summary: operation.summary,
      scopes: operation.scopes,
      input: z.toJSONSchema(operation.input, { io: 'input' }),
      output: z.toJSONSchema(operation.output),
    };
  });
}
