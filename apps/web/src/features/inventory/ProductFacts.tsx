import { formatDecimal, type InventoryItemView, type Nutrition } from '@fridgeai/core';
import { ChevronDown } from 'lucide-react';
import { messages } from '../../app/messages.de-CH';

const t = messages.productFacts;
const NUTRIENTS = [
  'energyKcal',
  'fat',
  'saturatedFat',
  'carbohydrates',
  'sugars',
  'fiber',
  'protein',
  'salt',
] as const satisfies readonly (keyof Nutrition)[];
const INDENTED = new Set<string>(['saturatedFat', 'sugars']);

/** Nutri-Score colours (A dark green … E red) with text that keeps 4.5:1 contrast on each. */
const GRADE_CLASSES = {
  a: 'bg-[#038141] text-white',
  b: 'bg-[#85bb2f] text-black',
  c: 'bg-[#fecb02] text-black',
  d: 'bg-[#ee8100] text-black',
  e: 'bg-[#e63e11] text-black',
} as const;

/** The 14 allergens of Swiss and EU labelling law by name; unknown tags are left out. */
function allergenNames(tags: readonly string[]): string[] {
  return tags.flatMap((tag) => {
    const name = t.allergenNames[tag];
    return name === undefined ? [] : [name];
  });
}

/**
 * Nutrition per 100 g/ml, Nutri-Score and allergens of a scanned product (step 10b), folded away
 * by default: the detail page is about what to do with the food. Data from Open Food Facts carry
 * the ODbL attribution.
 */
export function ProductFacts({ item }: { item: InventoryItemView }) {
  const { nutrition, nutriScore } = item;
  const allergens = allergenNames(item.allergens ?? []);
  const rows = NUTRIENTS.flatMap((key) => {
    const value = nutrition?.[key];
    return value === undefined ? [] : [{ key, value }];
  });
  if (rows.length === 0 && nutriScore === undefined && allergens.length === 0) {
    return null;
  }
  return (
    <details className="group rounded-2xl border border-line bg-surface p-5 shadow-card">
      <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-3 font-semibold">
        <span>{t.title}</span>
        <span className="flex items-center gap-2">
          {nutriScore === undefined ? null : (
            <span
              className={`rounded-full px-3 py-1 text-sm font-bold ${GRADE_CLASSES[nutriScore]}`}
            >
              {t.nutriScore(nutriScore.toUpperCase())}
            </span>
          )}
          <ChevronDown
            size={20}
            aria-hidden="true"
            className="text-ink-muted transition-transform group-open:rotate-180"
          />
        </span>
      </summary>
      <div className="mt-3 space-y-4">
        {rows.length === 0 || nutrition === undefined ? null : (
          <table className="w-full text-sm tabular-nums">
            <caption className="mb-1 text-left text-ink-muted">{t.per[nutrition.basis]}</caption>
            <tbody>
              {rows.map(({ key, value }) => (
                <tr key={key} className="border-t border-line/70">
                  <th
                    scope="row"
                    className={`py-1.5 text-left font-normal ${INDENTED.has(key) ? 'pl-4 text-ink-muted' : ''}`}
                  >
                    {t.nutrients[key]}
                  </th>
                  <td className="py-1.5 text-right">
                    {formatDecimal(value, { digits: 1 })} {key === 'energyKcal' ? 'kcal' : 'g'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        {allergens.length === 0 ? null : (
          <p className="text-sm">
            <span className="font-semibold">{t.allergens}:</span> {allergens.join(', ')}
          </p>
        )}
        <p className="text-xs text-ink-muted">
          {t.hint}{' '}
          {item.productSource === 'off' ? (
            <a
              href="https://world.openfoodfacts.org"
              target="_blank"
              rel="noopener noreferrer"
              className="underline underline-offset-2"
            >
              {messages.scanner.attribution}
            </a>
          ) : null}
        </p>
      </div>
    </details>
  );
}
