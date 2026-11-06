import { z } from 'zod';
import { IdSchema } from '../ids';
import { RappenSchema } from '../money';
import { DomainEventSchema } from './events';
import { HouseholdSchema, MemberSchema, type Scope } from '../model/household';
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
  StorageLocationSchema,
  UnitSchema,
} from '../model/primitives';

/**
 * Contract v1 (ADR-0005): every action of FridgeAI as a named command or query with Zod schemas
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
      de: 'Datum, Datumsart, Menge oder Preis eines Artikels korrigieren.',
      en: 'Correct the date, date kind, quantity or price of an item.',
    },
    scopes: ['inventory:write'],
    input: z
      .object({
        ...commandBase,
        itemId: IdSchema,
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
          input.expiresOn !== undefined ||
          input.expiryKind !== undefined ||
          input.quantity !== undefined ||
          input.priceRappen !== undefined,
        { message: 'Nothing to change' },
      ),
    output: z.object({
      changed: z.array(z.enum(['expiresOn', 'expiryKind', 'quantity', 'priceRappen'])),
    }),
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
