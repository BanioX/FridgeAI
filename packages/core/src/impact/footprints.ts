/**
 * Environmental footprints per kilogram of food (ADR-0057).
 *
 * Source: Clark, M., Springmann, M., Rayner, M., Scarborough, P., Hill, J., Tilman, D.,
 * Macdiarmid, J.I., Fanzo, J., Bidoglio, G. (2022): «Estimating the environmental impacts of
 * 57,000 food products», PNAS 119(33), https://www.pnas.org/doi/full/10.1073/pnas.2120584119.
 * The values come from the dataset published by Our World in Data (owid-datasets), licence
 * CC BY 4.0: attribution is required, shown as «Daten: Clark et al. (2022), PNAS, via Our World in
 * Data, CC BY 4.0» (see `FOOTPRINT_ATTRIBUTION`). Extracted on 12.11.2026 from the prepared file
 * with 211 product types; only the rows that a Rettich category maps to are copied here.
 *
 * - `ghgKgCo2ePerKg`: greenhouse gas emissions in kg CO2-equivalents per kg of product
 * - `waterLitresPerKg`: freshwater withdrawals in litres per kg of product
 * - `landM2PerKg`: land use in m² per kg of product
 *
 * The dataset has no energy figure; none is made up here.
 *
 * Values are used as published. Doubtful ones (not corrected, see ADR-0057): Butter 3.325 looks
 * low next to the cheeses; Lettuce 4.926 looks high next to other vegetables; Beef mince 95.0 kg
 * CO2e and 295 m² per kg are far above usual literature values; Cow's milk 3.703 is above most
 * milk figures.
 */
export interface FootprintPerKg {
  ghgKgCo2ePerKg: number;
  waterLitresPerKg: number;
  landM2PerKg: number;
}

export const FOOTPRINT_SOURCE = {
  citation:
    'Clark et al. (2022), «Estimating the environmental impacts of 57,000 food products», PNAS 119(33)',
  url: 'https://www.pnas.org/doi/full/10.1073/pnas.2120584119',
  dataset: 'Our World in Data (owid-datasets)',
  licence: 'CC BY 4.0',
  extractedOn: '2026-11-12',
} as const;

/** The attribution CC BY 4.0 asks for; shown wherever the figures are explained. */
export const FOOTPRINT_ATTRIBUTION =
  'Daten: Clark et al. (2022), PNAS, via Our World in Data, CC BY 4.0';

export const FOOTPRINTS = {
  "Cow's milk": { ghgKgCo2ePerKg: 3.703, waterLitresPerKg: 309.8, landM2PerKg: 4.068 },
  Yoghurt: { ghgKgCo2ePerKg: 3.112, waterLitresPerKg: 311.7, landM2PerKg: 3.21 },
  Butter: { ghgKgCo2ePerKg: 3.325, waterLitresPerKg: 271.6, landM2PerKg: 3.62 },
  'Cheddar cheese': { ghgKgCo2ePerKg: 20.749, waterLitresPerKg: 1939.9, landM2PerKg: 24.451 },
  'Mozzarella cheese': { ghgKgCo2ePerKg: 16.233, waterLitresPerKg: 1507.4, landM2PerKg: 19.061 },
  Eggs: { ghgKgCo2ePerKg: 4.437, waterLitresPerKg: 830.0, landM2PerKg: 6.825 },
  'Chicken breast': { ghgKgCo2ePerKg: 9.272, waterLitresPerKg: 563.9, landM2PerKg: 9.221 },
  'Beef mince': { ghgKgCo2ePerKg: 95.035, waterLitresPerKg: 2493.9, landM2PerKg: 295.254 },
  'Pork loin': { ghgKgCo2ePerKg: 11.977, waterLitresPerKg: 1611.2, landM2PerKg: 16.464 },
  Bacon: { ghgKgCo2ePerKg: 19.314, waterLitresPerKg: 1649.7, landM2PerKg: 42.332 },
  'Pork sausages': { ghgKgCo2ePerKg: 9.768, waterLitresPerKg: 1292.2, landM2PerKg: 13.56 },
  Salmon: { ghgKgCo2ePerKg: 10.413, waterLitresPerKg: 1360.7, landM2PerKg: 4.748 },
  Lettuce: { ghgKgCo2ePerKg: 4.926, waterLitresPerKg: 295.0, landM2PerKg: 6.781 },
  Tomatoes: { ghgKgCo2ePerKg: 2.272, waterLitresPerKg: 291.7, landM2PerKg: 0.889 },
  Cucumber: { ghgKgCo2ePerKg: 0.847, waterLitresPerKg: 318.8, landM2PerKg: 1.08 },
  Carrots: { ghgKgCo2ePerKg: 0.935, waterLitresPerKg: 14.9, landM2PerKg: 1.602 },
  Potatoes: { ghgKgCo2ePerKg: 0.207, waterLitresPerKg: 80.8, landM2PerKg: 0.804 },
  Onions: { ghgKgCo2ePerKg: 0.363, waterLitresPerKg: 53.9, landM2PerKg: 0.395 },
  Mushrooms: { ghgKgCo2ePerKg: 2.353, waterLitresPerKg: 1459.1, landM2PerKg: 2.872 },
  Strawberries: { ghgKgCo2ePerKg: 3.242, waterLitresPerKg: 349.2, landM2PerKg: 3.447 },
  Apples: { ghgKgCo2ePerKg: 0.507, waterLitresPerKg: 90.3, landM2PerKg: 0.669 },
  Bananas: { ghgKgCo2ePerKg: 0.873, waterLitresPerKg: 52.1, landM2PerKg: 2.64 },
  Oranges: { ghgKgCo2ePerKg: 0.467, waterLitresPerKg: 115.5, landM2PerKg: 0.666 },
  'Mixed salad': { ghgKgCo2ePerKg: 0.921, waterLitresPerKg: 343.1, landM2PerKg: 1.161 },
  Avocados: { ghgKgCo2ePerKg: 0.921, waterLitresPerKg: 367.4, landM2PerKg: 1.249 },
  Pears: { ghgKgCo2ePerKg: 0.926, waterLitresPerKg: 783.3, landM2PerKg: 1.013 },
  Peppers: { ghgKgCo2ePerKg: 0.919, waterLitresPerKg: 362.9, landM2PerKg: 1.24 },
  Bread: { ghgKgCo2ePerKg: 0.879, waterLitresPerKg: 241.9, landM2PerKg: 2.241 },
  Croissants: { ghgKgCo2ePerKg: 1.682, waterLitresPerKg: 366.3, landM2PerKg: 3.67 },
  Spaghetti: { ghgKgCo2ePerKg: 1.646, waterLitresPerKg: 501.0, landM2PerKg: 3.815 },
  Rice: { ghgKgCo2ePerKg: 3.926, waterLitresPerKg: 2114.4, landM2PerKg: 2.937 },
  Sugar: { ghgKgCo2ePerKg: 1.852, waterLitresPerKg: 1202.4, landM2PerKg: 2.154 },
  Chickpeas: { ghgKgCo2ePerKg: 1.344, waterLitresPerKg: 161.4, landM2PerKg: 15.566 },
  'Tomato ketchup': { ghgKgCo2ePerKg: 2.61, waterLitresPerKg: 495.0, landM2PerKg: 1.668 },
  'Breakfast cereal': { ghgKgCo2ePerKg: 1.493, waterLitresPerKg: 502.1, landM2PerKg: 2.895 },
  'Olive oil': { ghgKgCo2ePerKg: 5.185, waterLitresPerKg: 1411.2, landM2PerKg: 21.708 },
  'Sunflower seeds': { ghgKgCo2ePerKg: 1.934, waterLitresPerKg: 14.3, landM2PerKg: 10.98 },
  'Coffee beans': { ghgKgCo2ePerKg: 16.825, waterLitresPerKg: 16.2, landM2PerKg: 19.392 },
  'Milk chocolate': { ghgKgCo2ePerKg: 10.8, waterLitresPerKg: 551.8, landM2PerKg: 17.274 },
  'Garden peas': { ghgKgCo2ePerKg: 1.004, waterLitresPerKg: 346.8, landM2PerKg: 6.608 },
  'Vegetarian pizza': { ghgKgCo2ePerKg: 5.233, waterLitresPerKg: 579.3, landM2PerKg: 6.521 },
  'Ice cream': { ghgKgCo2ePerKg: 3.662, waterLitresPerKg: 463.3, landM2PerKg: 5.287 },
  'Orange juice': { ghgKgCo2ePerKg: 0.489, waterLitresPerKg: 142.7, landM2PerKg: 0.705 },
  'Apple juice': { ghgKgCo2ePerKg: 0.458, waterLitresPerKg: 122.3, landM2PerKg: 0.661 },
  Beer: { ghgKgCo2ePerKg: 0.686, waterLitresPerKg: 122.4, landM2PerKg: 0.828 },
  'Sponge cake': { ghgKgCo2ePerKg: 1.877, waterLitresPerKg: 487.9, landM2PerKg: 2.396 },
  'Chicken pasta': { ghgKgCo2ePerKg: 2.947, waterLitresPerKg: 310.0, landM2PerKg: 3.575 },
  Cheesecake: { ghgKgCo2ePerKg: 2.369, waterLitresPerKg: 460.8, landM2PerKg: 2.587 },
  Tofu: { ghgKgCo2ePerKg: 1.021, waterLitresPerKg: 31.2, landM2PerKg: 3.035 },
  'Vegetarian curry': { ghgKgCo2ePerKg: 1.309, waterLitresPerKg: 374.8, landM2PerKg: 2.275 },
  'Cracker biscuits': { ghgKgCo2ePerKg: 2.448, waterLitresPerKg: 787.9, landM2PerKg: 4.458 },
} as const satisfies Record<string, FootprintPerKg>;

/** An entity name of the Clark et al. dataset that Rettich uses. */
export type FootprintEntity = keyof typeof FOOTPRINTS;
