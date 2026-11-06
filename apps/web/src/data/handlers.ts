import {
  addDays,
  categoryById,
  CONTRACT_V1,
  estimateFromCategory,
  daysBetween,
  DomainEventSchema,
  estimateExpiry,
  expiryAfterMove,
  expiryStatus,
  fallbackCategory,
  InventoryItemSchema,
  matchCategoryByName,
  normalizeFoodText,
  OutcomeEventSchema,
  ProductSchema,
  rappen,
  RESERVE_SOON_THRESHOLD_DAYS,
  soonThresholdFor,
  type Category,
  type Clock,
  type DomainEvent,
  type Id,
  type IdGenerator,
  type InventoryItem,
  type InventoryItemView,
  type OperationInput,
  type OperationName,
  type OperationOutput,
  type Product,
} from '@fridgeai/core';
import type { FridgeDb } from './db';

export interface HandlerContext {
  db: FridgeDb;
  clock: Clock;
  ids: IdGenerator;
  /** The member acting (author of events and outcomes). */
  actor: Id;
}

type Handler<TName extends OperationName> = (
  input: OperationInput<TName>,
) => Promise<OperationOutput<TName>>;

export type CommandErrorCode =
  'not_found' | 'not_active' | 'invalid_quantity' | 'unsuitable_location';

export class CommandError extends Error {
  readonly code: CommandErrorCode;

  constructor(code: CommandErrorCode, message: string) {
    super(message);
    this.name = 'CommandError';
    this.code = code;
  }
}

const EPSILON = 1e-9;

function categoryOf(product: Product | undefined): Category {
  return (product && categoryById(product.categoryId)) ?? fallbackCategory();
}

function toView(item: InventoryItem, product: Product | undefined): InventoryItemView {
  const category = categoryOf(product);
  return {
    id: item.id,
    name: product?.name ?? category.name.de,
    emoji: category.emoji,
    categoryId: category.id,
    location: item.location,
    quantity: item.quantity,
    unit: item.unit,
    expiresOn: item.expiresOn,
    expiryKind: item.expiryKind,
    expirySource: item.expirySource,
    owner: item.owner,
    ...(item.priceRappen === undefined ? {} : { priceRappen: item.priceRappen }),
  };
}

/**
 * Local implementation of the inventory operations of contract v1 (ADR-0005) on IndexedDB.
 * Every command runs in one transaction: validate, check idempotency, write entities and a domain
 * event, remember the result. The UI only talks to these handlers, never to Dexie directly.
 */
export function createInventoryHandlers(ctx: HandlerContext) {
  const { db, clock, ids, actor } = ctx;
  const allTables = [db.items, db.products, db.outcomes, db.events, db.commands];

  function event<TType extends DomainEvent['type']>(
    householdId: Id,
    type: TType,
    payload: Extract<DomainEvent, { type: TType }>['payload'],
  ): DomainEvent {
    return DomainEventSchema.parse({
      id: ids.next(),
      type,
      version: 1,
      householdId,
      actor,
      at: clock.now(),
      payload,
    });
  }

  async function runCommand<TName extends OperationName>(
    name: TName,
    commandId: Id,
    execute: () => Promise<OperationOutput<TName>>,
  ): Promise<OperationOutput<TName>> {
    return db.transaction('rw', allTables, async () => {
      const done = await db.commands.get(commandId);
      if (done !== undefined) {
        return CONTRACT_V1[name].output.parse(done.result) as OperationOutput<TName>;
      }
      const result = await execute();
      await db.commands.add({ commandId, operation: name, result, at: clock.now() });
      return result;
    });
  }

  async function activeItem(householdId: Id, itemId: Id): Promise<InventoryItem> {
    const item = await db.items.get(itemId);
    if (item?.householdId !== householdId || item.deletedAt !== undefined) {
      throw new CommandError('not_found', `Item ${itemId} not found`);
    }
    if (item.status !== 'active') {
      throw new CommandError('not_active', `Item ${itemId} is already closed`);
    }
    return item;
  }

  async function householdProducts(householdId: Id): Promise<Map<Id, Product>> {
    const products = await db.products.where('householdId').equals(householdId).toArray();
    return new Map(products.map((product) => [product.id, product]));
  }

  async function activeViews(householdId: Id): Promise<InventoryItemView[]> {
    const [items, products] = await Promise.all([
      db.items.where('[householdId+status]').equals([householdId, 'active']).toArray(),
      householdProducts(householdId),
    ]);
    return items
      .filter((item) => item.deletedAt === undefined)
      .sort((a, b) => a.expiresOn.localeCompare(b.expiresOn))
      .map((item) => toView(item, products.get(item.productId)));
  }

  const list: Handler<'inventory.list'> = async (raw) => {
    const input = CONTRACT_V1['inventory.list'].input.parse(raw);
    const views = await activeViews(input.householdId);
    return {
      items:
        input.location === undefined
          ? views
          : views.filter((view) => view.location === input.location),
    };
  };

  const listExpiring: Handler<'inventory.listExpiring'> = async (raw) => {
    const input = CONTRACT_V1['inventory.listExpiring'].input.parse(raw);
    const today = clock.today();
    const items = (await activeViews(input.householdId))
      .filter((view) => {
        const daysLeft = daysBetween(today, view.expiresOn);
        if (view.location !== 'reserve') {
          return daysLeft <= input.withinDays;
        }
        // The Notvorrat only shows up when it needs attention (or when asked for explicitly).
        return input.includeReserve
          ? daysLeft <= input.withinDays
          : daysLeft <= RESERVE_SOON_THRESHOLD_DAYS;
      })
      .map((view) => ({
        ...view,
        status: expiryStatus(
          view.expiresOn,
          today,
          view.expiryKind,
          soonThresholdFor(view.location),
        ),
      }));
    return { items };
  };

  const addItem: Handler<'inventory.addItem'> = async (raw) => {
    const input = CONTRACT_V1['inventory.addItem'].input.parse(raw);
    return runCommand('inventory.addItem', input.commandId, async () => {
      const now = clock.now();
      const today = clock.today();
      const category =
        (input.categoryId === undefined ? undefined : categoryById(input.categoryId)) ??
        matchCategoryByName(input.name) ??
        fallbackCategory();

      const normalizedName = normalizeFoodText(input.name);
      let product = await db.products
        .where('householdId')
        .equals(input.householdId)
        .filter(
          (candidate) =>
            candidate.deletedAt === undefined &&
            (input.gtin === undefined
              ? normalizeFoodText(candidate.name) === normalizedName
              : candidate.gtin === input.gtin),
        )
        .first();
      if (product === undefined) {
        product = ProductSchema.parse({
          id: ids.next(),
          householdId: input.householdId,
          updatedAt: now,
          name: input.name,
          categoryId: category.id,
          defaultLocation: category.defaultLocation,
          source: 'manual',
          ...(input.gtin === undefined ? {} : { gtin: input.gtin }),
        });
        await db.products.add(product);
      }

      const productCategory = categoryOf(product);
      const expiresOn =
        input.expiresOn ??
        estimateExpiry(productCategory, input.location, today) ??
        estimateExpiry(productCategory, productCategory.defaultLocation, today) ??
        addDays(today, 7);
      const item = InventoryItemSchema.parse({
        id: ids.next(),
        householdId: input.householdId,
        updatedAt: now,
        productId: product.id,
        location: input.location,
        quantity: input.quantity,
        unit: input.unit,
        purchasedAt: now,
        expiresOn,
        expiryKind: input.expiryKind ?? productCategory.dateKind,
        expirySource:
          input.expiresOn === undefined ? 'category_estimate' : (input.expirySource ?? 'manual'),
        ...(input.location === 'freezer' ? { frozenOn: today } : {}),
        ...(input.priceRappen === undefined ? {} : { priceRappen: input.priceRappen }),
        owner: input.owner,
        status: 'active',
      });
      await db.items.add(item);
      await db.events.add(
        event(input.householdId, 'item.added', {
          itemId: item.id,
          productId: product.id,
          location: item.location,
          expiresOn: item.expiresOn,
        }),
      );
      return { itemId: item.id, expiresOn: item.expiresOn };
    });
  };

  const recordOutcome: Handler<'inventory.recordOutcome'> = async (raw) => {
    const input = CONTRACT_V1['inventory.recordOutcome'].input.parse(raw);
    return runCommand('inventory.recordOutcome', input.commandId, async () => {
      const item = await activeItem(input.householdId, input.itemId);
      const quantity = input.quantity ?? item.quantity;
      if (quantity > item.quantity + EPSILON) {
        throw new CommandError('invalid_quantity', 'More than the item still has');
      }
      const product = await db.products.get(item.productId);
      const category = categoryOf(product);
      const share = quantity / item.quantity;
      // priceRappen always holds the value of what is left, so partial use stays exact.
      const estimate = estimateFromCategory(quantity, item.unit, category);
      const valueRappen =
        item.priceRappen === undefined
          ? estimate.valueRappen
          : rappen(Math.round(item.priceRappen * share));
      const grams = estimate.grams;

      const now = clock.now();
      const outcome = OutcomeEventSchema.parse({
        id: ids.next(),
        householdId: input.householdId,
        updatedAt: now,
        itemId: item.id,
        outcome: input.outcome,
        quantity,
        valueRappen,
        valueEstimated: item.priceRappen === undefined,
        ...(grams === undefined ? {} : { grams }),
        owner: item.owner,
        at: now,
        by: actor,
      });
      await db.outcomes.add(outcome);

      const remaining = Math.round((item.quantity - quantity) * 1e6) / 1e6;
      const closed = remaining <= EPSILON;
      await db.items.put(
        InventoryItemSchema.parse(
          closed
            ? { ...item, status: input.outcome, statusChangedAt: now, updatedAt: now }
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
      await db.events.add(
        event(input.householdId, 'item.consumed', {
          itemId: item.id,
          outcome: input.outcome,
          quantity,
          valueRappen,
        }),
      );
      if (closed) {
        await db.events.add(
          event(input.householdId, 'item.used_up', {
            itemId: item.id,
            productId: item.productId,
            ...(product?.gtin === undefined ? {} : { gtin: product.gtin }),
          }),
        );
      }
      return { eventId: outcome.id, remainingQuantity: closed ? 0 : remaining };
    });
  };

  const move: Handler<'inventory.move'> = async (raw) => {
    const input = CONTRACT_V1['inventory.move'].input.parse(raw);
    return runCommand('inventory.move', input.commandId, async () => {
      const item = await activeItem(input.householdId, input.itemId);
      const category = categoryOf(await db.products.get(item.productId));
      const result = expiryAfterMove({
        category,
        from: item.location,
        to: input.to,
        today: clock.today(),
        currentExpiresOn: item.expiresOn,
      });
      if (result === null) {
        throw new CommandError(
          'unsuitable_location',
          `${category.id} cannot be stored in ${input.to}`,
        );
      }
      const updated: InventoryItem = {
        ...item,
        location: input.to,
        expiresOn: result.expiresOn,
        expirySource: result.expiresOn === item.expiresOn ? item.expirySource : 'category_estimate',
        updatedAt: clock.now(),
      };
      if (result.frozenOn === undefined) {
        delete updated.frozenOn;
      } else {
        updated.frozenOn = result.frozenOn;
      }
      await db.items.put(InventoryItemSchema.parse(updated));
      await db.events.add(
        event(input.householdId, 'item.moved', {
          itemId: item.id,
          from: item.location,
          to: input.to,
          expiresOn: result.expiresOn,
        }),
      );
      return { expiresOn: result.expiresOn };
    });
  };

  return {
    'inventory.list': list,
    'inventory.listExpiring': listExpiring,
    'inventory.addItem': addItem,
    'inventory.recordOutcome': recordOutcome,
    'inventory.move': move,
  };
}

export type InventoryHandlers = ReturnType<typeof createInventoryHandlers>;
