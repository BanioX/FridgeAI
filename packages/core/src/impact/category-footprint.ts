import { FOOTPRINTS, type FootprintEntity, type FootprintPerKg } from './footprints';

/**
 * Which product of the Clark et al. dataset stands for a Rettich category (ADR-0057). A reviewed
 * table, not a guess at runtime: a test checks that every catalog category has an entry.
 *
 * - `estimated: 'group'`: no product of the dataset fits; the entity is a sensible stand-in for
 *   the whole category (or its group). The numbers then rest on an estimate and are said so.
 * - no `estimated`: the entity is the product the category is named after.
 * - `entity: null`: nothing to count (no food, or water, which the dataset does not list).
 *
 * Doubtful source values are used as published; see the header of `footprints.ts`.
 */
export interface CategoryFootprint {
  entity: FootprintEntity | null;
  estimated?: 'group';
}

const exact = (entity: FootprintEntity): CategoryFootprint => ({ entity });
const group = (entity: FootprintEntity): CategoryFootprint => ({ entity, estimated: 'group' });
const none: CategoryFootprint = { entity: null };

export const CATEGORY_FOOTPRINT: Readonly<Record<string, CategoryFootprint>> = {
  'dairy-milk': exact("Cow's milk"),
  'dairy-uht-milk': exact("Cow's milk"),
  // Cream has a clearly higher footprint than milk; the dataset has no cream, so this is low.
  'dairy-cream': group("Cow's milk"),
  'dairy-yoghurt': exact('Yoghurt'),
  // Butter 3.325 kg CO2e per kg looks low next to the cheeses; used as published.
  'dairy-butter': exact('Butter'),
  // Gruyère, Emmentaler and the like: Cheddar is the closest hard cheese in the dataset.
  'dairy-cheese-hard': group('Cheddar cheese'),
  // Quark, Frischkäse, Mozzarella: Mozzarella is the only fresh cheese that matches.
  'dairy-cheese-soft': group('Mozzarella cheese'),
  // Schmelzkäse, Toastkäse: processed hard cheese, so the same stand-in as the hard cheeses.
  'dairy-cheese-slices': group('Cheddar cheese'),
  'dairy-eggs': exact('Eggs'),
  'meat-poultry': exact('Chicken breast'),
  // Beef mince 95 kg CO2e per kg is far above usual values; used as published.
  'meat-minced': exact('Beef mince'),
  // Rind, Schwein, Schnitzel: the pork loin is the middle one, beef steak would triple it.
  'meat-fresh': group('Pork loin'),
  'meat-coldcuts': group('Bacon'),
  'meat-sausage': exact('Pork sausages'),
  'fish-fresh': group('Salmon'),
  'fish-smoked-salmon': exact('Salmon'),
  // Lettuce 4.926 kg CO2e per kg looks high next to other vegetables; used as published.
  'produce-salad': exact('Lettuce'),
  'produce-tomatoes': exact('Tomatoes'),
  'produce-cucumber': exact('Cucumber'),
  'produce-carrots': exact('Carrots'),
  'produce-potatoes': exact('Potatoes'),
  'produce-onions': exact('Onions'),
  'produce-mushrooms': exact('Mushrooms'),
  'produce-berries': group('Strawberries'),
  'produce-apples': exact('Apples'),
  'produce-bananas': exact('Bananas'),
  'produce-citrus': exact('Oranges'),
  'produce-herbs': group('Mixed salad'),
  'produce-avocado': exact('Avocados'),
  'produce-fruit': group('Pears'),
  'produce-vegetables': group('Peppers'),
  'bakery-bread': exact('Bread'),
  'bakery-toast': exact('Bread'),
  'bakery-pastry': exact('Croissants'),
  'pantry-pasta': exact('Spaghetti'),
  'pantry-rice': exact('Rice'),
  // Flour is not in the dataset; sugar is the other half of the category.
  'pantry-flour': group('Sugar'),
  'pantry-canned': group('Chickpeas'),
  'pantry-sauces': group('Tomato ketchup'),
  'pantry-tomato-paste': group('Tomato ketchup'),
  'pantry-cereal': exact('Breakfast cereal'),
  'pantry-oil': group('Olive oil'),
  'pantry-spices': group('Sunflower seeds'),
  'pantry-coffee-tea': group('Coffee beans'),
  'pantry-sweets': group('Milk chocolate'),
  'frozen-vegetables': group('Garden peas'),
  'frozen-meals': group('Vegetarian pizza'),
  'frozen-icecream': exact('Ice cream'),
  'drinks-juice': exact('Orange juice'),
  'drinks-soft': group('Apple juice'),
  'drinks-alcohol': group('Beer'),
  'bakery-homemade': group('Sponge cake'),
  'prepared-leftovers': group('Chicken pasta'),
  'prepared-ready-meals': group('Chicken pasta'),
  'prepared-desserts': group('Cheesecake'),
  'prepared-dips': group('Chickpeas'),
  'prepared-tofu': exact('Tofu'),
  'reserve-freeze-dried': group('Vegetarian curry'),
  'reserve-rations': group('Cracker biscuits'),
  // Water is not in the dataset: nothing is counted.
  'reserve-water': none,
  'pantry-other': group('Spaghetti'),
  'nonfood-toilet-paper': none,
  'nonfood-cleaning': none,
  'nonfood-hygiene': none,
  'nonfood-pet-food': none,
};

/** The footprint per kg of a category; undefined for no food or an unknown category. */
export function footprintPerKg(
  categoryId: string,
): { perKg: FootprintPerKg; estimated: boolean } | undefined {
  const mapped = CATEGORY_FOOTPRINT[categoryId];
  if (mapped?.entity === undefined || mapped.entity === null) {
    return undefined;
  }
  return { perKg: FOOTPRINTS[mapped.entity], estimated: mapped.estimated === 'group' };
}

/**
 * Typical weight of one piece in grams, for items counted in pieces whose weight is not known.
 * An estimate (rounded, from common Swiss pack and fruit sizes), always marked as one. Categories
 * without an entry fall back to the typical pack weight of the catalog.
 */
export const PIECE_GRAMS: Readonly<Record<string, number>> = {
  'dairy-eggs': 60,
  'dairy-cheese-slices': 20,
  'dairy-yoghurt': 180,
  'dairy-cheese-soft': 250,
  'meat-sausage': 100,
  'produce-salad': 250,
  'produce-tomatoes': 120,
  'produce-cucumber': 400,
  'produce-onions': 100,
  'produce-apples': 180,
  'produce-bananas': 120,
  'produce-citrus': 150,
  'produce-herbs': 25,
  'produce-avocado': 200,
  'produce-fruit': 150,
  'produce-vegetables': 200,
  'bakery-bread': 500,
  'bakery-toast': 500,
  'bakery-pastry': 70,
  'bakery-homemade': 600,
  'pantry-canned': 400,
  'pantry-spices': 50,
  'pantry-sweets': 100,
  'frozen-meals': 400,
  'drinks-soft': 500,
  'drinks-alcohol': 500,
  'prepared-leftovers': 300,
  'prepared-ready-meals': 350,
  'prepared-desserts': 150,
  'prepared-tofu': 200,
  'reserve-freeze-dried': 120,
  'reserve-rations': 500,
};
