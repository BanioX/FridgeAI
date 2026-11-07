import { formatChf, parseChf, type Rappen } from '@fridgeai/core';
import { useState } from 'react';
import { messages } from '../../app/messages.de-CH';

const t = messages.receiptUpload;

/**
 * A price on the receipt review that can be corrected with a tap (a photo read «9.99» for
 * «0.99»). Enter or leaving the field keeps a valid amount, Escape keeps the old one.
 */
export function PriceField({
  name,
  value,
  onChange,
}: {
  name: string;
  value: Rappen;
  onChange: (value: Rappen) => void;
}) {
  const [text, setText] = useState<string | null>(null);
  const shown = formatChf(value, { currency: false });

  if (text === null) {
    return (
      <button
        type="button"
        aria-label={t.editPrice(name, shown)}
        onClick={() => {
          setText(shown);
        }}
        className="min-h-11 shrink-0 rounded-lg px-2 font-semibold tabular-nums underline decoration-dotted underline-offset-4 hover:bg-surface-muted focus-visible:outline-2"
      >
        {shown}
      </button>
    );
  }

  const keep = () => {
    const parsed = parseChf(text);
    if (parsed !== null && parsed >= 0) {
      onChange(parsed);
    }
    setText(null);
  };
  return (
    <input
      // The field appears because the person tapped the price: focus belongs there.
      autoFocus
      aria-label={t.priceLabel(name)}
      value={text}
      inputMode="decimal"
      onChange={(event) => {
        setText(event.target.value);
      }}
      onBlur={keep}
      onKeyDown={(event) => {
        if (event.key === 'Enter') {
          keep();
        } else if (event.key === 'Escape') {
          setText(null);
        }
      }}
      className="min-h-11 w-20 shrink-0 rounded-lg border border-basil-600 bg-surface px-2 text-right font-semibold tabular-nums outline-none"
    />
  );
}
