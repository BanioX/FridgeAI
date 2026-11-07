import { z } from 'zod';
import { IdSchema } from '../ids';
import { RappenSchema } from '../money';
import { DomainEventSchema } from './events';
import { RecipeTagSchema } from '../recipes/recipe';
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
 * Contract v1 (ADR-0005): every action of Rettich as a named command or query with Zod schemas
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
});

/** What a report shows (ADR-0030), as computed by `buildReport`. */
const ReportItemSchema = z.object({
  name: z.string(),
  categoryId: z.string(),
  location: StorageLocationSchema,
  quantity: QuantitySchema,
  unit: UnitSchema,
  expiresOn: LocalDateSchema,
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
    wastedGrams: z.number().min(0),
    estimated: z.boolean(),
    savedShare: z.number().min(0).max(1).nullable(),
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
      de: 'Was bald abläuft und zuerst gegessen werden sollte.',
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
      de: 'Falsch erfassten Artikel löschen; zählt nicht als weggeworfen.',
      en: 'Delete an item entered by mistake; it does not count as wasted.',
    },
    scopes: ['inventory:write'],
    input: z.object({ ...commandBase, itemId: IdSchema }),
    output: z.object({ itemId: IdSchema }),
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
      de: 'Artikel als gegessen, weitergegeben oder weggeworfen markieren (ganz oder teilweise).',
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
      })
      .refine((input) => input.wasteReason === undefined || input.outcome === 'wasted', {
        message: 'A waste reason only fits wasted food',
      })
      .refine((input) => input.sharedWith === undefined || input.outcome === 'shared_out', {
        message: 'A recipient only fits shared food',
      }),
    output: z.object({ eventId: IdSchema, remainingQuantity: z.number().min(0) }),
  }),
  'inventory.undoOutcome': command({
    name: 'inventory.undoOutcome',
    summary: {
      de: 'Gegessen, Weitergegeben oder Weggeworfen rückgängig machen; die Menge kommt zurück.',
      en: 'Undo eaten, shared or wasted; the quantity goes back to the item.',
    },
    scopes: ['inventory:write'],
    input: z.object({ ...commandBase, eventId: IdSchema }),
    output: z.object({ itemId: IdSchema, quantity: z.number().min(0) }),
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
  'recipes.suggest': query({
    name: 'recipes.suggest',
    summary: {
      de: 'Rezepte, die möglichst viele bald ablaufende Lebensmittel verwenden.',
      en: 'Recipes that use as much soon-expiring food as possible.',
    },
    scopes: ['recipes:read'],
    input: z.object({ ...queryBase, limit: z.int().min(1).max(10).default(3) }),
    output: z.object({
      recipes: z.array(
        z.object({
          id: z.string(),
          title: z.string(),
          minutes: z.int().positive(),
          usesExpiring: z.array(z.string()),
          missing: z.array(z.string()),
        }),
      ),
    }),
  }),
  'recipes.list': query({
    name: 'recipes.list',
    summary: {
      de: 'Alle Rezepte, zuerst die, für die am wenigsten fehlt; optional mit einem Merkmal.',
      en: 'All recipes, those with the fewest missing ingredients first; optionally with one tag.',
    },
    scopes: ['recipes:read'],
    input: z.object({ ...queryBase, tag: RecipeTagSchema.optional() }),
    output: z.object({
      recipes: z.array(
        z.object({
          id: z.string(),
          title: z.string(),
          minutes: z.int().positive(),
          tags: z.array(RecipeTagSchema),
          usesExpiring: z.array(z.string()),
          missing: z.array(z.string()),
        }),
      ),
    }),
  }),
  'recipes.get': query({
    name: 'recipes.get',
    summary: {
      de: 'Ein Rezept mit Zutaten und Schritten; pro Zutat, was davon schon zu Hause ist.',
      en: 'One recipe with ingredients and steps; for each ingredient, what is already at home.',
    },
    scopes: ['recipes:read'],
    input: z.object({ ...queryBase, recipeId: z.string().min(1).max(64) }),
    output: z.object({
      recipe: z
        .object({
          id: z.string(),
          title: z.string(),
          minutes: z.int().positive(),
          servings: z.int().positive(),
          tags: z.array(z.string()),
          ingredients: z.array(
            z.object({
              text: z.string(),
              staple: z.boolean(),
              optional: z.boolean(),
              /** Food at home that counts as this ingredient, e.g. to book it after cooking. */
              atHome: z.array(
                z.object({
                  itemId: IdSchema,
                  name: z.string(),
                  quantity: QuantitySchema,
                  unit: UnitSchema,
                  expiresOn: LocalDateSchema,
                  expiryKind: DateKindSchema,
                }),
              ),
            }),
          ),
          steps: z.array(z.string()),
        })
        .nullable(),
    }),
  }),
  'stats.waste': query({
    name: 'stats.waste',
    summary: {
      de: 'Gerettet und weggeworfen in CHF und kg für einen Zeitraum.',
      en: 'Food saved and wasted in CHF and kg for a period.',
    },
    scopes: ['stats:read'],
    input: z.object({ ...queryBase, from: LocalDateSchema, to: LocalDateSchema }),
    output: z.object({
      savedRappen: RappenSchema.min(0),
      wastedRappen: RappenSchema.min(0),
      savedGrams: z.int().min(0),
      wastedGrams: z.int().min(0),
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
      de: 'Bericht: Kühlschrank jetzt, gerettet und weggeworfen pro Monat, Gründe, Einkäufe.',
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
  'household.export': query({
    name: 'household.export',
    summary: {
      de: 'Alle Daten des Haushalts herausgeben (Datenportabilität, ADR-0020).',
      en: 'Hand out all of the household data (data portability, ADR-0020).',
    },
    scopes: ['household:read'],
    input: z.object({ ...queryBase }),
    output: z.object({
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
