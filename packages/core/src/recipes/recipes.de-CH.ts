import { RecipeSchema, type Recipe } from './recipe';

/**
 * Curated recipes (plan 11b): Swiss everyday dishes, written for FridgeAI in plain words and
 * addressing one person with «du». Ingredients point to categories so the ranking finds the food
 * at home; staples (salt, oil, spices) are assumed. More recipes follow in their own PR.
 */
const RAW: unknown[] = [
  {
    id: 'spinat-ruehrei',
    title: 'Rührei mit Spinat',
    minutes: 10,
    servings: 1,
    tags: ['vegetarisch', 'schnell', 'eiweissreich'],
    ingredients: [
      { text: '3 Eier', categories: ['dairy-eggs'] },
      {
        text: '1 Handvoll Blattspinat oder Salat',
        categories: ['produce-salad'],
        words: ['spinat'],
      },
      { text: '1 EL Milch oder Rahm', categories: ['dairy-milk', 'dairy-cream'], optional: true },
      { text: 'Reibkäse', categories: ['dairy-cheese-hard'], optional: true },
      { text: 'Butter, Salz, Pfeffer', staple: true },
    ],
    steps: [
      'Spinat waschen und grob hacken.',
      'Eier mit Milch, Salz und Pfeffer verquirlen.',
      'Spinat in Butter kurz zusammenfallen lassen, Eier dazugeben und bei mittlerer Hitze stocken lassen.',
      'Mit Käse bestreuen und sofort essen.',
    ],
  },
  {
    id: 'gemuese-suppe',
    title: 'Gemüsesuppe aus allem, was weg muss',
    minutes: 30,
    servings: 3,
    tags: ['vegan'],
    ingredients: [
      { text: '2 Karotten', categories: ['produce-carrots'] },
      { text: '2 Kartoffeln', categories: ['produce-potatoes'] },
      { text: '1 Zwiebel', categories: ['produce-onions'] },
      {
        text: 'Gemüse nach Lust: Tomaten, Pilze, Spinat',
        categories: ['produce-tomatoes', 'produce-mushrooms', 'produce-salad', 'frozen-vegetables'],
        optional: true,
      },
      { text: 'Kräuter', categories: ['produce-herbs'], optional: true },
      { text: 'Öl, Bouillon, Salz, Pfeffer', staple: true },
    ],
    steps: [
      'Zwiebel hacken, Karotten und Kartoffeln würfeln, übriges Gemüse klein schneiden.',
      'Zwiebel in Öl andünsten, Gemüse kurz mitdünsten.',
      'Mit 1 l Bouillon auffüllen und 20 Minuten köcheln.',
      'Fein pürieren oder stückig lassen, abschmecken und mit Kräutern bestreuen.',
    ],
  },
  {
    id: 'bananen-pancakes',
    title: 'Bananen-Pancakes',
    minutes: 15,
    servings: 2,
    tags: ['vegetarisch', 'schnell'],
    ingredients: [
      { text: '2 reife Bananen', categories: ['produce-bananas'] },
      { text: '2 Eier', categories: ['dairy-eggs'] },
      { text: '1 dl Milch', categories: ['dairy-milk', 'dairy-uht-milk'] },
      { text: '100 g Mehl', staple: true },
      {
        text: 'Beeren oder Joghurt zum Servieren',
        categories: ['produce-berries', 'dairy-yoghurt'],
        optional: true,
      },
      { text: 'Butter zum Braten, 1 Prise Salz', staple: true },
    ],
    steps: [
      'Bananen mit einer Gabel zerdrücken.',
      'Eier, Milch, Mehl und Salz dazugeben und glatt rühren.',
      'Kleine Pancakes in Butter auf beiden Seiten goldbraun braten.',
      'Mit Beeren oder Joghurt servieren.',
    ],
  },
  {
    id: 'hackfleisch-teigwaren',
    title: 'Hörnli mit Gehacktem',
    minutes: 25,
    servings: 3,
    tags: ['eiweissreich'],
    ingredients: [
      { text: '400 g Hackfleisch', categories: ['meat-minced'] },
      { text: '300 g Hörnli', categories: ['pantry-pasta'] },
      { text: '1 Zwiebel', categories: ['produce-onions'] },
      { text: 'Reibkäse', categories: ['dairy-cheese-hard'], optional: true },
      { text: 'Apfelmus', categories: ['produce-apples'], words: ['apfelmus'], optional: true },
      { text: 'Öl, Bouillon, Salz, Pfeffer', staple: true },
    ],
    steps: [
      'Hörnli in Salzwasser kochen.',
      'Zwiebel hacken und in Öl andünsten, Hackfleisch dazugeben und krümelig anbraten.',
      'Mit wenig Bouillon ablöschen und würzen.',
      'Hörnli untermischen, mit Käse bestreuen; dazu passt Apfelmus.',
    ],
  },
  {
    id: 'brotauflauf',
    title: 'Süsser Brotauflauf',
    minutes: 45,
    servings: 3,
    tags: ['vegetarisch'],
    ingredients: [
      { text: '250 g altes Brot', categories: ['bakery-bread', 'bakery-toast', 'bakery-pastry'] },
      { text: '4 dl Milch', categories: ['dairy-milk', 'dairy-uht-milk'] },
      { text: '3 Eier', categories: ['dairy-eggs'] },
      { text: '2 Äpfel', categories: ['produce-apples'], optional: true },
      { text: 'Zucker, Zimt, Butter', staple: true },
    ],
    steps: [
      'Ofen auf 180 °C vorheizen, Brot in Würfel schneiden, Äpfel in Schnitze.',
      'Milch, Eier, 3 EL Zucker und Zimt verquirlen.',
      'Brot und Äpfel in eine gebutterte Form geben und den Guss darüber verteilen.',
      '30 Minuten backen, bis die Oberfläche goldbraun ist.',
    ],
  },
];

export const RECIPES: readonly Recipe[] = RAW.map((recipe) => RecipeSchema.parse(recipe));
