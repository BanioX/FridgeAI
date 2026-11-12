import { describe, expect, it } from 'vitest';
import {
  createInventoryUseCases,
  createMemoryStorage,
  createRecipeCommands,
  createRecipeQueries,
  GtinSchema,
  IsoDateTimeSchema,
  localDate,
  parseOffProduct,
  uuidV7,
  type Id,
} from '../src';

/** «Zutat oder Fertigprodukt» (ADR-0053) through the use cases on memory storage. */
function id(counter: number): Id {
  const random = new Uint8Array(10);
  random[9] = counter;
  return uuidV7(1_762_500_000_000 + counter, random);
}

const householdId = id(1);
const gtin = GtinSchema.parse('7610000000011');

function setup(offAnswer?: unknown) {
  let counter = 10;
  const ctx = {
    storage: createMemoryStorage(),
    clock: {
      now: () => IsoDateTimeSchema.parse('2026-11-11T09:00:00.000Z'),
      today: () => localDate('2026-11-11'),
    },
    ids: { next: () => id((counter += 1)) },
    actor: id(2),
    ...(offAnswer === undefined
      ? {}
      : { catalog: { lookupByGtin: () => Promise.resolve(parseOffProduct(offAnswer, gtin)) } }),
  };
  return {
    ctx,
    inventory: createInventoryUseCases(ctx),
    recipes: createRecipeQueries(ctx),
    recipeCommands: createRecipeCommands(ctx),
  };
}

type Inventory = ReturnType<typeof setup>['inventory'];
type Context = ReturnType<typeof setup>['ctx'];

const add = (inventory: Inventory, ctx: Context, name: string, fields = {}) =>
  inventory['inventory.addItem']({
    commandId: ctx.ids.next(),
    householdId,
    name,
    location: 'fridge',
    quantity: 1,
    unit: 'pcs',
    owner: 'shared',
    ...fields,
  });

const listed = async (inventory: Inventory) =>
  (await inventory['inventory.list']({ householdId })).items;

describe('readyMade on items', () => {
  it('stays absent by default and loads without the field', async () => {
    const { ctx, inventory } = setup();
    await add(inventory, ctx, 'Skyr Cheesecake');
    const [item] = await listed(inventory);
    expect(item?.categoryId).toBe('prepared-desserts');
    expect(item).not.toHaveProperty('readyMade');
  });

  it('takes the hint when adding and shows it in the view', async () => {
    const { ctx, inventory } = setup();
    await add(inventory, ctx, 'Mystery Snack', { readyMade: true });
    expect((await listed(inventory))[0]?.readyMade).toBe(true);
  });

  it('switches with updateItem, both ways, and back to the category with null', async () => {
    const { ctx, inventory } = setup();
    const { itemId } = await add(inventory, ctx, 'Naturjoghurt');
    const update = (readyMade: boolean | null) =>
      inventory['inventory.updateItem']({
        commandId: ctx.ids.next(),
        householdId,
        itemId,
        readyMade,
      });
    expect((await update(true)).changed).toEqual(['readyMade']);
    expect((await listed(inventory))[0]?.readyMade).toBe(true);
    // the same value again changes nothing
    expect((await update(true)).changed).toEqual([]);
    expect((await update(false)).changed).toEqual(['readyMade']);
    expect((await listed(inventory))[0]?.readyMade).toBe(false);
    expect((await update(null)).changed).toEqual(['readyMade']);
    expect((await listed(inventory))[0]).not.toHaveProperty('readyMade');
  });
});

describe('Open Food Facts hint', () => {
  it('sets readyMade on the lookup for NOVA group 4 and leaves other products alone', async () => {
    const { inventory } = setup({ product: { product_name: 'Cheesecake', nova_group: 4 } });
    const { product } = await inventory['products.lookup']({ householdId, gtin });
    expect(product?.readyMade).toBe(true);

    const plain = setup({ product: { product_name: 'Naturjoghurt', nova_group: 1 } });
    const found = await plain.inventory['products.lookup']({ householdId, gtin });
    expect(found.product).not.toHaveProperty('readyMade');
  });
});

describe('recipes and Fertigprodukte', () => {
  it('keeps Joghurt «Fehlt» with a Skyr Cheesecake and has it «Da» with a Skyr Nature', async () => {
    const { ctx, inventory, recipes } = setup();
    await add(inventory, ctx, 'Skyr Cheesecake');
    const joghurtLine = async () => {
      const { recipe } = await recipes['recipes.get']({ householdId, recipeId: 'birchermuesli' });
      return recipe?.ingredients.find((entry) => entry.text.includes('Joghurt'));
    };
    expect((await joghurtLine())?.atHome).toEqual([]);

    await add(inventory, ctx, 'Emmi Skyr Nature');
    expect((await joghurtLine())?.atHome.map((entry) => entry.name)).toEqual(['Emmi Skyr Nature']);
  });

  it('follows the switch on the item', async () => {
    const { ctx, inventory, recipes } = setup();
    const { itemId } = await add(inventory, ctx, 'Naturjoghurt');
    const atHome = async () => {
      const { recipe } = await recipes['recipes.get']({ householdId, recipeId: 'birchermuesli' });
      return recipe?.ingredients.find((entry) => entry.text.includes('Joghurt'))?.atHome.length;
    };
    expect(await atHome()).toBe(1);
    await inventory['inventory.updateItem']({
      commandId: ctx.ids.next(),
      householdId,
      itemId,
      readyMade: true,
    });
    expect(await atHome()).toBe(0);
  });

  it('counts Oreos for an own recipe that asks for Oreo', async () => {
    const { ctx, inventory, recipes, recipeCommands } = setup();
    await add(inventory, ctx, 'Oreo Kekse');
    const created = await recipeCommands['recipes.create']({
      commandId: ctx.ids.next(),
      householdId,
      title: 'Oreo Cheesecake',
      ingredients: ['200 g Oreo', '2 dl Joghurt'],
      steps: ['Mischen.'],
    });
    const { recipe } = await recipes['recipes.get']({
      householdId,
      recipeId: created.recipeId,
    });
    expect(recipe?.ingredients.map((entry) => entry.atHome.length)).toEqual([1, 0]);
  });
});
