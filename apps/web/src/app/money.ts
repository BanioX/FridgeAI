import { useMemo } from 'react';
import { useAppData } from './AppData';
import { moneyIn, type Money } from './money-format';

export type { Money } from './money-format';

/** Amounts in the household currency (ADR-0019). */
export function useMoney(): Money {
  const { currency } = useAppData();
  return useMemo(() => moneyIn(currency), [currency]);
}
