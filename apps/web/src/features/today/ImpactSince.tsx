import { useLiveQuery } from 'dexie-react-hooks';
import { useAppData } from '../../app/AppData';
import { messages } from '../../app/messages.de-CH';
import { useMoney } from '../../app/money';
import { Card } from '../../ui/Card';

const t = messages.today.impactSince;

/**
 * «Seit deinem ersten Monat entsorgst du 38 % weniger» (G1, ADR-0050): last completed month
 * against the first one. Shown only with two full months; worse is said as plainly as better.
 */
export function ImpactSince() {
  const { householdId, inventory } = useAppData();
  const money = useMoney();
  const result = useLiveQuery(() => inventory['stats.impact']({ householdId }), [householdId]);
  const comparison = result?.comparison;
  if (comparison === undefined || comparison === null) {
    return null;
  }
  const now = money.format(comparison.lastWastedRappen);
  const first = money.format(comparison.firstWastedRappen);
  const percent = Math.abs(comparison.changePercent);
  return (
    <Card variant="tip">
      {comparison.changePercent < 0
        ? t.less(percent, now, first)
        : comparison.changePercent > 0
          ? t.more(percent, now, first)
          : t.same(now)}
    </Card>
  );
}
