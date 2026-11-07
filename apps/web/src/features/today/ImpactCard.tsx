import type { LocalDate } from '@fridgeai/core';
import { useLiveQuery } from 'dexie-react-hooks';
import { ChevronRight } from 'lucide-react';
import { Link } from 'react-router';
import { useAppData } from '../../app/AppData';
import { useMoney } from '../../app/money';
import { messages } from '../../app/messages.de-CH';
import { Card } from '../../ui/Card';

const t = messages.today;

/**
 * «Deine Wirkung diesen Monat» (step 6, US-06, ADR-0033): rescued (eaten or given away shortly
 * before expiry) against wasted, in the household currency and items, from `stats.waste`. Ordinary eating is not a
 * rescue and does not show. Hidden until something was rescued or thrown away in the period.
 */
export function ImpactCard({ from, to }: { from: LocalDate; to: LocalDate }) {
  const { householdId, inventory } = useAppData();
  const money = useMoney();
  const stats = useLiveQuery(
    () => inventory['stats.waste']({ householdId, from, to }),
    [householdId, from, to],
  );
  if (stats === undefined) {
    return null;
  }
  const total = stats.savedRappen + stats.wastedRappen;
  const count = stats.savedCount + stats.wastedCount;
  if (count === 0) {
    return null;
  }
  const percent =
    total === 0
      ? Math.round((100 * stats.savedCount) / count)
      : Math.round((100 * stats.savedRappen) / total);

  return (
    <Card>
      <h2 className="font-display text-xl font-semibold">{t.impactTitle}</h2>
      <dl className="mt-3 grid grid-cols-2 gap-3">
        <div className="rounded-xl bg-basil-50 p-3">
          <dt className="text-sm font-semibold text-basil-800">{t.saved}</dt>
          <dd className="font-display text-2xl font-semibold text-basil-800 tabular-nums">
            {money.format(stats.savedRappen)}
          </dd>
          <dd className="text-sm text-ink-muted">{t.savedCount(stats.savedCount)}</dd>
        </div>
        <div className="rounded-xl bg-surface-muted p-3">
          <dt className="text-sm font-semibold text-today">{t.wasted}</dt>
          <dd className="font-display text-2xl font-semibold text-today tabular-nums">
            {money.format(stats.wastedRappen)}
          </dd>
          <dd className="text-sm text-ink-muted">{t.wastedCount(stats.wastedCount)}</dd>
        </div>
      </dl>
      <div
        role="img"
        aria-label={t.savedShare(percent)}
        className="mt-3 h-2 overflow-hidden rounded-full bg-today-bg"
      >
        <div
          className="h-full rounded-full bg-basil-600"
          style={{ width: `${String(percent)}%` }}
        />
      </div>
      <p className="mt-1 text-sm text-ink-muted">
        {t.savedShare(percent)} {t.ofAtRisk}
        {stats.estimated ? ` · ${t.estimated}` : null}
      </p>
      <Link
        to="/more/history"
        className="mt-2 -mb-1 inline-flex min-h-11 items-center gap-0.5 font-semibold text-basil-700"
      >
        {messages.history.link}
        <ChevronRight size={18} aria-hidden="true" />
      </Link>
    </Card>
  );
}
