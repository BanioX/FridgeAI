import { describe, expect, it, vi } from 'vitest';
import { shippedCatalogSearch } from './local-catalog';

const file = {
  products: [['7610200000019', 'Vollmilch UHT', 'M-Budget', '1 l', ['milks'], ['migros']]],
};

describe('shippedCatalogSearch (ADR-0045)', () => {
  it('loads the catalog once, on the first search', async () => {
    const load = vi.fn(() => Promise.resolve(Response.json(file)));
    const search = shippedCatalogSearch(load);
    expect(load).not.toHaveBeenCalled();
    expect(await search.searchByName('Vollmilch', 5)).toHaveLength(1);
    expect(await search.searchByName('UHT', 5)).toHaveLength(1);
    expect(load).toHaveBeenCalledTimes(1);
  });

  it('says unavailable when the file cannot be loaded and tries again next time', async () => {
    const load = vi
      .fn<() => Promise<Response>>()
      .mockRejectedValueOnce(new Error('offline'))
      .mockResolvedValueOnce(new Response('nope', { status: 404 }))
      .mockResolvedValueOnce(Response.json(file));
    const search = shippedCatalogSearch(load);
    expect(await search.searchByName('Vollmilch', 5)).toBe('unavailable');
    expect(await search.searchByName('Vollmilch', 5)).toBe('unavailable');
    expect(await search.searchByName('Vollmilch', 5)).toHaveLength(1);
    expect(load).toHaveBeenCalledTimes(3);
  });
});
