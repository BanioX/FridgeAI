import type { Id } from '@fridgeai/core';
import { useState } from 'react';
import { useAppData } from '../../app/AppData';
import { messages } from '../../app/messages.de-CH';
import { ChoiceChips } from '../../ui/ChoiceChips';

const t = messages.minStock;
const MAX = 20;
const QUICK = ['off', '1', '2', '3', 'more'] as const;
type Choice = (typeof QUICK)[number];
const options = QUICK.map((value) => ({
  value,
  label: value === 'off' ? t.off : value === 'more' ? t.more : value,
}));

/** The chip a stored minimum belongs to: 4 and more sit behind «mehr». */
function choiceOf(minStock: number | undefined): Choice {
  if (minStock === undefined) {
    return 'off';
  }
  return minStock <= 3 ? (String(minStock) as Choice) : 'more';
}

/** Whole number 1 to 20 or `null`. */
function parseMin(text: string): number | null {
  const value = Number(text.trim());
  return text.trim() !== '' && Number.isInteger(value) && value >= 1 && value <= MAX ? value : null;
}

/**
 * «Immer da haben» (ADR-0059): below this many active packs the product goes onto «Nachkaufen»
 * by itself. Chips «Aus», 1, 2, 3 and «mehr» (a number from 1 to 20).
 */
export function MinStockRow({
  productId,
  minStock,
}: {
  productId: Id;
  minStock: number | undefined;
}) {
  const { householdId, ids, inventory } = useAppData();
  const [asking, setAsking] = useState(false);
  const [text, setText] = useState('');
  const [failed, setFailed] = useState(false);
  const [busy, setBusy] = useState(false);
  const stored = choiceOf(minStock);
  const chosen: Choice = asking ? 'more' : stored;
  const invalid = asking && text.trim() !== '' && parseMin(text) === null;

  async function save(value: number | null) {
    if (busy) {
      return;
    }
    setBusy(true);
    setFailed(false);
    try {
      await inventory['products.setMinStock']({
        commandId: ids.next(),
        householdId,
        productId,
        minStock: value,
      });
    } catch {
      setFailed(true);
    } finally {
      setBusy(false);
    }
  }

  const choose = (value: Choice) => {
    if (value === 'more') {
      setAsking(true);
      setText(minStock !== undefined && minStock > 3 ? String(minStock) : '');
      return;
    }
    setAsking(false);
    void save(value === 'off' ? null : Number(value));
  };

  const commit = () => {
    const value = parseMin(text);
    if (value !== null && value !== minStock) {
      void save(value);
    }
  };

  const showInput = asking || stored === 'more';
  return (
    <div className="space-y-2">
      <ChoiceChips legend={t.legend} options={options} value={chosen} onChange={choose} />
      {showInput ? (
        <div className="space-y-1.5">
          <label htmlFor="min-stock-amount" className="block text-sm font-semibold">
            {t.amountLabel}
          </label>
          <input
            id="min-stock-amount"
            type="number"
            min={1}
            max={MAX}
            step={1}
            inputMode="numeric"
            autoComplete="off"
            value={asking ? text : String(minStock ?? '')}
            aria-invalid={invalid}
            onChange={(event) => {
              setAsking(true);
              setText(event.target.value);
            }}
            onBlur={commit}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                commit();
              }
            }}
            className={`min-h-12 w-28 rounded-xl border bg-surface px-4 text-lg tabular-nums outline-none focus:border-basil-600 ${
              invalid ? 'border-today' : 'border-line'
            }`}
          />
        </div>
      ) : null}
      <p className="text-sm text-ink-muted">{t.help}</p>
      <p role="status" className="text-sm text-today empty:hidden">
        {failed ? t.failed : null}
      </p>
    </div>
  );
}
