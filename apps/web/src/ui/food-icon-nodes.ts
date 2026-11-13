import {
  Apple,
  Avocado,
  Backpack,
  Banana,
  Beef,
  Bubbles,
  CakeSlice,
  Cake,
  Candy,
  Carrot,
  Cherry,
  Citrus,
  Coffee,
  CookingPot,
  Croissant,
  CupSoda,
  Cylinder,
  Droplets,
  Drumstick,
  Egg,
  Fish,
  GlassWater,
  Grape,
  Ham,
  IceCreamCone,
  LeafyGreen,
  Milk,
  PawPrint,
  Pizza,
  Salad,
  Sandwich,
  ShoppingBasket,
  Soup,
  SprayCan,
  Sprout,
  Tent,
  Vegan,
  Wheat,
  Wine,
  createLucideIcon,
  type LucideIcon,
} from 'lucide-react';

/*
 * Own food pictures (ADR-0080, Alban 13.11.2026: «Eigene feine Symbole, keine Emojis»). Where the
 * line icons the app already uses (Lucide, ISC) have a fitting one, it is used; the rest are drawn
 * here on the same 24 px grid with the same round stroke, so every picture looks like one family.
 */

export const Cheese = createLucideIcon('rettich-cheese', [
  ['path', { d: 'M3 12 21 5v14H3z', key: 'wedge' }],
  ['path', { d: 'M3 12h18', key: 'rind' }],
  ['circle', { cx: '8', cy: '15.5', r: '1.25', key: 'hole-a' }],
  ['circle', { cx: '15', cy: '15.5', r: '1.75', key: 'hole-b' }],
]);

export const Butter = createLucideIcon('rettich-butter', [
  ['path', { d: 'M3 11 7 7h14v7l-4 4H3z', key: 'block' }],
  ['path', { d: 'M3 11h14v7', key: 'edge' }],
  ['path', { d: 'm17 11 4-4', key: 'top' }],
]);

export const Yoghurt = createLucideIcon('rettich-yoghurt', [
  ['path', { d: 'M4 5h16v3H4z', key: 'lid' }],
  ['path', { d: 'M5.5 8h13l-1.5 12h-10z', key: 'cup' }],
  ['path', { d: 'M8 13h8', key: 'label' }],
]);

export const Sausage = createLucideIcon('rettich-sausage', [
  [
    'path',
    {
      d: 'M5 19a3.5 3.5 0 0 1 0-4.95l9.05-9.05a3.5 3.5 0 0 1 4.95 4.95L9.95 19a3.5 3.5 0 0 1-4.95 0z',
      key: 'body',
    },
  ],
  ['path', { d: 'm4 20-1.5 1.5', key: 'end-a' }],
  ['path', { d: 'm20 4 1.5-1.5', key: 'end-b' }],
]);

export const Cucumber = createLucideIcon('rettich-cucumber', [
  [
    'path',
    {
      d: 'M4.5 19.5a2.5 2.5 0 0 1 0-3.54l11.46-11.46a2.5 2.5 0 0 1 3.54 3.54L8.04 19.5a2.5 2.5 0 0 1-3.54 0z',
      key: 'body',
    },
  ],
  ['path', { d: 'M9 14h.01', key: 'seed-a' }],
  ['path', { d: 'M12 11h.01', key: 'seed-b' }],
  ['path', { d: 'M15 8h.01', key: 'seed-c' }],
]);

export const Tomato = createLucideIcon('rettich-tomato', [
  ['circle', { cx: '12', cy: '13.5', r: '7.5', key: 'body' }],
  ['path', { d: 'M12 6V2.5', key: 'stem' }],
  ['path', { d: 'M7.5 5.5 12 6l4.5-.5-2.5 3L12 6l-2 2.5z', key: 'leaves' }],
]);

export const Potato = createLucideIcon('rettich-potato', [
  [
    'path',
    {
      d: 'M8 5c3-1.5 8-1 10 2s1.5 8-1.5 10.5-9 3.5-11.5 1S3 11 4 8.5 6 5.5 8 5z',
      key: 'body',
    },
  ],
  ['path', { d: 'M9 10h.01', key: 'eye-a' }],
  ['path', { d: 'M14 13h.01', key: 'eye-b' }],
  ['path', { d: 'M10.5 16h.01', key: 'eye-c' }],
]);

export const Onion = createLucideIcon('rettich-onion', [
  ['path', { d: 'M12 4c0 3-7 5-7 10a7 7 0 0 0 14 0c0-5-7-7-7-10z', key: 'bulb' }],
  ['path', { d: 'M12 21c-1.8-1.8-3-4.2-3-7s1.3-5 3-6.5', key: 'layer' }],
  ['path', { d: 'M12 4V2', key: 'top' }],
]);

export const Mushroom = createLucideIcon('rettich-mushroom', [
  ['path', { d: 'M3 12a9 7.5 0 0 1 18 0z', key: 'cap' }],
  ['path', { d: 'M9 12v6a3 3 0 0 0 6 0v-6', key: 'stem' }],
]);

export const Bread = createLucideIcon('rettich-bread', [
  [
    'path',
    {
      d: 'M5 10a3 3 0 0 1 0-6h14a3 3 0 0 1 0 6v9a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1z',
      key: 'slice',
    },
  ],
]);

export const Pasta = createLucideIcon('rettich-pasta', [
  ['path', { d: 'm8 3 1 18', key: 'a' }],
  ['path', { d: 'M12 3v18', key: 'b' }],
  ['path', { d: 'm16 3-1 18', key: 'c' }],
  ['path', { d: 'M6.5 10.5h11v3h-11z', key: 'band' }],
]);

export const GrainBowl = createLucideIcon('rettich-grain-bowl', [
  ['path', { d: 'M3 11h18a9 9 0 0 1-18 0z', key: 'bowl' }],
  ['path', { d: 'm8 6.5 1 1.5', key: 'grain-a' }],
  ['path', { d: 'M12 5v2', key: 'grain-b' }],
  ['path', { d: 'm16 6.5-1 1.5', key: 'grain-c' }],
]);

export const Jar = createLucideIcon('rettich-jar', [
  ['path', { d: 'M7 3h10v3H7z', key: 'lid' }],
  [
    'path',
    {
      d: 'M6 6h12a1 1 0 0 1 1 1v12a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V7a1 1 0 0 1 1-1z',
      key: 'body',
    },
  ],
  ['path', { d: 'M5 11h14', key: 'label-a' }],
  ['path', { d: 'M5 16h14', key: 'label-b' }],
]);

export const Bottle = createLucideIcon('rettich-bottle', [
  [
    'path',
    {
      d: 'M10 2h4v3l1.5 2.5A3 3 0 0 1 16 9v11a2 2 0 0 1-2 2h-4a2 2 0 0 1-2-2V9a3 3 0 0 1 .5-1.5L10 5z',
      key: 'body',
    },
  ],
  ['path', { d: 'M8 13h8', key: 'label' }],
]);

export const SaltShaker = createLucideIcon('rettich-salt-shaker', [
  ['path', { d: 'M7 10h10v10a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2z', key: 'body' }],
  ['path', { d: 'M7 10a5 5 0 0 1 10 0', key: 'cap' }],
  ['path', { d: 'M10 7h.01', key: 'hole-a' }],
  ['path', { d: 'M14 7h.01', key: 'hole-b' }],
  ['path', { d: 'M12 5.5h.01', key: 'hole-c' }],
]);

export const PaperRoll = createLucideIcon('rettich-paper-roll', [
  ['ellipse', { cx: '8', cy: '12', rx: '4', ry: '7', key: 'end' }],
  ['ellipse', { cx: '8', cy: '12', rx: '1.25', ry: '2.25', key: 'core' }],
  ['path', { d: 'M8 5h9c2.2 0 4 3.1 4 7s-1.8 7-4 7H8', key: 'roll' }],
]);

/** A picture for each category of the catalog (ids from `packages/core/src/catalog`). */
export const CATEGORY_ICONS: Readonly<Record<string, LucideIcon>> = {
  'dairy-milk': Milk,
  'dairy-uht-milk': Milk,
  'dairy-cream': Milk,
  'dairy-yoghurt': Yoghurt,
  'dairy-butter': Butter,
  'dairy-cheese-hard': Cheese,
  'dairy-cheese-soft': Cheese,
  'dairy-cheese-slices': Cheese,
  'dairy-eggs': Egg,
  'meat-poultry': Drumstick,
  'meat-minced': Beef,
  'meat-fresh': Beef,
  'meat-coldcuts': Ham,
  'meat-sausage': Sausage,
  'fish-fresh': Fish,
  'fish-smoked-salmon': Fish,
  'produce-salad': Salad,
  'produce-tomatoes': Tomato,
  'produce-cucumber': Cucumber,
  'produce-carrots': Carrot,
  'produce-potatoes': Potato,
  'produce-onions': Onion,
  'produce-mushrooms': Mushroom,
  'produce-berries': Cherry,
  'produce-apples': Apple,
  'produce-bananas': Banana,
  'produce-citrus': Citrus,
  'produce-herbs': Sprout,
  'produce-avocado': Avocado,
  'produce-fruit': Grape,
  'produce-vegetables': LeafyGreen,
  'bakery-bread': Bread,
  'bakery-toast': Sandwich,
  'bakery-pastry': Croissant,
  'bakery-homemade': Cake,
  'pantry-pasta': Pasta,
  'pantry-rice': GrainBowl,
  'pantry-flour': Wheat,
  'pantry-canned': Cylinder,
  'pantry-sauces': Jar,
  'pantry-tomato-paste': Tomato,
  'pantry-cereal': GrainBowl,
  'pantry-oil': Bottle,
  'pantry-spices': SaltShaker,
  'pantry-coffee-tea': Coffee,
  'pantry-sweets': Candy,
  'pantry-other': ShoppingBasket,
  'frozen-vegetables': LeafyGreen,
  'frozen-meals': Pizza,
  'frozen-icecream': IceCreamCone,
  'drinks-juice': GlassWater,
  'drinks-soft': CupSoda,
  'drinks-alcohol': Wine,
  'prepared-leftovers': CookingPot,
  'prepared-ready-meals': Soup,
  'prepared-desserts': CakeSlice,
  'prepared-dips': Jar,
  'prepared-tofu': Vegan,
  'reserve-freeze-dried': Tent,
  'reserve-rations': Backpack,
  'reserve-water': Droplets,
  'nonfood-toilet-paper': PaperRoll,
  'nonfood-cleaning': SprayCan,
  'nonfood-hygiene': Bubbles,
  'nonfood-pet-food': PawPrint,
};

/** The picture of a category; an unknown one (an old export, a new id) gets the basket. */
export function categoryIcon(categoryId: string): LucideIcon {
  return CATEGORY_ICONS[categoryId] ?? ShoppingBasket;
}
