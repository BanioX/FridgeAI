import { addDays } from '../dates';
import {
  categoryById,
  fallbackCategory,
  matchCategoryByName,
  normalizeFoodText,
} from '../catalog/match';
import type { Category } from '../catalog/category';
import { CONTRACT_V1, type OperationOutput } from '../contract/operations';
import { estimateExpiry, expiryAfterMove, expiryAfterOpening } from '../expiry';
import {
  InventoryItemSchema,
  OutcomeEventSchema,
  ProductSchema,
  type InventoryItem,
  type Product,
} from '../model/inventory';
import type { Id } from '../ids';
import type { IsoDateTime } from '../model/primitives';
import { rappen } from '../money';
import { toLocalDate } from '../dates';
import { CommandError, createCommandKit, type AppContext, type UseCase } from './command';
import { activeItem, categoryOf, EPSILON, factsOf } from './inventory-shared';
import { createMinStockEnsurer } from './min-stock';
import { createOutcomeWriter } from './outcome-writer';

/**
 * The inventory commands of contract v1 (ADR-0005), ADR-0034 layer 2: validate, check
 * idempotency, write entities and a domain event, remember the result. Data only through the
 * storage ports, so the same code runs on the device and later on a server.
 */
export function createInventoryCommands(ctx: AppContext) {
  const { storage, clock, ids } = ctx;
  const { event, runCommand } = createCommandKit(ctx);

  const addItem: UseCase<'inventory.addItem'> = async (raw) => {
    const input = CONTRACT_V1['inventory.addItem'].input.parse(raw);
    return runCommand('inventory.addItem', input.commandId, async () => {
      const now = clock.now();
      const today = clock.today();
      const category =
        (input.categoryId === undefined ? undefined : categoryById(input.categoryId)) ??
        matchCategoryByName(input.name) ??
        fallbackCategory();

      const normalizedName = normalizeFoodText(input.name);
      let product = (await storage.products.ofHousehold(input.householdId)).find(
        (candidate) =>
          candidate.deletedAt === undefined &&
          (input.gtin === undefined
            ? normalizeFoodText(candidate.name) === normalizedName
            : candidate.gtin === input.gtin),
      );
      if (product === undefined) {
        // Facts an open database gave for this barcode (cached at lookup, never fetched here:
        // a network call would end the transaction). The name stays the one the person chose.
        const known =
          input.gtin === undefined ? undefined : await storage.productFacts.get(input.gtin);
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
        await storage.products.add(product);
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
        ...(input.readyMade === undefined ? {} : { readyMade: input.readyMade }),
        ...(input.priceRappen === undefined ? {} : { priceRappen: input.priceRappen }),
        owner: input.owner,
        status: 'active',
      });
      await storage.items.add(item);
      await storage.events.append(
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
    const known = (await storage.products.ofHousehold(item.householdId)).find(
      (product) =>
        product.deletedAt === undefined &&
        product.id !== current.id &&
        normalizeFoodText(product.name) === normalized &&
        product.categoryId === categoryId,
    );
    if (known !== undefined) {
      return known;
    }
    const sharedWith = (await storage.items.activeOf(item.householdId)).filter(
      (other) =>
        other.productId === current.id && other.id !== item.id && other.deletedAt === undefined,
    ).length;
    if (sharedWith === 0) {
      const renamed = ProductSchema.parse({ ...current, name, categoryId, updatedAt: now });
      await storage.products.put(renamed);
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
    await storage.products.add(created);
    return created;
  }

  /**
   * Corrects what was entered wrong. Only fields that really change are written; a date set by
   * hand becomes `manual`. A wrong price can be removed (null): then category estimates apply. A
   * new category re-estimates an estimated date from the day of purchase.
   */
  const updateItem: UseCase<'inventory.updateItem'> = async (raw) => {
    const input = CONTRACT_V1['inventory.updateItem'].input.parse(raw);
    return runCommand('inventory.updateItem', input.commandId, async () => {
      const item = await activeItem(storage, input.householdId, input.itemId);
      const changed: OperationOutput<'inventory.updateItem'>['changed'] = [];
      const next: InventoryItem = { ...item };
      const now = clock.now();

      if (input.categoryId !== undefined && categoryById(input.categoryId) === undefined) {
        throw new CommandError('unknown_category', `Category ${input.categoryId} does not exist`);
      }
      const product = await storage.products.get(item.productId);
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
        next.expirySource = input.expirySource ?? 'manual';
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
        delete next.priceEstimated;
        changed.push('priceRappen');
      }
      if (input.readyMade !== undefined && (input.readyMade ?? undefined) !== item.readyMade) {
        if (input.readyMade === null) {
          delete next.readyMade;
        } else {
          next.readyMade = input.readyMade;
        }
        changed.push('readyMade');
      }
      if (input.owner !== undefined && input.owner !== item.owner) {
        if (input.owner !== 'shared') {
          const member = await storage.members.get(input.owner);
          if (
            member?.householdId !== input.householdId ||
            member.leftAt !== undefined ||
            member.deletedAt !== undefined
          ) {
            throw new CommandError(
              'invalid_owner',
              `Owner ${input.owner} is not «shared» or an active member of the household`,
            );
          }
        }
        next.owner = input.owner;
        changed.push('owner');
      }
      if (changed.length === 0) {
        return { changed };
      }
      await storage.items.put(InventoryItemSchema.parse({ ...next, updatedAt: now }));
      await storage.events.append(
        event(input.householdId, 'item.updated', { itemId: item.id, fields: changed }),
      );
      return { changed };
    });
  };

  /** A wrong or test entry goes away without counting as wasted; `restoreItem` brings it back. */
  const deleteItem: UseCase<'inventory.deleteItem'> = async (raw) => {
    const input = CONTRACT_V1['inventory.deleteItem'].input.parse(raw);
    return runCommand('inventory.deleteItem', input.commandId, async () => {
      const item = await storage.items.get(input.itemId);
      if (item?.householdId !== input.householdId || item.deletedAt !== undefined) {
        throw new CommandError('not_found', `Item ${input.itemId} not found`);
      }
      const now = clock.now();
      await storage.items.put(
        InventoryItemSchema.parse({ ...item, deletedAt: now, updatedAt: now }),
      );
      await storage.events.append(event(input.householdId, 'item.deleted', { itemId: item.id }));
      return { itemId: item.id };
    });
  };

  const restoreItem: UseCase<'inventory.restoreItem'> = async (raw) => {
    const input = CONTRACT_V1['inventory.restoreItem'].input.parse(raw);
    return runCommand('inventory.restoreItem', input.commandId, async () => {
      const item = await storage.items.get(input.itemId);
      if (item?.householdId !== input.householdId) {
        throw new CommandError('not_found', `Item ${input.itemId} not found`);
      }
      if (item.deletedAt !== undefined) {
        const restored: InventoryItem = { ...item, updatedAt: clock.now() };
        delete restored.deletedAt;
        await storage.items.put(InventoryItemSchema.parse(restored));
        await storage.events.append(event(input.householdId, 'item.restored', { itemId: item.id }));
      }
      return { itemId: item.id };
    });
  };

  const writeOutcome = createOutcomeWriter(ctx);
  const ensureMinStock = createMinStockEnsurer(ctx);

  const recordOutcome: UseCase<'inventory.recordOutcome'> = async (raw) => {
    const input = CONTRACT_V1['inventory.recordOutcome'].input.parse(raw);
    return runCommand('inventory.recordOutcome', input.commandId, async () => {
      const item = await activeItem(storage, input.householdId, input.itemId);
      const written = await writeOutcome(item, input);
      const addedToList = await ensureMinStock(input.householdId, item.productId);
      return { ...written, ...(addedToList ? { addedToList: true } : {}) };
    });
  };

  /**
   * Gives the quantity of an outcome back to its item and soft-deletes the outcome, so statistics
   * no longer count it. Works for any outcome, also one before a later outcome closed the item:
   * a closed item keeps its last quantity, so it comes back with exactly this outcome's quantity.
   */
  const undoOutcome: UseCase<'inventory.undoOutcome'> = async (raw) => {
    const input = CONTRACT_V1['inventory.undoOutcome'].input.parse(raw);
    return runCommand('inventory.undoOutcome', input.commandId, async () => {
      const outcome = await storage.outcomes.get(input.eventId);
      if (outcome?.householdId !== input.householdId) {
        throw new CommandError('not_found', `Outcome ${input.eventId} not found`);
      }
      if (outcome.deletedAt !== undefined) {
        throw new CommandError('already_undone', `Outcome ${input.eventId} is already undone`);
      }
      const item = await storage.items.get(outcome.itemId);
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
        await storage.outcomes.put(
          OutcomeEventSchema.parse({ ...outcome, deletedAt: now, updatedAt: now }),
        );
        await storage.events.append(undone);
        return { itemId: item.id, quantity: 0 };
      }
      const reopened = item.status !== 'active';
      const quantity = reopened
        ? outcome.quantity
        : Math.round((item.quantity + outcome.quantity) * 1e6) / 1e6;
      // Only a real receipt price goes back; an estimate was never stored on the item.
      const priceRappen =
        item.priceRappen === undefined || (outcome.valueEstimated && item.priceEstimated !== true)
          ? item.priceRappen
          : rappen((reopened ? 0 : item.priceRappen) + outcome.valueRappen);

      await storage.outcomes.put(
        OutcomeEventSchema.parse({ ...outcome, deletedAt: now, updatedAt: now }),
      );
      await storage.items.put(
        InventoryItemSchema.parse({
          ...item,
          status: 'active',
          ...(reopened ? { statusChangedAt: now } : {}),
          quantity,
          ...(priceRappen === undefined ? {} : { priceRappen }),
          updatedAt: now,
        }),
      );
      await storage.events.append(undone);
      return { itemId: item.id, quantity };
    });
  };

  /**
   * Corrects how an entry ended (eaten, shared, wasted) and its reason or recipient. Amount, value
   * and date stay, so it stays in its month. If it is the entry that closed the item, the item's
   * status follows.
   */
  const changeOutcome: UseCase<'inventory.changeOutcome'> = async (raw) => {
    const input = CONTRACT_V1['inventory.changeOutcome'].input.parse(raw);
    return runCommand('inventory.changeOutcome', input.commandId, async () => {
      const outcome = await storage.outcomes.get(input.eventId);
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
      if (input.outcome === 'wasted') {
        // Thrown away after all: no longer a rescue (ADR-0039).
        delete changed.rescued;
      }
      await storage.outcomes.put(
        OutcomeEventSchema.parse({
          ...changed,
          ...(input.wasteReason === undefined ? {} : { wasteReason: input.wasteReason }),
          ...(input.sharedWith === undefined ? {} : { sharedWith: input.sharedWith }),
        }),
      );
      const item = await storage.items.get(outcome.itemId);
      if (item !== undefined && item.status !== 'active' && item.deletedAt === undefined) {
        const latest = (await storage.outcomes.ofItem(item.id))
          .filter((entry) => entry.deletedAt === undefined)
          // Same instant: the later id (UUIDv7) is the later entry.
          .sort((a, b) => b.at.localeCompare(a.at) || b.id.localeCompare(a.id))[0];
        if (latest?.id === outcome.id) {
          await storage.items.put(
            InventoryItemSchema.parse({ ...item, status: input.outcome, updatedAt: now }),
          );
        }
      }
      await storage.events.append(
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

  const move: UseCase<'inventory.move'> = async (raw) => {
    const input = CONTRACT_V1['inventory.move'].input.parse(raw);
    return runCommand('inventory.move', input.commandId, async () => {
      const item = await activeItem(storage, input.householdId, input.itemId);
      const category = categoryOf(await storage.products.get(item.productId));
      const today = clock.today();
      const estimated = expiryAfterMove({
        category,
        from: item.location,
        to: input.to,
        today,
        currentExpiresOn: item.expiresOn,
      });
      // «Trotzdem einfrieren» (freeze hint): food without freezer days keeps the date it has,
      // because nothing in the catalog says how long it lasts there.
      const result =
        estimated === null && input.allowUnsuitable === true && input.to === 'freezer'
          ? { expiresOn: item.expiresOn, frozenOn: today }
          : estimated;
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
      if (item.location !== input.to) {
        // Freezing sets `frozenOn` and clears `thawedOn`; thawing does the opposite.
        delete updated.frozenOn;
        delete updated.thawedOn;
        if (result.frozenOn !== undefined) {
          updated.frozenOn = result.frozenOn;
        }
        if (result.thawedOn !== undefined) {
          updated.thawedOn = result.thawedOn;
        }
      }
      await storage.items.put(InventoryItemSchema.parse(updated));
      await storage.events.append(
        event(input.householdId, 'item.moved', {
          itemId: item.id,
          from: item.location,
          to: input.to,
          expiresOn: result.expiresOn,
          previousExpiresOn: item.expiresOn,
        }),
      );
      return { expiresOn: result.expiresOn };
    });
  };

  const open: UseCase<'inventory.open'> = async (raw) => {
    const input = CONTRACT_V1['inventory.open'].input.parse(raw);
    return runCommand('inventory.open', input.commandId, async () => {
      const item = await activeItem(storage, input.householdId, input.itemId);
      if (item.openedOn !== undefined) {
        throw new CommandError('already_open', `Item ${item.id} was opened on ${item.openedOn}`);
      }
      const category = categoryOf(await storage.products.get(item.productId));
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
      await storage.items.put(
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
      await storage.events.append(
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

  /**
   * Nutrition read from a photo of the label (on the device, step 10b): set on the product of the
   * item. The item may be closed already (a product outlives its packs), but not deleted.
   */
  const setNutrition: UseCase<'products.setNutrition'> = async (raw) => {
    const input = CONTRACT_V1['products.setNutrition'].input.parse(raw);
    return runCommand('products.setNutrition', input.commandId, async () => {
      const item = await storage.items.get(input.itemId);
      const product =
        item?.householdId === input.householdId && item.deletedAt === undefined
          ? await storage.products.get(item.productId)
          : undefined;
      if (item === undefined || product === undefined || product.deletedAt !== undefined) {
        throw new CommandError('not_found', `Item ${input.itemId} not found`);
      }
      await storage.products.put(
        ProductSchema.parse({ ...product, nutrition: input.nutrition, updatedAt: clock.now() }),
      );
      await storage.events.append(
        event(input.householdId, 'product.nutrition_set', {
          productId: product.id,
          itemId: item.id,
        }),
      );
      return { productId: product.id };
    });
  };

  /** «Immer da haben» (ADR-0059): the minimum of active packs, or `null` for none. */
  const setMinStock: UseCase<'products.setMinStock'> = async (raw) => {
    const input = CONTRACT_V1['products.setMinStock'].input.parse(raw);
    return runCommand('products.setMinStock', input.commandId, async () => {
      const product = await storage.products.get(input.productId);
      if (product?.householdId !== input.householdId || product.deletedAt !== undefined) {
        throw new CommandError('not_found', `Product ${input.productId} not found`);
      }
      const rest = { ...product };
      delete rest.minStock;
      await storage.products.put(
        ProductSchema.parse({
          ...rest,
          ...(input.minStock === null ? {} : { minStock: input.minStock }),
          updatedAt: clock.now(),
        }),
      );
      await storage.events.append(
        event(input.householdId, 'product.min_stock_set', {
          productId: product.id,
          minStock: input.minStock,
        }),
      );
      return { productId: product.id, minStock: input.minStock };
    });
  };

  /**
   * Items the recognition could not place went to «Sonstiges» in the pantry with an estimated
   * date. When a better recognition knows them now (ADR-0045 follow-up, Alban 8.11.2026: «Mache
   * alles selber»), they get the category, its place and a new estimate. Only what nobody touched:
   * still «Sonstiges», date still estimated, still where «Sonstiges» put it. Each change is its own
   * `inventory.updateItem` with its events; running it again finds nothing left to do.
   */
  const recategorize: UseCase<'inventory.recategorize'> = async (raw) => {
    const input = CONTRACT_V1['inventory.recategorize'].input.parse(raw);
    const fallback = fallbackCategory();
    const itemIds: Id[] = [];
    for (const item of await storage.items.ofHousehold(input.householdId)) {
      if (
        item.status !== 'active' ||
        item.deletedAt !== undefined ||
        item.expirySource !== 'category_estimate' ||
        item.location !== fallback.defaultLocation
      ) {
        continue;
      }
      const product = await storage.products.get(item.productId);
      const found = product?.categoryId === fallback.id ? matchCategoryByName(product.name) : null;
      if (found === null || found.id === fallback.id) {
        continue;
      }
      await updateItem({
        commandId: ids.next(),
        householdId: input.householdId,
        itemId: item.id,
        categoryId: found.id,
        ...(found.defaultLocation === item.location ? {} : { location: found.defaultLocation }),
      });
      itemIds.push(item.id);
    }
    return { itemIds };
  };

  return {
    'inventory.addItem': addItem,
    'inventory.updateItem': updateItem,
    'inventory.recategorize': recategorize,
    'inventory.deleteItem': deleteItem,
    'inventory.restoreItem': restoreItem,
    'inventory.recordOutcome': recordOutcome,
    'inventory.undoOutcome': undoOutcome,
    'inventory.changeOutcome': changeOutcome,
    'inventory.move': move,
    'inventory.open': open,
    'products.setNutrition': setNutrition,
    'products.setMinStock': setMinStock,
  };
}
