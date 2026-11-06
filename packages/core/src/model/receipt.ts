import { z } from 'zod';
import { IdSchema } from '../ids';
import { RappenSchema } from '../money';
import {
  CategoryIdSchema,
  IsoDateTimeSchema,
  OwnerSchema,
  QuantitySchema,
  RetailerSchema,
  syncFields,
  UnitSchema,
} from './primitives';

export const ReceiptSourceSchema = z.enum(['photo', 'csv', 'pdf']);

export const ReceiptSchema = z.object({
  ...syncFields,
  retailer: RetailerSchema,
  /** Generic store label (e.g. «Migros Zürich»), never a loyalty card number. */
  storeName: z.string().trim().max(80).optional(),
  purchasedAt: IsoDateTimeSchema,
  totalRappen: RappenSchema,
  source: ReceiptSourceSchema,
  /** SHA-256 (hex) of the normalised receipt content, to skip duplicate imports. */
  hash: z.string().regex(/^[0-9a-f]{64}$/),
  paidBy: IdSchema.optional(),
  /** Members sharing «geteilt» lines, snapshotted when the receipt is saved. */
  splitAmong: z.array(IdSchema).min(1).optional(),
  createdBy: IdSchema,
});
export type Receipt = z.infer<typeof ReceiptSchema>;

export const ReceiptLineKindSchema = z.enum([
  'item',
  'discount',
  'deposit',
  'bag',
  'subtotal',
  'total',
  'payment',
  'other',
]);
export type ReceiptLineKind = z.infer<typeof ReceiptLineKindSchema>;

export const ReceiptLineSchema = z.object({
  ...syncFields,
  receiptId: IdSchema,
  position: z.int().min(0),
  rawText: z.string().max(200),
  name: z.string().trim().max(120),
  kind: ReceiptLineKindSchema,
  isFood: z.boolean(),
  quantity: QuantitySchema,
  unit: UnitSchema,
  unitPriceRappen: RappenSchema.optional(),
  weightGrams: z.int().positive().optional(),
  /** Amount printed on the line (gross, before discounts). Negative for discount lines. */
  priceRappen: RappenSchema,
  /** Sum of discounts folded into this line (≤ 0). */
  discountRappen: RappenSchema.max(0),
  /** For discount lines: the item line they reduce; absent for receipt-wide discounts. */
  appliesToLineId: IdSchema.optional(),
  productId: IdSchema.optional(),
  categoryId: CategoryIdSchema.optional(),
  assignedTo: OwnerSchema,
  /** Whether the line was taken into the inventory during review. */
  includedInInventory: z.boolean(),
});
export type ReceiptLine = z.infer<typeof ReceiptLineSchema>;

/** «Ausgleich erfasst»: money paid from one member to another. Balances subtract these. */
export const SettlementSchema = z
  .object({
    ...syncFields,
    from: IdSchema,
    to: IdSchema,
    amountRappen: RappenSchema.positive(),
    createdAt: IsoDateTimeSchema,
    createdBy: IdSchema,
  })
  .refine((settlement) => settlement.from !== settlement.to, {
    message: 'A settlement needs two different members',
  });
export type Settlement = z.infer<typeof SettlementSchema>;
