import {
  formatDecimal,
  parseNutritionLabel,
  type InventoryItemView,
  type Nutrition,
} from '@fridgeai/core';
import { Camera, ChevronDown } from 'lucide-react';
import { useState } from 'react';
import { useAppData } from '../../app/AppData';
import { messages } from '../../app/messages.de-CH';
import { Button } from '../../ui/Button';

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
const MAX_BYTES = 15 * 1024 * 1024;

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

function NutritionTable({ nutrition }: { nutrition: Nutrition }) {
  const rows = NUTRIENTS.flatMap((key) => {
    const value = nutrition[key];
    return value === undefined ? [] : [{ key, value }];
  });
  if (rows.length === 0) {
    return null;
  }
  return (
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
  );
}

/**
 * Nutrition from a photo or screenshot of the label: read on the device with the receipt OCR
 * (ADR-0028), shown for a check, saved only on «Speichern». The picture is never stored or sent.
 */
function NutritionPhoto({ item }: { item: InventoryItemView }) {
  const { householdId, ids, inventory } = useAppData();
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState('');
  const [preview, setPreview] = useState<Nutrition | null>(null);

  async function read(file: File) {
    setPreview(null);
    if (file.size > MAX_BYTES) {
      setStatus(t.photo.tooLarge);
      return;
    }
    setBusy(true);
    setStatus(t.photo.reading);
    try {
      const { readImageText } = await import('../receipts/read-image');
      const parsed = parseNutritionLabel(await readImageText(file));
      setPreview(parsed);
      setStatus(parsed === null ? t.photo.notFound : t.photo.preview);
    } catch {
      setStatus(t.photo.failed);
    } finally {
      setBusy(false);
    }
  }

  async function save(nutrition: Nutrition) {
    setBusy(true);
    try {
      await inventory['products.setNutrition']({
        commandId: ids.next(),
        householdId,
        itemId: item.id,
        nutrition,
      });
      setPreview(null);
      setStatus('');
    } catch {
      setStatus(t.photo.saveFailed);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-ink-muted">{t.photo.missing}</p>
      <label className="inline-flex min-h-12 cursor-pointer items-center justify-center gap-2 rounded-xl border border-line bg-surface px-5 font-semibold text-ink transition-colors hover:bg-surface-muted has-disabled:cursor-not-allowed has-disabled:opacity-50 has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-basil-600">
        <Camera size={20} aria-hidden="true" />
        {t.photo.choose}
        <input
          type="file"
          accept="image/*"
          disabled={busy}
          className="sr-only"
          onChange={(event) => {
            const file = event.target.files?.[0];
            event.target.value = '';
            if (file !== undefined) {
              void read(file);
            }
          }}
        />
      </label>
      <p role="status" className="text-sm font-semibold text-basil-800">
        {status}
      </p>
      {preview === null ? null : (
        <div className="space-y-3">
          <NutritionTable nutrition={preview} />
          <div className="flex gap-3">
            <Button disabled={busy} onClick={() => void save(preview)}>
              {t.photo.save}
            </Button>
            <Button
              variant="secondary"
              disabled={busy}
              onClick={() => {
                setPreview(null);
                setStatus('');
              }}
            >
              {t.photo.discard}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Nutrition per 100 g/ml, Nutri-Score and allergens of a scanned product (step 10b), folded away
 * by default: the detail page is about what to do with the food. Data from Open Food Facts carry
 * the ODbL attribution.
 */
export function ProductFacts({ item }: { item: InventoryItemView }) {
  const { nutrition, nutriScore } = item;
  const allergens = allergenNames(item.allergens ?? []);
  const fromPhoto = nutrition?.source === 'manual';
  return (
    <details className="group rounded-2xl border border-line bg-surface p-5 shadow-card">
      <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-3 font-semibold">
        <span>{t.title}</span>
        <span className="flex items-center gap-2">
          {nutriScore === undefined ? null : (
            <span
              className={`rounded-full px-3 py-1 text-sm font-bold whitespace-nowrap ${GRADE_CLASSES[nutriScore]}`}
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
        {nutrition === undefined ? (
          <NutritionPhoto item={item} />
        ) : (
          <NutritionTable nutrition={nutrition} />
        )}
        {allergens.length === 0 ? null : (
          <p className="text-sm">
            <span className="font-semibold">{t.allergens}:</span> {allergens.join(', ')}
          </p>
        )}
        {nutrition === undefined && item.productSource !== 'off' ? null : (
          <p className="text-xs text-ink-muted">
            {fromPhoto ? t.photo.note : t.hint}{' '}
            {item.productSource === 'off' && !fromPhoto ? (
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
        )}
      </div>
    </details>
  );
}
