import { CONTRACT_V1 } from '../contract/operations';
import type { Id } from '../ids';
import { ProductSchema, StorageSpotSchema, type StorageSpot } from '../model/inventory';
import { STORAGE_LOCATIONS } from '../model/primitives';
import { CommandError, createCommandKit, type AppContext, type UseCase } from './command';

const MAX_NAMES = 10;

/**
 * «Wo ist was?» (ADR-0056), ADR-0034 layer 2: named storage spots with an optional photo. Spots
 * belong to products, so every new pack of a product shows its usual spot; each spot lies in
 * one storage location. Photos stay on the device and travel only in export and import.
 */
export function createSpotUseCases(ctx: AppContext) {
  const { storage, clock, ids } = ctx;
  const { event, runCommand } = createCommandKit(ctx);

  async function activeSpot(householdId: Id, spotId: Id): Promise<StorageSpot> {
    const row = await storage.spots.get(spotId);
    if (row?.householdId !== householdId || row.deletedAt !== undefined) {
      throw new CommandError('not_found', `Spot ${spotId} not found`);
    }
    return row;
  }

  const list: UseCase<'spots.list'> = async (raw) => {
    const input = CONTRACT_V1['spots.list'].input.parse(raw);
    const [spots, products, items] = await Promise.all([
      storage.spots.ofHousehold(input.householdId),
      storage.products.ofHousehold(input.householdId),
      storage.items.activeOf(input.householdId),
    ]);
    const productById = new Map(products.map((product) => [product.id, product]));
    const live = spots.filter((spot) => spot.deletedAt === undefined);
    const order = (spot: StorageSpot) => STORAGE_LOCATIONS.indexOf(spot.location);
    live.sort((a, b) => order(a) - order(b) || a.name.localeCompare(b.name, 'de-CH'));
    return {
      spots: live.map((spot) => {
        const names = items
          .filter((item) => {
            const product = productById.get(item.productId);
            return (
              item.deletedAt === undefined &&
              item.location === spot.location &&
              product?.deletedAt === undefined &&
              product?.spotId === spot.id
            );
          })
          .map((item) => productById.get(item.productId)?.name ?? '')
          .filter((name) => name !== '');
        return {
          id: spot.id,
          name: spot.name,
          location: spot.location,
          ...(spot.photo === undefined ? {} : { photo: spot.photo }),
          itemCount: names.length,
          itemNames: names.slice(0, MAX_NAMES),
        };
      }),
    };
  };

  const create: UseCase<'spots.create'> = async (raw) => {
    const input = CONTRACT_V1['spots.create'].input.parse(raw);
    return runCommand('spots.create', input.commandId, async () => {
      const now = clock.now();
      const row = StorageSpotSchema.parse({
        id: ids.next(),
        householdId: input.householdId,
        name: input.name,
        location: input.location,
        ...(input.photo === undefined ? {} : { photo: input.photo }),
        createdAt: now,
        updatedAt: now,
      });
      await storage.spots.add(row);
      await storage.events.append(
        event(input.householdId, 'spot.created', { spotId: row.id, location: row.location }),
      );
      return { spotId: row.id };
    });
  };

  const update: UseCase<'spots.update'> = async (raw) => {
    const input = CONTRACT_V1['spots.update'].input.parse(raw);
    return runCommand('spots.update', input.commandId, async () => {
      const row = await activeSpot(input.householdId, input.spotId);
      const fields: string[] = [];
      if (input.name !== undefined) {
        fields.push('name');
      }
      if (input.photo !== undefined) {
        fields.push('photo');
      }
      if (fields.length === 0) {
        return { updated: false };
      }
      const { photo: oldPhoto, ...rest } = row;
      const photo = input.photo === undefined ? oldPhoto : (input.photo ?? undefined);
      await storage.spots.put(
        StorageSpotSchema.parse({
          ...rest,
          ...(input.name === undefined ? {} : { name: input.name }),
          ...(photo === undefined ? {} : { photo }),
          updatedAt: clock.now(),
        }),
      );
      await storage.events.append(
        event(input.householdId, 'spot.updated', { spotId: row.id, fields }),
      );
      return { updated: true };
    });
  };

  const remove: UseCase<'spots.delete'> = async (raw) => {
    const input = CONTRACT_V1['spots.delete'].input.parse(raw);
    return runCommand('spots.delete', input.commandId, async () => {
      const row = await activeSpot(input.householdId, input.spotId);
      const now = clock.now();
      await storage.spots.put(StorageSpotSchema.parse({ ...row, deletedAt: now, updatedAt: now }));
      let productCount = 0;
      for (const product of await storage.products.ofHousehold(input.householdId)) {
        if (product.spotId === row.id) {
          const rest = { ...product };
          delete rest.spotId;
          await storage.products.put(ProductSchema.parse({ ...rest, updatedAt: now }));
          productCount += 1;
        }
      }
      await storage.events.append(
        event(input.householdId, 'spot.deleted', { spotId: row.id, productCount }),
      );
      return { deleted: true, productCount };
    });
  };

  const setSpot: UseCase<'products.setSpot'> = async (raw) => {
    const input = CONTRACT_V1['products.setSpot'].input.parse(raw);
    return runCommand('products.setSpot', input.commandId, async () => {
      const product = await storage.products.get(input.productId);
      if (product?.householdId !== input.householdId || product.deletedAt !== undefined) {
        throw new CommandError('not_found', `Product ${input.productId} not found`);
      }
      if (input.spotId !== null) {
        await activeSpot(input.householdId, input.spotId);
      }
      const rest = { ...product };
      delete rest.spotId;
      await storage.products.put(
        ProductSchema.parse({
          ...rest,
          ...(input.spotId === null ? {} : { spotId: input.spotId }),
          updatedAt: clock.now(),
        }),
      );
      await storage.events.append(
        event(input.householdId, 'product.spot_set', {
          productId: product.id,
          spotId: input.spotId,
        }),
      );
      return { productId: product.id, spotId: input.spotId };
    });
  };

  return {
    'spots.list': list,
    'spots.create': create,
    'spots.update': update,
    'spots.delete': remove,
    'products.setSpot': setSpot,
  };
}

export type SpotUseCases = ReturnType<typeof createSpotUseCases>;
