import { z } from 'zod';
import { IdSchema } from '../ids';
import { RappenSchema } from '../money';
import { OutcomeSchema, ShareRecipientSchema, WasteReasonSchema } from '../model/inventory';
import {
  DateKindSchema,
  GtinSchema,
  IsoDateTimeSchema,
  LocalDateSchema,
  QuantitySchema,
  RetailerSchema,
  StorageLocationSchema,
} from '../model/primitives';

/**
 * Domain events v1 (ADR-0005). Every change produces one. They drive the dashboards.
 * Event types and payloads are versioned: breaking changes need a new version.
 */
const envelope = <TType extends string, TPayload extends z.ZodType>(
  type: TType,
  payload: TPayload,
) =>
  z.object({
    id: IdSchema,
    type: z.literal(type),
    version: z.literal(1),
    householdId: IdSchema,
    /** Member who caused it, or `system` (scheduler, import, sync). */
    actor: z.union([IdSchema, z.literal('system')]),
    at: IsoDateTimeSchema,
    payload,
  });

export const DomainEventSchema = z.discriminatedUnion('type', [
  envelope(
    'item.added',
    z.object({
      itemId: IdSchema,
      productId: IdSchema,
      location: StorageLocationSchema,
      expiresOn: LocalDateSchema,
    }),
  ),
  envelope('item.updated', z.object({ itemId: IdSchema, fields: z.array(z.string()).min(1) })),
  envelope('item.deleted', z.object({ itemId: IdSchema })),
  envelope('item.restored', z.object({ itemId: IdSchema })),
  envelope(
    'item.moved',
    z.object({
      itemId: IdSchema,
      from: StorageLocationSchema,
      to: StorageLocationSchema,
      expiresOn: LocalDateSchema,
      /** The date before the move, so «Vorausschauend» knows it was not yet past (ADR-0054). */
      previousExpiresOn: LocalDateSchema.optional(),
    }),
  ),
  envelope(
    'item.expiring_soon',
    z.object({
      itemId: IdSchema,
      expiresOn: LocalDateSchema,
      daysLeft: z.int(),
      kind: DateKindSchema,
    }),
  ),
  envelope(
    'item.consumed',
    z.object({
      itemId: IdSchema,
      outcome: OutcomeSchema,
      quantity: QuantitySchema,
      valueRappen: RappenSchema.min(0),
      wasteReason: WasteReasonSchema.optional(),
      sharedWith: ShareRecipientSchema.optional(),
    }),
  ),
  envelope(
    'outcome.undone',
    z.object({
      eventId: IdSchema,
      itemId: IdSchema,
      outcome: OutcomeSchema,
      quantity: QuantitySchema,
    }),
  ),
  envelope(
    'outcome.changed',
    z.object({
      eventId: IdSchema,
      itemId: IdSchema,
      from: OutcomeSchema,
      to: OutcomeSchema,
      wasteReason: WasteReasonSchema.optional(),
      sharedWith: ShareRecipientSchema.optional(),
    }),
  ),
  envelope(
    'item.opened',
    z.object({
      itemId: IdSchema,
      openedOn: LocalDateSchema,
      expiresOn: LocalDateSchema,
      shortened: z.boolean(),
    }),
  ),
  envelope('product.nutrition_set', z.object({ productId: IdSchema, itemId: IdSchema })),
  envelope(
    'item.used_up',
    z.object({ itemId: IdSchema, productId: IdSchema, gtin: GtinSchema.optional() }),
  ),
  envelope('shopping_list.item_added', z.object({ shoppingItemId: IdSchema, name: z.string() })),
  envelope('shopping_list.item_checked', z.object({ shoppingItemId: IdSchema })),
  envelope('shopping_list.item_unchecked', z.object({ shoppingItemId: IdSchema })),
  envelope('shopping_list.item_removed', z.object({ shoppingItemId: IdSchema })),
  envelope(
    'receipt.imported',
    z.object({
      receiptId: IdSchema,
      retailer: RetailerSchema,
      lineCount: z.int().min(0),
      totalRappen: RappenSchema,
    }),
  ),
  envelope(
    'item.processed',
    z.object({
      /** The items that went in; may be empty for «Reste erfassen». */
      ingredientIds: z.array(IdSchema).max(50),
      /** The new item; none when nothing was left («Gekocht, nichts übrig»). */
      resultId: IdSchema.optional(),
      /** The recipe it was started from, if any. */
      recipeId: z.string().min(1).max(80).optional(),
      /** `made` = selbst gemacht, `leftover` = Reste, `cooked` = gekocht, nichts übrig. */
      kind: z.enum(['made', 'leftover', 'cooked']),
    }),
  ),
  envelope(
    'check.completed',
    /** A «Kühlschrank-Check» was walked through to the end (ADR-0054): for «Treu». */
    z.object({ itemCount: z.int().min(1).max(500) }),
  ),
  envelope('recipe.created', z.object({ recipeId: IdSchema })),
  envelope('recipe.updated', z.object({ recipeId: IdSchema })),
  envelope('recipe.deleted', z.object({ recipeId: IdSchema })),
  envelope('spot.created', z.object({ spotId: IdSchema, location: StorageLocationSchema })),
  envelope('spot.updated', z.object({ spotId: IdSchema, fields: z.array(z.string()).min(1) })),
  envelope('spot.deleted', z.object({ spotId: IdSchema, productCount: z.int().min(0) })),
  envelope(
    'product.min_stock_set',
    z.object({ productId: IdSchema, minStock: z.int().min(1).max(20).nullable() }),
  ),
  envelope('product.spot_set', z.object({ productId: IdSchema, spotId: IdSchema.nullable() })),
  envelope(
    'household.imported',
    z.object({
      exportedAt: IsoDateTimeSchema,
      itemCount: z.int().min(0),
      outcomeCount: z.int().min(0),
    }),
  ),
  envelope('member.added', z.object({ memberId: IdSchema })),
  envelope('member.renamed', z.object({ memberId: IdSchema })),
  envelope(
    'member.removed',
    /** `itemsShared`: how many items became «Allen» (ADR-0058). */
    z.object({ memberId: IdSchema, itemsShared: z.int().min(0) }),
  ),
  envelope('rescue.offered', z.object({ offerId: IdSchema, itemId: IdSchema })),
  envelope(
    'rescue.claimed',
    z.object({ offerId: IdSchema, itemId: IdSchema, claimedBy: IdSchema }),
  ),
]);
export type DomainEvent = z.infer<typeof DomainEventSchema>;
export type DomainEventType = DomainEvent['type'];
