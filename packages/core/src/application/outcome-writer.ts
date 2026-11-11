import { soonThresholdFor } from '../expiry';
import { canBeRescued, isAtRisk } from '../metrics';
import {
  InventoryItemSchema,
  OutcomeEventSchema,
  type InventoryItem,
  type Outcome,
  type ShareRecipient,
  type WasteReason,
} from '../model/inventory';
import type { Id } from '../ids';
import { rappen, type Rappen } from '../money';
import { estimateFromCategory } from '../value';
import { CommandError, createCommandKit, type AppContext } from './command';
import { categoryOf, EPSILON } from './inventory-shared';

export interface OutcomeRequest {
  outcome: Outcome;
  /** Default: everything the item still has. */
  quantity?: number | undefined;
  wasteReason?: WasteReason | undefined;
  sharedWith?: ShareRecipient | undefined;
  /** Only counts when the item could be rescued (`canBeRescued`). */
  rescued?: boolean | undefined;
  /** The item this one is processed into («Verarbeiten»): the value moves on (ADR-0051). */
  madeInto?: Id | undefined;
}

export interface OutcomeWritten {
  eventId: Id;
  remainingQuantity: number;
  rescued: boolean;
  valueRappen: Rappen;
  valueEstimated: boolean;
}

/**
 * Closes (part of) an item: one outcome entry, the item's new quantity and status, and the events
 * `item.consumed` and `item.used_up`. The one place for the portion logic, used by
 * `inventory.recordOutcome` and `inventory.process`. Call it inside a command transaction.
 */
export function createOutcomeWriter(ctx: AppContext) {
  const { storage, clock, ids, actor } = ctx;
  const { event } = createCommandKit(ctx);

  return async function writeOutcome(
    item: InventoryItem,
    request: OutcomeRequest,
  ): Promise<OutcomeWritten> {
    const quantity = request.quantity ?? item.quantity;
    if (quantity > item.quantity + EPSILON) {
      throw new CommandError('invalid_quantity', 'More than the item still has');
    }
    const product = await storage.products.get(item.productId);
    const category = categoryOf(product);
    const share = quantity / item.quantity;
    // priceRappen always holds the value of what is left, so partial use stays exact.
    const estimate = estimateFromCategory(quantity, item.unit, category);
    const valueRappen =
      item.priceRappen === undefined
        ? estimate.valueRappen
        : rappen(Math.round(item.priceRappen * share));
    const valueEstimated = item.priceRappen === undefined || item.priceEstimated === true;
    const grams = estimate.grams;

    // Only a confirmed rescue of food that was really on the brink counts (ADR-0039).
    const rescued =
      request.rescued === true && request.outcome !== 'wasted' && canBeRescued(item, clock.today());

    const now = clock.now();
    const outcome = OutcomeEventSchema.parse({
      id: ids.next(),
      householdId: item.householdId,
      updatedAt: now,
      itemId: item.id,
      outcome: request.outcome,
      ...(request.wasteReason === undefined ? {} : { wasteReason: request.wasteReason }),
      ...(request.sharedWith === undefined ? {} : { sharedWith: request.sharedWith }),
      quantity,
      valueRappen,
      valueEstimated,
      ...(grams === undefined ? {} : { grams }),
      atRisk: isAtRisk(
        item.expiresOn,
        item.expiryKind,
        clock.today(),
        soonThresholdFor(item.location),
      ),
      ...(rescued ? { rescued: true } : {}),
      ...(request.madeInto === undefined ? {} : { madeInto: request.madeInto }),
      owner: item.owner,
      at: now,
      by: actor,
    });
    await storage.outcomes.add(outcome);

    const remaining = Math.round((item.quantity - quantity) * 1e6) / 1e6;
    const closed = remaining <= EPSILON;
    await storage.items.put(
      InventoryItemSchema.parse(
        closed
          ? { ...item, status: request.outcome, statusChangedAt: now, updatedAt: now }
          : {
              ...item,
              quantity: remaining,
              ...(item.priceRappen === undefined
                ? {}
                : { priceRappen: rappen(item.priceRappen - valueRappen) }),
              updatedAt: now,
            },
      ),
    );
    await storage.events.append(
      event(item.householdId, 'item.consumed', {
        itemId: item.id,
        outcome: request.outcome,
        quantity,
        valueRappen,
        ...(request.wasteReason === undefined ? {} : { wasteReason: request.wasteReason }),
        ...(request.sharedWith === undefined ? {} : { sharedWith: request.sharedWith }),
      }),
    );
    if (closed) {
      await storage.events.append(
        event(item.householdId, 'item.used_up', {
          itemId: item.id,
          productId: item.productId,
          ...(product?.gtin === undefined ? {} : { gtin: product.gtin }),
        }),
      );
    }
    return {
      eventId: outcome.id,
      remainingQuantity: closed ? 0 : remaining,
      rescued,
      valueRappen,
      valueEstimated,
    };
  };
}
