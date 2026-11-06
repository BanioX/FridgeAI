import {
  categoryById,
  CONTRACT_V1,
  matchCategoryByName,
  normalizeFoodText,
  ShoppingListItemSchema,
  type CategoryId,
  type Id,
  type OperationOutput,
  type ShoppingListItem,
} from '@fridgeai/core';
import { CommandError, createCommandKit, type Handler, type HandlerContext } from './command';

type AtHome = NonNullable<OperationOutput<'shopping.addItem'>['atHome']>;

/**
 * Local shopping list (step 11a, US-08) on IndexedDB. Adding warns about food of the same kind
 * still at home (E-02): same category, if the name names one, or the same product name.
 */
export function createShoppingHandlers(ctx: HandlerContext) {
  const { db, clock, ids, actor } = ctx;
  const { event, runCommand } = createCommandKit(ctx, [
    db.shoppingItems,
    db.items,
    db.products,
    db.events,
    db.commands,
  ]);

  /** Loads the active inventory once and answers «what of this is at home?» per name. */
  async function homeLookup(householdId: Id) {
    const [items, products] = await Promise.all([
      db.items.where('[householdId+status]').equals([householdId, 'active']).toArray(),
      db.products.where('householdId').equals(householdId).toArray(),
    ]);
    const productById = new Map(products.map((product) => [product.id, product]));
    const active = items
      .filter((item) => item.deletedAt === undefined)
      .sort((a, b) => a.expiresOn.localeCompare(b.expiresOn));
    return (name: string, categoryId: CategoryId | undefined): AtHome | undefined => {
      const normalized = normalizeFoodText(name);
      const same = active.filter((item) => {
        const product = productById.get(item.productId);
        return (
          product !== undefined &&
          ((categoryId !== undefined && product.categoryId === categoryId) ||
            normalizeFoodText(product.name) === normalized)
        );
      });
      const soonest = same[0];
      if (soonest === undefined) {
        return undefined;
      }
      return {
        name: productById.get(soonest.productId)?.name ?? name,
        quantity: soonest.quantity,
        unit: soonest.unit,
        expiresOn: soonest.expiresOn,
        count: same.length,
      };
    };
  }

  async function rowsOf(householdId: Id): Promise<ShoppingListItem[]> {
    const rows = await db.shoppingItems.where('householdId').equals(householdId).toArray();
    return rows.filter((row) => row.deletedAt === undefined);
  }

  async function activeRow(householdId: Id, itemId: Id): Promise<ShoppingListItem> {
    const row = await db.shoppingItems.get(itemId);
    if (row?.householdId !== householdId || row.deletedAt !== undefined) {
      throw new CommandError('not_found', `Shopping list entry ${itemId} not found`);
    }
    return row;
  }

  const list: Handler<'shopping.list'> = async (raw) => {
    const input = CONTRACT_V1['shopping.list'].input.parse(raw);
    const rows = (await rowsOf(input.householdId)).filter(
      (row) => input.includeChecked || !row.checked,
    );
    // Open entries in the order they were added (UUIDv7 sorts by time), then the basket.
    const open = rows.filter((row) => !row.checked).sort((a, b) => a.id.localeCompare(b.id));
    const done = rows
      .filter((row) => row.checked)
      .sort((a, b) => (b.checkedAt ?? '').localeCompare(a.checkedAt ?? ''));
    const atHome = await homeLookup(input.householdId);
    return {
      items: [...open, ...done].map((row) => {
        const category = row.categoryId === undefined ? undefined : categoryById(row.categoryId);
        const home = row.checked ? undefined : atHome(row.name, row.categoryId);
        return {
          id: row.id,
          name: row.name,
          checked: row.checked,
          ...(row.quantity === undefined ? {} : { quantity: row.quantity }),
          ...(row.unit === undefined ? {} : { unit: row.unit }),
          ...(category === undefined ? {} : { categoryId: category.id, emoji: category.emoji }),
          ...(home === undefined ? {} : { atHome: home }),
        };
      }),
    };
  };

  const addItem: Handler<'shopping.addItem'> = async (raw) => {
    const input = CONTRACT_V1['shopping.addItem'].input.parse(raw);
    return runCommand('shopping.addItem', input.commandId, async () => {
      const category = matchCategoryByName(input.name) ?? undefined;
      const home = (await homeLookup(input.householdId))(input.name, category?.id);
      const found = {
        alreadyAtHome: home !== undefined,
        ...(home === undefined ? {} : { atHome: home }),
      };
      const normalized = normalizeFoodText(input.name);
      const onList = (await rowsOf(input.householdId)).find(
        (row) => !row.checked && normalizeFoodText(row.name) === normalized,
      );
      if (onList !== undefined) {
        return { itemId: onList.id, alreadyOnList: true, ...found };
      }
      const now = clock.now();
      const row = ShoppingListItemSchema.parse({
        id: ids.next(),
        householdId: input.householdId,
        updatedAt: now,
        name: input.name,
        ...(category === undefined ? {} : { categoryId: category.id }),
        ...(input.quantity === undefined ? {} : { quantity: input.quantity }),
        ...(input.unit === undefined ? {} : { unit: input.unit }),
        checked: false,
        addedBy: actor,
      });
      await db.shoppingItems.add(row);
      await db.events.add(
        event(input.householdId, 'shopping_list.item_added', {
          shoppingItemId: row.id,
          name: row.name,
        }),
      );
      return { itemId: row.id, alreadyOnList: false, ...found };
    });
  };

  const check: Handler<'shopping.check'> = async (raw) => {
    const input = CONTRACT_V1['shopping.check'].input.parse(raw);
    return runCommand('shopping.check', input.commandId, async () => {
      const row = await activeRow(input.householdId, input.itemId);
      if (row.checked !== input.checked) {
        const now = clock.now();
        const next: ShoppingListItem = { ...row, checked: input.checked, updatedAt: now };
        if (input.checked) {
          next.checkedAt = now;
        } else {
          delete next.checkedAt;
        }
        await db.shoppingItems.put(ShoppingListItemSchema.parse(next));
        await db.events.add(
          event(
            input.householdId,
            input.checked ? 'shopping_list.item_checked' : 'shopping_list.item_unchecked',
            { shoppingItemId: row.id },
          ),
        );
      }
      return { checked: input.checked };
    });
  };

  const remove: Handler<'shopping.remove'> = async (raw) => {
    const input = CONTRACT_V1['shopping.remove'].input.parse(raw);
    return runCommand('shopping.remove', input.commandId, async () => {
      const row = await activeRow(input.householdId, input.itemId);
      const now = clock.now();
      await db.shoppingItems.put(
        ShoppingListItemSchema.parse({ ...row, deletedAt: now, updatedAt: now }),
      );
      await db.events.add(
        event(input.householdId, 'shopping_list.item_removed', { shoppingItemId: row.id }),
      );
      return { removed: true };
    });
  };

  return {
    'shopping.list': list,
    'shopping.addItem': addItem,
    'shopping.check': check,
    'shopping.remove': remove,
  };
}

export type ShoppingHandlers = ReturnType<typeof createShoppingHandlers>;
