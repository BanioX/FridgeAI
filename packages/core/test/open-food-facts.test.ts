import { describe, expect, it } from 'vitest';
import {
  offProductUrl,
  offSearchUrl,
  parseOffProduct,
  parseOffSearch,
} from '../src/catalog/open-food-facts';
import { GtinSchema } from '../src/model/primitives';

const gtin = GtinSchema.parse('7610000000004');

// Shaped like a real API v2 answer, with invented values.
const milk = {
  code: '7610000000004',
  status: 1,
  product: {
    product_name: 'Whole milk',
    product_name_de: 'Vollmilch',
    brands: 'Alpenhof, Eigenmarke',
    quantity: '1 l',
    categories_tags: ['en:dairies', 'en:milks', 'de:vollmilch'],
    nutriments: {
      'energy-kcal_100g': 65,
      fat_100g: 3.5,
      'saturated-fat_100g': 2.3,
      carbohydrates_100g: 4.8,
      sugars_100g: 4.8,
      proteins_100g: 3.3,
      salt_100g: 0.1,
      'energy-kj_100g': 272,
    },
    nutriscore_grade: 'B',
    allergens_tags: ['en:milk'],
  },
};

describe('Open Food Facts', () => {
  it('asks only for the fields rettich uses', () => {
    expect(offProductUrl(gtin)).toBe(
      'https://world.openfoodfacts.org/api/v2/product/7610000000004.json?fields=product_name,product_name_de,generic_name_de,brands,quantity,categories_tags,nova_group,nutriments,nutriscore_grade,allergens_tags,image_front_small_url',
    );
  });

  it('maps a product with German name, first brand, pack size and nutrition per 100 ml', () => {
    expect(parseOffProduct(milk, gtin)).toEqual({
      gtin,
      name: 'Vollmilch',
      source: 'off',
      brand: 'Alpenhof',
      packSize: '1 l',
      categoryHints: ['dairies', 'milks', 'vollmilch'],
      nutrition: {
        basis: '100ml',
        energyKcal: 65,
        fat: 3.5,
        saturatedFat: 2.3,
        carbohydrates: 4.8,
        sugars: 4.8,
        protein: 3.3,
        salt: 0.1,
        source: 'off',
      },
      nutriScore: 'b',
      allergens: ['milk'],
    });
  });

  it('falls back to the international name and leaves out what is missing', () => {
    expect(parseOffProduct({ product: { product_name: ' Basmati  Rice ' } }, gtin)).toEqual({
      gtin,
      name: 'Basmati Rice',
      source: 'off',
    });
  });

  it('calls NOVA group 4 and dessert or meal categories ready to eat (Fertigprodukt)', () => {
    const ready = (product: Record<string, unknown>) =>
      parseOffProduct({ product: { product_name: 'X', ...product } }, gtin)?.readyMade;
    expect(ready({ nova_group: 4 })).toBe(true);
    expect(ready({ nova_group: '4' })).toBe(true);
    expect(ready({ categories_tags: ['en:desserts', 'en:cheesecakes'] })).toBe(true);
    expect(ready({ categories_tags: ['en:meals', 'en:pizzas'] })).toBe(true);
    expect(ready({ nova_group: 1 })).toBeUndefined();
    expect(ready({ nova_group: 3, categories_tags: ['en:dairies', 'en:meat'] })).toBeUndefined();
    expect(ready({})).toBeUndefined();
    expect(parseOffProduct(milk, gtin)?.readyMade).toBeUndefined();
  });

  it('returns null for unknown products and broken answers', () => {
    expect(parseOffProduct({ status: 0, status_verbose: 'product not found' }, gtin)).toBeNull();
    expect(parseOffProduct({ product: { brands: 'Ohne Namen' } }, gtin)).toBeNull();
    expect(parseOffProduct('<html>', gtin)).toBeNull();
    expect(parseOffProduct(null, gtin)).toBeNull();
  });

  it('keeps only pack pictures from the Open Food Facts image server', () => {
    const withImage = (url: string) =>
      parseOffProduct({ product: { product_name: 'Milch', image_front_small_url: url } }, gtin)
        ?.imageUrl;
    const good =
      'https://images.openfoodfacts.org/images/products/761/000/000/0004/front_de.3.200.jpg';
    expect(withImage(good)).toBe(good);
    for (const bad of [
      'http://images.openfoodfacts.org/images/products/761/front.jpg',
      'https://evil.example/images/products/761/front.jpg',
      'https://images.openfoodfacts.org/images/products/761/front.svg',
      'https://images.openfoodfacts.org/images/products/../../x.jpg',
      'https://images.openfoodfacts.org/images/products/761/front.jpg?track=1',
      'javascript:alert(1)',
    ]) {
      expect(withImage(bad), bad).toBeUndefined();
    }
  });

  it('drops implausible nutrition values instead of storing them', () => {
    const typo = { product: { product_name: 'Butter', nutriments: { fat_100g: 820 } } };
    expect(parseOffProduct(typo, gtin)?.nutrition).toBeUndefined();
  });

  it('searches Swiss products by name, all words, with a bounded page size', () => {
    const url = new URL(offSearchUrl('  Coop   Gipfeli ', 50));
    expect(url.origin + url.pathname).toBe('https://world.openfoodfacts.org/cgi/search.pl');
    expect(url.searchParams.get('search_terms')).toBe('Coop Gipfeli');
    expect(url.searchParams.get('page_size')).toBe('20');
    expect(url.searchParams.get('tag_0')).toBe('switzerland');
    expect(url.searchParams.get('fields')).toBe(
      'code,product_name,product_name_de,brands,quantity',
    );
  });

  it('turns search answers into hits with valid barcodes, German names first, no duplicates', () => {
    // Shaped like a real search.pl answer, with invented values.
    const answer = {
      count: 4,
      page: 1,
      products: [
        {
          code: '7610000000004',
          product_name: 'Croissant',
          product_name_de: 'Gipfeli',
          brands: 'Coop, Eigenmarke',
          quantity: '4 × 45 g',
        },
        { code: '7610000000004', product_name_de: 'Gipfeli doppelt' },
        { code: '1234', product_name_de: 'Falscher Code' },
        { code: '96385074', product_name: ' Weggli ', brands: '', quantity: '' },
        { code: '7610000000011', brands: 'Ohne Namen' },
      ],
    };
    expect(parseOffSearch(answer)).toEqual([
      { gtin: '7610000000004', name: 'Gipfeli', brand: 'Coop', packSize: '4 × 45 g' },
      { gtin: '96385074', name: 'Weggli' },
    ]);
  });

  it('says null for broken answers (e.g. an HTML page when too many searches were made)', () => {
    expect(parseOffSearch('<html>Too many requests</html>')).toBeNull();
    expect(parseOffSearch({ count: 0 })).toBeNull();
    expect(parseOffSearch({ products: [] })).toEqual([]);
  });
});
