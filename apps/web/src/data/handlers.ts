import {
  addDays,
  categoryById,
  CONTRACT_V1,
  estimateFromCategory,
  daysBetween,
  estimateExpiry,
  expiryAfterMove,
  expiryAfterOpening,
  expiryStatus,
  fallbackCategory,
  InventoryItemSchema,
  isAtRisk,
  matchCategoryByName,
  normalizeFoodText,
  OutcomeEventSchema,
  ProductSchema,
  rappen,
  RESERVE_SOON_THRESHOLD_DAYS,
  soonThresholdFor,
  summarizeImpact,
  toLocalDate,
  type Category,
  type IsoDateTime,
  type Id,
  type InventoryItem,
  type InventoryItemView,
  type OperationOutput,
  type Product,
  createReceiptMatchUseCases,
} from '@fridgeai/core';
import {
  appContext,
  CommandError,
  createCommandKit,
  type Handler,
  type HandlerContext,
} from './command';
import { createFrequentProductsHandler } from './frequent-handler';
import { createProductSearchHandler } from './product-search-handler';
import { createPriceHandler } from './price-handler';
import { createReceiptHandlers } from './receipt-handlers';
import { createReportHandler } from './report-handler';

export { CommandError, type CommandErrorCode, type HandlerContext } from './command';

const EPSILON = 1e-9;

function categoryOf(product: Product | undefined): Category {
  return (product && categoryById(product.categoryId)) ?? fallbackCategory();
}

type ProductFacts = Pick<Product, 'brand' | 'packSize' | 'nutrition' | 'nutriScore' | 'allergens'>;

/** Only the facts that are there (exactOptionalPropertyTypes: no `undefined` values). */
function factsOf(source: ProductFacts | undefined): ProductFacts {
  return {
    ...(source?.brand === undefined ? {} : { brand: source.brand }),
    ...(source?.packSize === undefined ? {} : { packSize: source.packSize }),
    ...(source?.nutrition === undefined ? {} : { nutrition: source.nutrition }),
    ...(source?.nutriScore === undefined ? {} : { nutriScore: source.nutriScore }),
    ...(source?.allergens === undefined ? {} : { allergens: source.allergens }),
  };
}

function toView(item: InventoryItem, product: Product | undefined): InventoryItemView {
  const category = categoryOf(product);
  return {
    id: item.id,
    productId: item.productId,
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
    ...(item.container === undefined ? {} : { container: item.container }),
    ...(item.packageSize === undefined ? {} : { packageSize: item.packageSize }),
    ...(item.openedOn === undefined ? {} : { openedOn: item.openedOn }),
    ...factsOf(product),
    ...(product === undefined ? {} : { productSource: product.source }),
    ...(product?.gtin === undefined ? {} : { gtin: product.gtin }),
  };
}

/**
 * Local implementation of the inventory operations of contract v1 (ADR-0005) on IndexedDB.
 * Every command runs in one transaction: validate, check idempotency, write entities and a domain
 * event, remember the result. The UI only talks to these handlers, never to Dexie directly.
 */
export function createInventoryHandlers(ctx: HandlerContext) {
  const { db, clock, ids, actor, catalog } = ctx;
  const { event, runCommand } = createCommandKit(ctx);

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
        // Facts an open database gave for this barcode (cached at lookup, never fetched here:
        // a network call would end the transaction). The name stays the one the person chose.
        const known =
          input.gtin === undefined ? undefined : (await db.catalogCache.get(input.gtin))?.info;
        product = ProductSchema.parse({
          id: ids.next(),
          householdId: input.householdId,
          updatedAt: now,
          name: input.name,
          categoryId: category.id,
          defaultLocation: category.defaultLocation,
          source: known === undefined ? 'manual' : 'off',
          ...(input.gtin === undefined ? {} : { gtin: input.gtin }),
          ...factsOf(known),
        });
        await db.products.add(product);
      }

      const productCategory = categoryOf(product);
      const sealedExpiresOn =
        input.expiresOn ??
        estimateExpiry(productCategory, input.location, today) ??
        estimateExpiry(productCategory, productCategory.defaultLocation, today) ??
        addDays(today, 7);
      // A pack that is already open follows the opening rule from the day it was opened.
      const opened =
        input.openedOn === undefined
          ? undefined
          : expiryAfterOpening({
              expiresOn: sealedExpiresOn,
              today: input.openedOn,
              ...(input.afterOpeningDays === undefined
                ? {}
                : { itemAfterOpeningDays: input.afterOpeningDays }),
              ...(productCategory.afterOpeningDays === undefined
                ? {}
                : { categoryAfterOpeningDays: productCategory.afterOpeningDays }),
            });
      const expiresOn = opened?.expiresOn ?? sealedExpiresOn;
      const expirySource = opened?.shortened
        ? 'after_opening'
        : input.expiresOn === undefined
          ? 'category_estimate'
          : (input.expirySource ?? 'manual');
      const item = InventoryItemSchema.parse({
        id: ids.next(),
        householdId: input.householdId,
        updatedAt: now,
        productId: product.id,
        location: input.location,
        quantity: input.quantity,
        unit: input.unit,
        ...(input.container === undefined ? {} : { container: input.container }),
        ...(input.packageSize === undefined ? {} : { packageSize: input.packageSize }),
        purchasedAt: now,
        expiresOn,
        expiryKind: input.expiryKind ?? productCategory.dateKind,
        expirySource,
        ...(input.location === 'freezer' ? { frozenOn: today } : {}),
        ...(input.afterOpeningDays === undefined
          ? {}
          : { afterOpeningDays: input.afterOpeningDays }),
        ...(input.openedOn === undefined ? {} : { openedOn: input.openedOn, sealedExpiresOn }),
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

  /**
   * Corrects what was entered wrong. Only fields that really change are written; a date set by
   * hand becomes `manual`. A wrong price can be removed (null): then category estimates apply.
   */
  /**
   * The product an item should point to after its name or category was corrected: a product of
   * the household with that name (typo fixed, «Apfle» → «Apfel»), else this product corrected in
   * place if no other active item uses it, else a new product just for this item (the other
   * milk stays milk). Barcode and facts stay only where the product stays the same.
   */
  async function correctedProduct(
    item: InventoryItem,
    current: Product,
    name: string,
    categoryId: Category['id'],
    now: IsoDateTime,
  ): Promise<Product> {
    const normalized = normalizeFoodText(name);
    const known = await db.products
      .where('householdId')
      .equals(item.householdId)
      .filter(
        (product) =>
          product.deletedAt === undefined &&
          product.id !== current.id &&
          normalizeFoodText(product.name) === normalized &&
          product.categoryId === categoryId,
      )
      .first();
    if (known !== undefined) {
      return known;
    }
    const sharedWith = await db.items
      .where('productId')
      .equals(current.id)
      .filter(
        (other) =>
          other.id !== item.id && other.deletedAt === undefined && other.status === 'active',
      )
      .count();
    if (sharedWith === 0) {
      const renamed = ProductSchema.parse({ ...current, name, categoryId, updatedAt: now });
      await db.products.put(renamed);
      return renamed;
    }
    const category = categoryById(categoryId) ?? fallbackCategory();
    const created = ProductSchema.parse({
      id: ids.next(),
      householdId: item.householdId,
      updatedAt: now,
      name,
      categoryId: category.id,
      defaultLocation: category.defaultLocation,
      source: 'manual',
    });
    await db.products.add(created);
    return created;
  }

  /**
   * Corrects what was entered wrong. Only fields that really change are written; a date set by
   * hand becomes `manual`. A wrong price can be removed (null): then category estimates apply. A
   * new category re-estimates an estimated date from the day of purchase.
   */
  const updateItem: Handler<'inventory.updateItem'> = async (raw) => {
    const input = CONTRACT_V1['inventory.updateItem'].input.parse(raw);
    return runCommand('inventory.updateItem', input.commandId, async () => {
      const item = await activeItem(input.householdId, input.itemId);
      const changed: OperationOutput<'inventory.updateItem'>['changed'] = [];
      const next: InventoryItem = { ...item };
      const now = clock.now();

      if (input.categoryId !== undefined && categoryById(input.categoryId) === undefined) {
        throw new CommandError('unknown_category', `Category ${input.categoryId} does not exist`);
      }
      const product = await db.products.get(item.productId);
      const name = input.name ?? product?.name;
      const categoryId = input.categoryId ?? product?.categoryId;
      const nameChanged = name !== undefined && name !== product?.name;
      const categoryChanged = categoryId !== undefined && categoryId !== product?.categoryId;
      if (product !== undefined && name !== undefined && categoryId !== undefined) {
        if (nameChanged || categoryChanged) {
          next.productId = (await correctedProduct(item, product, name, categoryId, now)).id;
        }
        if (nameChanged) {
          changed.push('name');
        }
        if (categoryChanged) {
          changed.push('categoryId');
        }
      }
      if (input.location !== undefined && input.location !== item.location) {
        next.location = input.location;
        changed.push('location');
      }
      if (input.expiresOn !== undefined && input.expiresOn !== item.expiresOn) {
        next.expiresOn = input.expiresOn;
        next.expirySource = 'manual';
        changed.push('expiresOn');
      } else if (
        input.expiresOn === undefined &&
        categoryChanged &&
        item.expirySource === 'category_estimate'
      ) {
        const category = categoryById(categoryId) ?? fallbackCategory();
        const estimated = estimateExpiry(category, next.location, toLocalDate(item.purchasedAt));
        if (estimated !== null && estimated !== item.expiresOn) {
          next.expiresOn = estimated;
          changed.push('expiresOn');
        }
      }
      if (input.expiryKind !== undefined && input.expiryKind !== item.expiryKind) {
        next.expiryKind = input.expiryKind;
        changed.push('expiryKind');
      }
      if (input.quantity !== undefined && Math.abs(input.quantity - item.quantity) > EPSILON) {
        next.quantity = input.quantity;
        changed.push('quantity');
      }
      if (
        input.priceRappen !== undefined &&
        (input.priceRappen ?? undefined) !== item.priceRappen
      ) {
        if (input.priceRappen === null) {
          delete next.priceRappen;
        } else {
          next.priceRappen = input.priceRappen;
        }
        changed.push('priceRappen');
      }
      if (changed.length === 0) {
        return { changed };
      }
      await db.items.put(InventoryItemSchema.parse({ ...next, updatedAt: now }));
      await db.events.add(
        event(input.householdId, 'item.updated', { itemId: item.id, fields: changed }),
      );
      return { changed };
    });
  };

  /** A wrong or test entry goes away without counting as wasted; `restoreItem` brings it back. */
  const deleteItem: Handler<'inventory.deleteItem'> = async (raw) => {
    const input = CONTRACT_V1['inventory.deleteItem'].input.parse(raw);
    return runCommand('inventory.deleteItem', input.commandId, async () => {
      const item = await db.items.get(input.itemId);
      if (item?.householdId !== input.householdId || item.deletedAt !== undefined) {
        throw new CommandError('not_found', `Item ${input.itemId} not found`);
      }
      const now = clock.now();
      await db.items.put(InventoryItemSchema.parse({ ...item, deletedAt: now, updatedAt: now }));
      await db.events.add(event(input.householdId, 'item.deleted', { itemId: item.id }));
      return { itemId: item.id };
    });
  };

  const restoreItem: Handler<'inventory.restoreItem'> = async (raw) => {
    const input = CONTRACT_V1['inventory.restoreItem'].input.parse(raw);
    return runCommand('inventory.restoreItem', input.commandId, async () => {
      const item = await db.items.get(input.itemId);
      if (item?.householdId !== input.householdId) {
        throw new CommandError('not_found', `Item ${input.itemId} not found`);
      }
      if (item.deletedAt !== undefined) {
        const restored: InventoryItem = { ...item, updatedAt: clock.now() };
        delete restored.deletedAt;
        await db.items.put(InventoryItemSchema.parse(restored));
        await db.events.add(event(input.householdId, 'item.restored', { itemId: item.id }));
      }
      return { itemId: item.id };
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
        ...(input.wasteReason === undefined ? {} : { wasteReason: input.wasteReason }),
        ...(input.sharedWith === undefined ? {} : { sharedWith: input.sharedWith }),
        quantity,
        valueRappen,
        valueEstimated: item.priceRappen === undefined,
        ...(grams === undefined ? {} : { grams }),
        atRisk: isAtRisk(
          item.expiresOn,
          item.expiryKind,
          clock.today(),
          soonThresholdFor(item.location),
        ),
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
          ...(input.wasteReason === undefined ? {} : { wasteReason: input.wasteReason }),
          ...(input.sharedWith === undefined ? {} : { sharedWith: input.sharedWith }),
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

  /**
   * Gives the quantity of an outcome back to its item and soft-deletes the outcome, so statistics
   * no longer count it. Works for any outcome, also one before a later outcome closed the item:
   * a closed item keeps its last quantity, so it comes back with exactly this outcome's quantity.
   */
  const undoOutcome: Handler<'inventory.undoOutcome'> = async (raw) => {
    const input = CONTRACT_V1['inventory.undoOutcome'].input.parse(raw);
    return runCommand('inventory.undoOutcome', input.commandId, async () => {
      const outcome = await db.outcomes.get(input.eventId);
      if (outcome?.householdId !== input.householdId) {
        throw new CommandError('not_found', `Outcome ${input.eventId} not found`);
      }
      if (outcome.deletedAt !== undefined) {
        throw new CommandError('already_undone', `Outcome ${input.eventId} is already undone`);
      }
      const item = await db.items.get(outcome.itemId);
      if (item?.householdId !== input.householdId) {
        throw new CommandError('not_found', `Item ${outcome.itemId} not found`);
      }
      const now = clock.now();
      const undone = event(input.householdId, 'outcome.undone', {
        eventId: outcome.id,
        itemId: item.id,
        outcome: outcome.outcome,
        quantity: outcome.quantity,
      });
      if (item.deletedAt !== undefined) {
        // The item itself was deleted later: only the entry goes, statistics no longer count it.
        await db.outcomes.put(
          OutcomeEventSchema.parse({ ...outcome, deletedAt: now, updatedAt: now }),
        );
        await db.events.add(undone);
        return { itemId: item.id, quantity: 0 };
      }
      const reopened = item.status !== 'active';
      const quantity = reopened
        ? outcome.quantity
        : Math.round((item.quantity + outcome.quantity) * 1e6) / 1e6;
      // Only a real receipt price goes back; an estimate was never stored on the item.
      const priceRappen =
        item.priceRappen === undefined || outcome.valueEstimated
          ? item.priceRappen
          : rappen((reopened ? 0 : item.priceRappen) + outcome.valueRappen);

      await db.outcomes.put(
        OutcomeEventSchema.parse({ ...outcome, deletedAt: now, updatedAt: now }),
      );
      await db.items.put(
        InventoryItemSchema.parse({
          ...item,
          status: 'active',
          ...(reopened ? { statusChangedAt: now } : {}),
          quantity,
          ...(priceRappen === undefined ? {} : { priceRappen }),
          updatedAt: now,
        }),
      );
      await db.events.add(undone);
      return { itemId: item.id, quantity };
    });
  };

  /**
   * Corrects how an entry ended (eaten, shared, wasted) and its reason or recipient. Amount, value
   * and date stay, so it stays in its month. If it is the entry that closed the item, the item's
   * status follows.
   */
  const changeOutcome: Handler<'inventory.changeOutcome'> = async (raw) => {
    const input = CONTRACT_V1['inventory.changeOutcome'].input.parse(raw);
    return runCommand('inventory.changeOutcome', input.commandId, async () => {
      const outcome = await db.outcomes.get(input.eventId);
      if (outcome?.householdId !== input.householdId) {
        throw new CommandError('not_found', `Outcome ${input.eventId} not found`);
      }
      if (outcome.deletedAt !== undefined) {
        throw new CommandError('already_undone', `Outcome ${input.eventId} is undone`);
      }
      const now = clock.now();
      const changed = { ...outcome, outcome: input.outcome, updatedAt: now };
      delete changed.wasteReason;
      delete changed.sharedWith;
      await db.outcomes.put(
        OutcomeEventSchema.parse({
          ...changed,
          ...(input.wasteReason === undefined ? {} : { wasteReason: input.wasteReason }),
          ...(input.sharedWith === undefined ? {} : { sharedWith: input.sharedWith }),
        }),
      );
      const item = await db.items.get(outcome.itemId);
      if (item !== undefined && item.status !== 'active' && item.deletedAt === undefined) {
        const latest = (await db.outcomes.where('itemId').equals(item.id).toArray())
          .filter((entry) => entry.deletedAt === undefined)
          // Same instant: the later id (UUIDv7) is the later entry.
          .sort((a, b) => b.at.localeCompare(a.at) || b.id.localeCompare(a.id))[0];
        if (latest?.id === outcome.id) {
          await db.items.put(
            InventoryItemSchema.parse({ ...item, status: input.outcome, updatedAt: now }),
          );
        }
      }
      await db.events.add(
        event(input.householdId, 'outcome.changed', {
          eventId: outcome.id,
          itemId: outcome.itemId,
          from: outcome.outcome,
          to: input.outcome,
          ...(input.wasteReason === undefined ? {} : { wasteReason: input.wasteReason }),
          ...(input.sharedWith === undefined ? {} : { sharedWith: input.sharedWith }),
        }),
      );
      return { eventId: outcome.id, outcome: input.outcome };
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

  const open: Handler<'inventory.open'> = async (raw) => {
    const input = CONTRACT_V1['inventory.open'].input.parse(raw);
    return runCommand('inventory.open', input.commandId, async () => {
      const item = await activeItem(input.householdId, input.itemId);
      if (item.openedOn !== undefined) {
        throw new CommandError('already_open', `Item ${item.id} was opened on ${item.openedOn}`);
      }
      const category = categoryOf(await db.products.get(item.productId));
      const today = clock.today();
      const afterOpeningDays = input.afterOpeningDays ?? item.afterOpeningDays;
      const result = expiryAfterOpening({
        expiresOn: item.expiresOn,
        today,
        ...(afterOpeningDays === undefined ? {} : { itemAfterOpeningDays: afterOpeningDays }),
        ...(category.afterOpeningDays === undefined
          ? {}
          : { categoryAfterOpeningDays: category.afterOpeningDays }),
      });
      await db.items.put(
        InventoryItemSchema.parse({
          ...item,
          openedOn: today,
          sealedExpiresOn: item.expiresOn,
          expiresOn: result.expiresOn,
          ...(result.shortened ? { expirySource: 'after_opening' } : {}),
          ...(afterOpeningDays === undefined ? {} : { afterOpeningDays }),
          updatedAt: clock.now(),
        }),
      );
      await db.events.add(
        event(input.householdId, 'item.opened', {
          itemId: item.id,
          openedOn: today,
          expiresOn: result.expiresOn,
          shortened: result.shortened,
        }),
      );
      return result;
    });
  };

  const lookupProduct: Handler<'products.lookup'> = async (raw) => {
    const input = CONTRACT_V1['products.lookup'].input.parse(raw);
    // The household's own product wins: it carries the name and category the person chose.
    const own = await db.products
      .where('householdId')
      .equals(input.householdId)
      .filter((product) => product.deletedAt === undefined && product.gtin === input.gtin)
      .first();
    if (own !== undefined) {
      return {
        product: {
          name: own.name,
          categoryId: own.categoryId,
          source: 'household',
          ...factsOf(own),
          ...(own.source === 'off' ? { factsFrom: 'off' as const } : {}),
        },
      };
    }
    const found = await catalog?.lookupByGtin(input.gtin);
    if (found === undefined || found === null) {
      return { product: null };
    }
    const category =
      matchCategoryByName(found.name) ??
      matchCategoryByName((found.categoryHints ?? []).join(' ')) ??
      fallbackCategory();
    return {
      product: {
        name: found.name,
        categoryId: category.id,
        source: found.source,
        ...factsOf(found),
      },
    };
  };

  const productImage: Handler<'products.image'> = async (raw) => {
    const input = CONTRACT_V1['products.image'].input.parse(raw);
    const entry = await db.productImages.get(input.gtin);
    return { image: entry === undefined ? null : { dataUrl: entry.dataUrl, source: entry.source } };
  };

  /** At most this many entries: enough for a year of a household, small enough for a phone. */
  const HISTORY_LIMIT = 500;

  const history: Handler<'inventory.history'> = async (raw) => {
    const input = CONTRACT_V1['inventory.history'].input.parse(raw);
    const outcomes = (await db.outcomes.where('householdId').equals(input.householdId).toArray())
      .filter((outcome) => {
        const day = toLocalDate(outcome.at);
        return outcome.deletedAt === undefined && day >= input.from && day <= input.to;
      })
      .sort((a, b) => b.at.localeCompare(a.at))
      .slice(0, HISTORY_LIMIT);
    const items = new Map(
      (await db.items.bulkGet([...new Set(outcomes.map((outcome) => outcome.itemId))]))
        .filter((item) => item !== undefined)
        .map((item) => [item.id, item]),
    );
    const products = new Map(
      (await db.products.bulkGet([...new Set([...items.values()].map((item) => item.productId))]))
        .filter((product) => product !== undefined)
        .map((product) => [product.id, product]),
    );
    return {
      outcomes: outcomes.flatMap((outcome) => {
        const item = items.get(outcome.itemId);
        const name = item === undefined ? undefined : products.get(item.productId)?.name;
        return item === undefined || name === undefined
          ? []
          : [
              {
                eventId: outcome.id,
                itemId: item.id,
                name,
                outcome: outcome.outcome,
                quantity: outcome.quantity,
                unit: item.unit,
                valueRappen: outcome.valueRappen,
                valueEstimated: outcome.valueEstimated,
                ...(outcome.wasteReason === undefined ? {} : { wasteReason: outcome.wasteReason }),
                ...(outcome.sharedWith === undefined ? {} : { sharedWith: outcome.sharedWith }),
                at: outcome.at,
              },
            ];
      }),
    };
  };

  const wasteStats: Handler<'stats.waste'> = async (raw) => {
    const input = CONTRACT_V1['stats.waste'].input.parse(raw);
    const outcomes = await db.outcomes.where('householdId').equals(input.householdId).toArray();
    const summary = summarizeImpact(outcomes, input.from, input.to);
    return {
      savedRappen: summary.savedRappen,
      wastedRappen: summary.wastedRappen,
      savedGrams: summary.savedGrams,
      wastedGrams: summary.wastedGrams,
      savedCount: summary.savedCount,
      wastedCount: summary.wastedCount,
      estimated: summary.estimated,
    };
  };

  return {
    'inventory.list': list,
    'inventory.listExpiring': listExpiring,
    'inventory.addItem': addItem,
    'inventory.updateItem': updateItem,
    'inventory.deleteItem': deleteItem,
    'inventory.restoreItem': restoreItem,
    'inventory.recordOutcome': recordOutcome,
    'inventory.undoOutcome': undoOutcome,
    'inventory.changeOutcome': changeOutcome,
    'inventory.history': history,
    'inventory.move': move,
    'inventory.open': open,
    'products.lookup': lookupProduct,
    'products.image': productImage,
    ...createFrequentProductsHandler(ctx),
    ...createProductSearchHandler(ctx),
    ...createReceiptHandlers(ctx, addItem),
    ...createReceiptMatchUseCases(appContext(ctx)),
    ...createPriceHandler(ctx),
    ...createReportHandler(ctx),
    'stats.waste': wasteStats,
  };
}

export type InventoryHandlers = ReturnType<typeof createInventoryHandlers>;
