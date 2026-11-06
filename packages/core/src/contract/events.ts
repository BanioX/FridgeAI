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
 * Domain events v1 (ADR-0005). Every change produces one. In the MVP they drive push
 * notifications and dashboards; later they become webhooks for partners (e.g. `item.used_up` →
 * rebuy offer). Event types and payloads are versioned: breaking changes need a new version.
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
  envelope(
    'item.moved',
    z.object({
      itemId: IdSchema,
      from: StorageLocationSchema,
      to: StorageLocationSchema,
      expiresOn: LocalDateSchema,
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
    'item.opened',
    z.object({
      itemId: IdSchema,
      openedOn: LocalDateSchema,
      expiresOn: LocalDateSchema,
      shortened: z.boolean(),
    }),
  ),
  envelope(
    'item.used_up',
    z.object({ itemId: IdSchema, productId: IdSchema, gtin: GtinSchema.optional() }),
  ),
  envelope('shopping_list.item_added', z.object({ shoppingItemId: IdSchema, name: z.string() })),
  envelope('shopping_list.item_checked', z.object({ shoppingItemId: IdSchema })),
  envelope(
    'receipt.imported',
    z.object({
      receiptId: IdSchema,
      retailer: RetailerSchema,
      lineCount: z.int().min(0),
      totalRappen: RappenSchema,
    }),
  ),
  envelope('rescue.offered', z.object({ offerId: IdSchema, itemId: IdSchema })),
  envelope(
    'rescue.claimed',
    z.object({ offerId: IdSchema, itemId: IdSchema, claimedBy: IdSchema }),
  ),
]);
export type DomainEvent = z.infer<typeof DomainEventSchema>;
export type DomainEventType = DomainEvent['type'];
