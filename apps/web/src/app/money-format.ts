import {
  currencySymbol,
  DEFAULT_CURRENCY,
  formatMoney,
  parseMoney,
  type CurrencyCode,
  type Rappen,
} from '@fridgeai/core';

/** Amounts in one currency (ADR-0019): format, read typed input, show the symbol. */
export function moneyIn(currency: CurrencyCode) {
  return {
    currency,
    symbol: currencySymbol(currency),
    format: (amount: Rappen, options?: { currency?: boolean }) =>
      formatMoney(amount, currency, options),
    parse: (input: string) => parseMoney(input, currency),
  };
}

export type Money = ReturnType<typeof moneyIn>;

/** Francs, for the pilot households and tests. */
export const CHF_MONEY: Money = moneyIn(DEFAULT_CURRENCY);
