import { describe, expect, it } from 'vitest';
import { offProductUrl, parseOffProduct } from '../src/catalog/open-food-facts';
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
  it('asks only for the fields FridgeAI uses', () => {
    expect(offProductUrl(gtin)).toBe(
      'https://world.openfoodfacts.org/api/v2/product/7610000000004.json?fields=product_name,product_name_de,generic_name_de,brands,quantity,categories_tags,nutriments,nutriscore_grade,allergens_tags,image_front_small_url',
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
});
