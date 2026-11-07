import {
  differenceFromUsual,
  formatChf,
  rappen,
  unitPrice,
  type OperationOutput,
  type ParsedReceiptLine,
} from '@fridgeai/core';
import { messages } from '../../app/messages.de-CH';

export type PriceMemory = OperationOutput<'prices.memory'>['products'][number];

const t = messages.receiptUpload;
const PER = { pcs: '', g: '/kg', ml: '/l' } as const;

/**
 * What the price memory says about a receipt line (ADR-0029): «12 % teurer als sonst» when the
 * usual price is known and clearly different, else what was paid last time.
 */
export function priceHint(
  line: ParsedReceiptLine,
  memory: PriceMemory | undefined,
): { text: string; tone: 'dearer' | 'cheaper' | 'info' } | null {
  const last = memory?.last;
  if (memory === undefined || last === undefined) {
    return null;
  }
  const perUnit = unitPrice({
    paidRappen: rappen(line.priceRappen + line.discountRappen),
    quantity: line.quantity,
    unit: line.unit,
  });
  if (perUnit !== null && memory.usualUnitPriceRappen !== undefined && last.unit === line.unit) {
    const percent = differenceFromUsual(perUnit, memory.usualUnitPriceRappen);
    if (percent !== null) {
      return percent > 0
        ? { text: t.dearer(percent), tone: 'dearer' }
        : { text: t.cheaper(-percent), tone: 'cheaper' };
    }
  }
  // «zuletzt 0.70/Stück» next to «2 Stück · 1.40», so the two numbers are not confused.
  const per = last.unit === 'pcs' && line.quantity !== 1 ? '/Stück' : PER[last.unit];
  const price = `${formatChf(last.unitPriceRappen, { currency: false })}${per}`;
  return { text: t.lastPaid(price, t.retailers[last.retailer]), tone: 'info' };
}
