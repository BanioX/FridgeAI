import { formatSwissDate } from '@fridgeai/core';
import { useLiveQuery } from 'dexie-react-hooks';
import { useAppData } from '../../app/AppData';
import { useMoney } from '../../app/money';
import { messages } from '../../app/messages.de-CH';

const t = messages.priceMemory;
const PER = { pcs: '', g: '/kg', ml: '/l' } as const;

/**
 * The price memory of a product (ADR-0029) in one line: last paid with shop and date, the usual
 * price and, if lower, the cheapest shop lately. Nothing until the product appears on a receipt.
 */
export function PriceMemoryNote({ name }: { name: string }) {
  const { householdId, inventory } = useAppData();
  const money = useMoney();
  const words = name.trim().slice(0, 120);
  const memory = useLiveQuery(
    async () =>
      words.length < 2
        ? undefined
        : (await inventory['prices.memory']({ householdId, names: [words] })).products[0],
    [householdId, words],
  );
  const last = memory?.last;
  if (memory === undefined || last === undefined) {
    return null;
  }
  const price = (rappen: typeof last.unitPriceRappen) =>
    `${money.format(rappen, { currency: false })}${PER[last.unit]}`;
  const cheapest = memory.cheapest;
  const parts = [
    t.last(price(last.unitPriceRappen), t.shops[last.retailer], formatSwissDate(last.purchasedOn)),
    memory.usualUnitPriceRappen === undefined
      ? undefined
      : t.usual(price(memory.usualUnitPriceRappen)),
    cheapest === undefined || cheapest.unitPriceRappen >= last.unitPriceRappen
      ? undefined
      : t.cheapest(price(cheapest.unitPriceRappen), t.shops[cheapest.retailer]),
  ];
  return <p className="text-sm text-ink-muted">{parts.filter(Boolean).join(' · ')}</p>;
}
